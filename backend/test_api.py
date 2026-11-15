import unittest
from unittest.mock import AsyncMock, patch

import httpx

from backend.main import CATALOG, FIXTURE, app

class PrototypeApiTest(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.client = httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test")

    async def asyncTearDown(self):
        await self.client.aclose()

    async def test_health_and_recommendation_order(self):
        self.assertEqual((await self.client.get("/api/prototype/health")).json()["data"], "simulated")
        data = (await self.client.post("/api/prototype/recommendations", json={"interests": [" VĂN HÓA ", "văn hóa"]})).json()
        self.assertEqual(data["recommendations"][0], {"placeId": "marble", "matchedInterests": ["văn hóa"]})
        self.assertEqual(data["dataKind"], "simulated")

    async def test_empty_and_unknown_interests_preserve_order(self):
        expected = [p["id"] for p in FIXTURE["snapshot"]["places"]]
        for interests in ([], ["không có"]):
            response = await self.client.post("/api/prototype/recommendations", json={"interests": interests})
            self.assertEqual([p["placeId"] for p in response.json()["recommendations"]], expected)

    async def test_scenario_is_exact_and_unmatched_is_not_a_plan(self):
        example = FIXTURE["scenarios"][0]
        body = {"scenarioId": example["id"], "request": example["request"]}
        self.assertEqual((await self.client.post("/api/prototype/scenarios", json=body)).json()["kind"], "supported")
        body["request"] = {**body["request"], "budgetVnd": 12345}
        self.assertEqual((await self.client.post("/api/prototype/scenarios", json=body)).json()["kind"], "unsupported")

    async def test_invalid_request_is_rejected(self):
        self.assertEqual((await self.client.post("/api/prototype/recommendations", json={"interests": "biển"})).status_code, 422)

    async def test_osm_catalog_supports_three_cities_and_matching(self):
        response = await self.client.get("/api/prototype/catalog/destinations")
        self.assertEqual(set(response.json()["destinations"]), {"Hà Nội", "Huế", "Đà Nẵng"})
        for destination in ("Hà Nội", "Huế", "Đà Nẵng"):
            response = await self.client.post("/api/prototype/catalog/recommendations", json={"destination": destination, "interests": ["VĂN HÓA"]})
            data = response.json()
            self.assertEqual(response.status_code, 200)
            self.assertEqual(len(data["places"]), 10)
            self.assertEqual(data["places"][0]["matchedInterests"], ["văn hóa"])
            self.assertTrue(all(p["verificationStatus"] == "unverified" and p["price"] is None and p["openingHours"] is None for p in data["places"]))
        hue_names = {p["name"] for p in CATALOG["destinations"]["Huế"]}
        self.assertTrue({"Lăng Tự Đức", "Lăng Dục Đức"}.issubset(hue_names))

    async def test_catalog_rejects_unknown_city(self):
        response = await self.client.post("/api/prototype/catalog/recommendations", json={"destination": "Nơi không có", "interests": []})
        self.assertEqual(response.status_code, 404)

    async def test_catalog_draft_keeps_two_tombs_distinct_and_distributes_by_date(self):
        response = await self.client.post("/api/prototype/catalog/draft", json={
            "destination": "Huế", "startDate": "2026-12-10", "endDate": "2026-12-11",
            "placeIds": ["node/669249193", "node/12411957519"],
        })
        self.assertEqual(response.status_code, 200)
        draft = response.json()
        self.assertEqual(draft["status"], "DRAFT_UNVALIDATED")
        self.assertEqual([day["places"][0]["name"] for day in draft["days"]], ["Lăng Tự Đức", "Lăng Dục Đức"])
        self.assertEqual([day["date"] for day in draft["days"]], ["2026-12-10", "2026-12-11"])

    async def test_catalog_draft_rejects_bad_dates_and_cross_city_places(self):
        body = {"destination": "Huế", "startDate": "2026-12-10", "endDate": "2026-12-11", "placeIds": ["node/669249193"]}
        for changes in ({"placeIds": []}, {"placeIds": ["node/669249193", "node/669249193"]},
                        {"endDate": "2027-01-01"}, {"endDate": "2026-12-09"}, {"placeIds": ["node/1036552571"]}):
            response = await self.client.post("/api/prototype/catalog/draft", json={**body, **changes})
            self.assertEqual(response.status_code, 422)

    async def test_route_rejects_unknown_ids(self):
        response = await self.client.post("/api/prototype/route", json={"placeIds": ["my-khe", "unknown"]})
        self.assertEqual(response.status_code, 422)
        cross_city = await self.client.post("/api/prototype/route", json={"placeIds": ["my-khe", "hue-tu-duc"]})
        self.assertEqual(cross_city.status_code, 422)

    async def test_city_routing_uses_correct_local_graph(self):
        result = httpx.Response(200, json={"paths": [{"distance": 10, "time": 1000, "points": {"coordinates": [[107.56, 16.43], [107.59, 16.45]]}}]}, request=httpx.Request("GET", "http://127.0.0.1:8993/route"))
        with patch("backend.main.httpx.AsyncClient") as factory:
            get = factory.return_value.__aenter__.return_value.get = AsyncMock(return_value=result)
            response = await self.client.post("/api/prototype/route", json={"placeIds": ["hue-tu-duc", "hue-duc-duc"]})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(get.call_args.args[0], "http://127.0.0.1:8993/route")

    async def test_route_uses_road_geometry_and_returns_metrics(self):
        result = httpx.Response(200, json={"paths": [{"distance": 1200, "time": 180000, "points": {"coordinates": [[108.24, 16.05], [108.23, 16.06], [108.22, 16.07]]}}]}, request=httpx.Request("GET", "http://127.0.0.1:8989/route"))
        with patch("backend.main.httpx.AsyncClient") as factory:
            factory.return_value.__aenter__.return_value.get = AsyncMock(return_value=result)
            response = await self.client.post("/api/prototype/route", json={"placeIds": ["my-khe", "han-market"]})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["legs"][0]["distanceMeters"], 1200)
        self.assertEqual(len(response.json()["legs"][0]["coordinates"]), 3)

    async def test_unavailable_router_is_not_a_straight_line(self):
        with patch("backend.main.httpx.AsyncClient") as factory:
            factory.return_value.__aenter__.return_value.get = AsyncMock(side_effect=httpx.ConnectError("offline"))
            response = await self.client.post("/api/prototype/route", json={"placeIds": ["my-khe", "han-market"]})
        self.assertEqual(response.status_code, 503)


if __name__ == "__main__":
    unittest.main()
