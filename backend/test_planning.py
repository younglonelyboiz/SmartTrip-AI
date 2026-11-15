"""Behavioral tests for request-driven city itineraries, independent of live routers."""
import unittest
from pydantic import ValidationError
from backend.planning_models import PlanRequest
from backend.planning_catalog import load_planning_catalog


class ContractTests(unittest.TestCase):
    def test_defaults_and_zero_budget(self):
        request = PlanRequest(destination="Huế", dayCount=3)
        self.assertIsNone(request.budgetVnd)
        self.assertEqual(request.schedule.start, "08:00")
        self.assertEqual(request.schedule.end, "22:00")
        self.assertEqual(request.schedule.lunch.start, "12:00")
        self.assertEqual(PlanRequest(destination="Huế", dayCount=1, budgetVnd=0).budgetVnd, 0)
        self.assertIsNone(PlanRequest(destination="Huế", dayCount=1, schedule={"lunch": None}).schedule.lunch)

    def test_invalid_inputs(self):
        cases = [{"dayCount": v} for v in (0, 15, 1.5, True)]
        cases += [{"budgetVnd": v} for v in (-1, 1.5, True)]
        cases += [{"destination": "unknown"}, {"mandatoryPlaceIds": ["node/669249193"] * 2},
                  {"schedule": {"start": "8:00"}}, {"schedule": {"start": "22:00", "end": "08:00"}},
                  {"schedule": {"start": "14:00"}}, {"schedule": {"lunch": {"start": "13:00", "end": "12:00"}}}]
        for change in cases:
            with self.subTest(change=change), self.assertRaises(ValidationError):
                PlanRequest(**{"destination": "Huế", "dayCount": 3, **change})

    def test_metadata_is_complete_and_distinct_from_osm(self):
        for city in ("Huế", "Hà Nội", "Đà Nẵng"):
            places, source, assumptions = load_planning_catalog(city)
            self.assertEqual(len(places), 10)
            self.assertEqual(len({p.osmId for p in places}), 10)
            self.assertIn("OpenStreetMap", source["name"])
            self.assertEqual(assumptions["transportVndPerKm"], 12000)
            for p in places:
                self.assertGreater(p.durationMinutes, 0)
                self.assertGreaterEqual(p.admissionVnd, 0)

from unittest.mock import patch
import httpx
from backend.planning_routing import build_matrix, fetch_selected_legs, RoutingUnavailable


class RoutingTests(unittest.IsolatedAsyncioTestCase):
    async def test_city_ports_directions_and_missing_route(self):
        for city, port in (("Đà Nẵng", 8989), ("Hà Nội", 8991), ("Huế", 8993)):
            places, _, _ = load_planning_catalog(city)
            points = places[:2]
            def handler(request):
                self.assertEqual(request.url.port, port)
                first = request.url.params.get_list("point")[0]
                distance = 100 if first.startswith(str(points[0].lat)) else 200
                return httpx.Response(200, json={"paths": [{"distance": distance, "time": distance * 1000}]})
            with patch("backend.planning_routing.make_client", return_value=httpx.AsyncClient(transport=httpx.MockTransport(handler))):
                matrix = await build_matrix(city, points)
            self.assertEqual(matrix[(points[0].osmId, points[1].osmId)].distanceMeters, 100)
            self.assertEqual(matrix[(points[1].osmId, points[0].osmId)].distanceMeters, 200)

    async def test_failure_is_not_fake_geometry(self):
        places, _, _ = load_planning_catalog("Huế")
        for body in ({"paths": [{"distance": -1, "time": 1}]}, {"paths": [{"distance": True, "time": 1}]},
                     {"paths": [{"distance": 1, "time": 1, "points": {"coordinates": [[999, 1], [1, 1]]}}]}):
            def handler(request):
                return httpx.Response(200, json=body)
            with patch("backend.planning_routing.make_client", return_value=httpx.AsyncClient(transport=httpx.MockTransport(handler))):
                with self.assertRaises(RoutingUnavailable):
                    await fetch_selected_legs("Huế", [(places[0], places[1])])

    async def test_no_connection_vs_service_error(self):
        places, _, _ = load_planning_catalog("Huế")
        def missing(request):
            return httpx.Response(400, json={"hints": [{"details": "com.graphhopper.util.exceptions.ConnectionNotFoundException"}]})
        with patch("backend.planning_routing.make_client", return_value=httpx.AsyncClient(transport=httpx.MockTransport(missing))):
            matrix = await build_matrix("Huế", places[:2])
        self.assertTrue(all(value is None for value in matrix.values()))
        def outage(request):
            return httpx.Response(503, json={})
        with patch("backend.planning_routing.make_client", return_value=httpx.AsyncClient(transport=httpx.MockTransport(outage))):
            with self.assertRaises(RoutingUnavailable):
                await build_matrix("Huế", places[:2])

from backend.planning import plan_itinerary
from backend.planning_models import RouteLeg, minute


def matrix_for(places, distance=1000, duration=600000):
    return {(a.osmId, b.osmId): RouteLeg(fromId=a.osmId, toId=b.osmId, distanceMeters=distance, durationMs=duration)
            for a in places for b in places if a != b}


class PlannerTests(unittest.TestCase):
    def verify(self, result, places):
        self.assertEqual(result.status, "PLANNED_ESTIMATE", result.reason)
        by_id = {p.osmId: p for p in places}
        all_ids = [v.osmId for d in result.days for v in d.visits]
        self.assertEqual(len(all_ids), len(set(all_ids)))
        self.assertTrue(set(result.request.mandatoryPlaceIds) <= set(all_ids))
        total = 0
        for day in result.days:
            self.assertEqual(len(day.legs), max(0, len(day.visits) - 1))
            for v in day.visits:
                self.assertEqual(v.departure - v.arrival, by_id[v.osmId].durationMinutes)
                self.assertGreaterEqual(v.arrival, minute(by_id[v.osmId].visitWindow.start))
                self.assertLessEqual(v.departure, minute(by_id[v.osmId].visitWindow.end))
            for previous, leg, following in zip(day.visits, day.legs, day.visits[1:]):
                self.assertEqual((leg.fromId, leg.toId), (previous.osmId, following.osmId))
                self.assertGreaterEqual(leg.departure, previous.departure)
                self.assertGreaterEqual(following.arrival, leg.arrival)
            for start, end in [(v.arrival, v.departure) for v in day.visits] + [(l.departure, l.arrival) for l in day.legs]:
                self.assertGreaterEqual(start, minute(result.request.schedule.start))
                self.assertLessEqual(end, minute(result.request.schedule.end))
                lunch = result.request.schedule.lunch
                if lunch:
                    self.assertFalse(start < minute(lunch.end) and end > minute(lunch.start))
            total += sum(v.admissionVnd for v in day.visits) + sum(l.transportVnd for l in day.legs)
        self.assertEqual(total, result.totals.totalVnd)
        if result.request.budgetVnd is not None:
            self.assertLessEqual(total, result.request.budgetVnd)

    def test_three_cities_generated_and_mandatory(self):
        for city in ("Hà Nội", "Huế", "Đà Nẵng"):
            places, _, _ = load_planning_catalog(city)
            for mandatory in ([], [places[0].osmId, places[1].osmId]):
                req = PlanRequest(destination=city, dayCount=3, mandatoryPlaceIds=mandatory)
                result = plan_itinerary(req, places, matrix_for(places))
                self.verify(result, places)
                self.assertEqual(result.coverage.plannedDays, 3)

    def test_budget_zero_and_empty_days(self):
        places, _, _ = load_planning_catalog("Huế")
        req = PlanRequest(destination="Huế", dayCount=14, budgetVnd=0)
        result = plan_itinerary(req, places, matrix_for(places))
        self.verify(result, places)
        self.assertLess(result.coverage.plannedDays, 14)
        self.assertEqual(result.totals.totalVnd, 0)
        self.assertTrue(all(not d.legs for d in result.days))

    def test_proven_conflicts_and_search_limit(self):
        places, _, _ = load_planning_catalog("Huế")
        for mandatory, budget in (([places[0].osmId], 1), ([places[2].osmId, places[3].osmId], None)):
            result = plan_itinerary(PlanRequest(destination="Huế", dayCount=1, budgetVnd=budget, mandatoryPlaceIds=mandatory), places, matrix_for(places))
            self.assertEqual(result.status, "INFEASIBLE")
            self.assertEqual(result.days, [])
        req = PlanRequest(destination="Huế", dayCount=1, mandatoryPlaceIds=[places[0].osmId])
        self.assertEqual(plan_itinerary(req, places, matrix_for(places), max_expansions=0).status, "SEARCH_LIMIT")

    def test_optional_hours_and_unconnected_routes(self):
        places, _, _ = load_planning_catalog("Huế")
        req = PlanRequest(destination="Huế", dayCount=1, schedule={"start": "11:00", "end": "17:00", "lunch": None})
        self.verify(plan_itinerary(req, places, matrix_for(places)), places)
        req = PlanRequest(destination="Huế", dayCount=1, mandatoryPlaceIds=[places[0].osmId, places[1].osmId])
        missing = {key: None for key in matrix_for(places)}
        self.assertEqual(plan_itinerary(req, places, missing).status, "SEARCH_LIMIT")

    def test_visit_and_travel_do_not_cross_lunch(self):
        places, _, _ = load_planning_catalog("Huế")
        req = PlanRequest(destination="Huế", dayCount=1, schedule={"start": "11:00", "end": "17:00"}, mandatoryPlaceIds=[places[0].osmId, places[1].osmId])
        result = plan_itinerary(req, places[:2], matrix_for(places[:2], duration=3600000))
        self.verify(result, places[:2])

from unittest.mock import AsyncMock
from backend.main import app
from backend.planning import create_plan


class ApiPlanningTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.client = httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test")

    async def asyncTearDown(self):
        await self.client.aclose()

    async def test_api_generated_and_invalid_ids(self):
        places, _, _ = load_planning_catalog("Huế")
        with patch("backend.planning.build_matrix", AsyncMock(return_value=matrix_for(places))), patch("backend.planning.fetch_selected_legs", AsyncMock(side_effect=lambda city, pairs: [RouteLeg(fromId=a.osmId, toId=b.osmId, distanceMeters=1000, durationMs=600000, coordinates=[[a.lon,a.lat],[b.lon,b.lat]]) for a,b in pairs])):
            response = await self.client.post("/api/prototype/catalog/plan", json={"destination": "Huế", "dayCount": 3})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "PLANNED_ESTIMATE")
        self.assertTrue(response.json()["assumptions"]["notice"])
        invalid = await self.client.post("/api/prototype/catalog/plan", json={"destination": "Huế", "dayCount": 3, "mandatoryPlaceIds": ["node/1036552571"]})
        self.assertEqual(invalid.status_code, 422)

    async def test_outage_and_geometry_failure(self):
        places, _, _ = load_planning_catalog("Huế")
        with patch("backend.planning.build_matrix", AsyncMock(side_effect=RoutingUnavailable("offline"))):
            response = await self.client.post("/api/prototype/catalog/plan", json={"destination": "Huế", "dayCount": 3})
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()["days"], [])
        with patch("backend.planning.build_matrix", AsyncMock(return_value=matrix_for(places))), patch("backend.planning.fetch_selected_legs", AsyncMock(side_effect=RoutingUnavailable("geometry missing"))):
            result = await create_plan(PlanRequest(destination="Huế", dayCount=1, mandatoryPlaceIds=[p.osmId for p in places[:2]]))
        self.assertEqual(result.status, "ROUTING_UNAVAILABLE")
        self.assertEqual(result.days, [])

    async def test_bad_catalog_does_not_become_free_plan(self):
        with patch("backend.planning.load_planning_catalog", side_effect=ValueError("missing metadata")):
            result = await create_plan(PlanRequest(destination="Huế", dayCount=3))
        self.assertEqual(result.status, "DATA_ERROR")
        self.assertIsNone(result.totals)

    async def test_changed_route_metrics_are_rejected(self):
        places, _, _ = load_planning_catalog("Huế")
        changed = [RouteLeg(fromId=places[0].osmId, toId=places[1].osmId, distanceMeters=99999, durationMs=600000)] * 10
        with patch("backend.planning.build_matrix", AsyncMock(return_value=matrix_for(places))), patch("backend.planning.fetch_selected_legs", AsyncMock(return_value=changed)):
            result = await create_plan(PlanRequest(destination="Huế", dayCount=1, mandatoryPlaceIds=[p.osmId for p in places[:2]]))
        self.assertEqual(result.status, "ROUTING_UNAVAILABLE")


class PartialRoutingTests(unittest.IsolatedAsyncioTestCase):
    async def test_unrelated_optional_pair_failure_does_not_abort_plan(self):
        from backend import planning_routing
        # IsolatedAsyncio creates a new loop; reset its worker-local limiter.
        import asyncio
        places, _, _ = load_planning_catalog("Huế")
        a, b = places[-2:]
        def handler(request):
            origins = request.url.params.get_list("point")
            if origins == [f"{a.lat},{a.lon}", f"{b.lat},{b.lon}"]:
                return httpx.Response(500)
            geometry = {"points": {"coordinates": [[107.5,16.4],[107.6,16.5]]}} if request.url.params["calc_points"] == "true" else {}
            return httpx.Response(200, json={"paths": [{"distance": 1000, "time": 600000, **geometry}]})
        with patch.object(planning_routing, "_SEMAPHORE", asyncio.Semaphore(6)), patch("backend.planning_routing.make_client", side_effect=lambda: httpx.AsyncClient(transport=httpx.MockTransport(handler))):
            result = await create_plan(PlanRequest(destination="Huế", dayCount=3, mandatoryPlaceIds=[places[0].osmId]))
        self.assertEqual(result.status, "PLANNED_ESTIMATE", result.reason)

    async def test_nonobject_error_body_is_structured(self):
        places, _, _ = load_planning_catalog("Huế")
        with patch("backend.planning_routing.make_client", return_value=httpx.AsyncClient(transport=httpx.MockTransport(lambda r: httpx.Response(400,json=[])))):
            with self.assertRaises(RoutingUnavailable):
                await build_matrix("Huế", places[:2])


class RoutingLimitsTests(unittest.IsolatedAsyncioTestCase):
    async def test_concurrency_is_bounded_and_timeout_cancels_children(self):
        import asyncio
        from backend import planning_routing
        places, _, _ = load_planning_catalog("Huế")
        active = peak = cancelled = 0
        async def handler(request):
            nonlocal active, peak, cancelled
            active += 1
            peak = max(peak, active)
            try:
                await asyncio.sleep(1)
                return httpx.Response(200, json={"paths": [{"distance": 1, "time": 1}]})
            except asyncio.CancelledError:
                cancelled += 1
                raise
            finally:
                active -= 1
        with patch.object(planning_routing, "_SEMAPHORE", asyncio.Semaphore(6)), patch.object(planning_routing, "ROUTING_TIMEOUT_SECONDS", 0.02), patch.object(planning_routing, "make_client", return_value=httpx.AsyncClient(transport=httpx.MockTransport(handler))):
            with self.assertRaises(RoutingUnavailable):
                await build_matrix("Huế", places)
        self.assertEqual(peak, 6)
        self.assertEqual(active, 0)
        self.assertEqual(cancelled, 6)

    async def test_nan_timeout_and_connect_error_are_structured(self):
        places, _, _ = load_planning_catalog("Huế")
        def nan(request):
            return httpx.Response(200, content=b'{"paths":[{"distance":NaN,"time":1}]}')
        for failure in (None, httpx.ConnectError("offline"), httpx.ReadTimeout("slow")):
            def handler(request):
                if failure:
                    raise failure
                return nan(request)
            with patch("backend.planning_routing.make_client", return_value=httpx.AsyncClient(transport=httpx.MockTransport(handler))):
                with self.assertRaises(RoutingUnavailable):
                    await build_matrix("Huế", places[:2])
