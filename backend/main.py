"""Local prototype API for fixture scenarios and an unverified OSM catalog."""

import asyncio
import json
import math
import unicodedata
from datetime import date, timedelta
from pathlib import Path
from typing import Any

import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, model_validator

FIXTURE_PATH = Path(__file__).resolve().parent.parent / "frontend/src/mocks/scenarios.json"
with FIXTURE_PATH.open(encoding="utf-8") as fixture_file:
    FIXTURE = json.load(fixture_file)
with (Path(__file__).resolve().parent / "catalog.json").open(encoding="utf-8") as catalog_file:
    CATALOG = json.load(catalog_file)

app = FastAPI(title="SmartTrip local prototype", version="0.1.0")

# Representative demo coordinates; these are not verified entrances.
ROUTE_POINTS = {
    "my-khe": (16.0547, 108.2473), "han-market": (16.0679, 108.2240),
    "marble": (15.9994, 108.2634), "museum": (16.0607, 108.2230),
    "son-tra": (16.1003, 108.2779), "bridge": (16.0611, 108.2300),
}
CITY_ROUTE_IDS = {
    "Hà Nội": {
        "hn-ho-guom": "node/443033827", "hn-hang-ngang": "node/445345255",
        "hn-dia-chat": "node/4499978190", "hn-cho-dem": "node/4489385889",
        "hn-chua-lang": "node/1498111667", "hn-lotte": "node/5406262022",
    },
    "Huế": {
        "hue-hoang-thanh": "node/5182931945", "hue-phan-boi-chau": "node/4555491489",
        "hue-tu-duc": "node/669249193", "hue-duc-duc": "node/12411957519",
        "hue-xa-tac": "node/6533792207", "hue-duong-xuan": "node/9960090217",
    },
}
ROUTE_PORTS = {"Đà Nẵng": 8989, "Hà Nội": 8991, "Huế": 8993}
ROUTE_CITIES = {place_id: "Đà Nẵng" for place_id in ROUTE_POINTS}
for city, id_mapping in CITY_ROUTE_IDS.items():
    catalog_places = {place["osmId"]: place for place in CATALOG["destinations"][city]}
    for place_id, osm_id in id_mapping.items():
        place = catalog_places[osm_id]
        ROUTE_POINTS[place_id] = (place["lat"], place["lon"])
        ROUTE_CITIES[place_id] = city


class RecommendationRequest(BaseModel):
    interests: list[str] = Field(default_factory=list, max_length=30)


class CatalogRequest(RecommendationRequest):
    destination: str


class DraftRequest(BaseModel):
    destination: str
    startDate: date
    endDate: date
    placeIds: list[str] = Field(min_length=1, max_length=30)

    @model_validator(mode="after")
    def validate_dates_and_places(self):
        if self.endDate < self.startDate or (self.endDate - self.startDate).days >= 14:
            raise ValueError("Chọn khoảng từ 1 đến 14 ngày.")
        if len(set(self.placeIds)) != len(self.placeIds):
            raise ValueError("Không chọn trùng địa điểm.")
        return self


class ScenarioRequest(BaseModel):
    scenarioId: str
    request: dict[str, Any]


class RouteRequest(BaseModel):
    placeIds: list[str] = Field(min_length=2, max_length=12)


def normalize(text: str) -> str:
    return unicodedata.normalize("NFC", text.strip().lower())


@app.get("/api/prototype/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "data": "simulated"}


@app.post("/api/prototype/recommendations")
async def recommendations(body: RecommendationRequest) -> dict[str, Any]:
    interests = list(dict.fromkeys(normalize(x) for x in body.interests if normalize(x)))
    results = []
    for place in FIXTURE["snapshot"]["places"]:
        matched = [interest for interest in interests if interest == normalize(place["category"])]
        results.append({"placeId": place["id"], "matchedInterests": matched})
    results.sort(key=lambda item: -len(item["matchedInterests"]))
    return {"destination": "Đà Nẵng", "dataKind": "simulated", "recommendations": results}


@app.get("/api/prototype/catalog/destinations")
async def catalog_destinations() -> dict[str, Any]:
    return {"destinations": list(CATALOG["destinations"])}


@app.post("/api/prototype/catalog/recommendations")
async def catalog_recommendations(body: CatalogRequest) -> dict[str, Any]:
    places = CATALOG["destinations"].get(body.destination)
    if places is None:
        raise HTTPException(status_code=404, detail="Điểm đến chưa có trong danh mục khảo sát.")
    interests = list(dict.fromkeys(normalize(x) for x in body.interests if normalize(x)))
    results = []
    for place in places:
        tags = {normalize(tag) for tag in place["tags"]}
        matched = [interest for interest in interests if interest in tags]
        results.append({**place, "matchedInterests": matched, "openingHours": None, "price": None, "verificationStatus": "unverified"})
    results.sort(key=lambda item: -len(item["matchedInterests"]))
    return {"destination": body.destination, "source": CATALOG["source"], "places": results}


@app.post("/api/prototype/catalog/draft")
async def catalog_draft(body: DraftRequest) -> dict[str, Any]:
    candidates = CATALOG["destinations"].get(body.destination)
    if candidates is None:
        raise HTTPException(status_code=404, detail="Điểm đến chưa có trong danh mục khảo sát.")
    by_id = {place["osmId"]: place for place in candidates}
    if any(place_id not in by_id for place_id in body.placeIds):
        raise HTTPException(status_code=422, detail="Địa điểm không thuộc thành phố đã chọn.")
    day_count = (body.endDate - body.startDate).days + 1
    days = [{"date": (body.startDate + timedelta(days=i)).isoformat(), "places": []} for i in range(day_count)]
    # Distribute in selected order; this is an unvalidated draft, not an optimized itinerary.
    for i, place_id in enumerate(body.placeIds):
        days[i % day_count]["places"].append(by_id[place_id])
    return {"destination": body.destination, "status": "DRAFT_UNVALIDATED", "days": days, "source": CATALOG["source"]}


@app.post("/api/prototype/route")
async def route(body: RouteRequest) -> dict[str, Any]:
    if any(place_id not in ROUTE_POINTS for place_id in body.placeIds):
        raise HTTPException(status_code=422, detail="Điểm dừng không thuộc danh mục lịch mẫu.")
    city = ROUTE_CITIES[body.placeIds[0]]
    if any(ROUTE_CITIES[place_id] != city for place_id in body.placeIds):
        raise HTTPException(status_code=422, detail="Các điểm phải thuộc cùng một thành phố.")

    async def get_leg(client: httpx.AsyncClient, origin: str, destination: str) -> dict[str, Any]:
        points = [ROUTE_POINTS[origin], ROUTE_POINTS[destination]]
        params = [("point", f"{lat},{lon}") for lat, lon in points]
        params += [("profile", "car"), ("points_encoded", "false"), ("instructions", "false")]
        response = await client.get(f"http://127.0.0.1:{ROUTE_PORTS[city]}/route", params=params)
        response.raise_for_status()
        path = response.json()["paths"][0]
        coords = path["points"]["coordinates"]
        if not isinstance(coords, list) or len(coords) < 2 or any(
            not isinstance(pair, list) or len(pair) < 2
            or not all(isinstance(v, (int, float)) and math.isfinite(v) for v in pair[:2])
            or abs(pair[0]) > 180 or abs(pair[1]) > 90 for pair in coords
        ):
            raise ValueError("Invalid route geometry")
        distance, duration = path["distance"], path["time"]
        if not all(isinstance(v, (int, float)) and math.isfinite(v) and v >= 0 for v in (distance, duration)):
            raise ValueError("Invalid route metrics")
        return {"fromId": origin, "toId": destination, "coordinates": coords, "distanceMeters": distance, "durationMs": duration}

    try:
        async with httpx.AsyncClient(timeout=10.0, trust_env=False) as client:
            legs = await asyncio.gather(*(get_leg(client, a, b) for a, b in zip(body.placeIds, body.placeIds[1:])))
    except (httpx.HTTPError, KeyError, IndexError, TypeError, ValueError) as exc:
        raise HTTPException(status_code=503, detail="Không lấy được tuyến GraphHopper. Kiểm tra dịch vụ định tuyến và các điểm dừng.") from exc
    return {"profile": "car", "source": "GraphHopper / OpenStreetMap", "legs": legs}


@app.post("/api/prototype/scenarios")
async def scenario(body: ScenarioRequest) -> dict[str, Any]:
    selected = next((s for s in FIXTURE["scenarios"] if s["id"] == body.scenarioId), None)
    # JSON encoding distinguishes numbers from booleans, unlike Python equality.
    def canonical(value: Any) -> str:
        return json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(",", ":"))
    if selected is None or canonical(body.request) != canonical(selected["request"]):
        return {"kind": "unsupported", "message": "Bộ demo chưa có kết quả cho tổ hợp này. Chọn lại một kịch bản mẫu để xem lịch phù hợp."}
    return {"kind": "supported", "scenario": selected}


# Request-driven catalog itineraries are independent of the fixture/demo API.
from backend.planning_models import PlanRequest, PlanResponse
from backend.planning import create_plan
from fastapi.responses import JSONResponse


@app.post("/api/prototype/catalog/plan", response_model=PlanResponse)
async def catalog_plan(body: PlanRequest):
    result = await create_plan(body)
    if result.status == "ROUTING_UNAVAILABLE":
        return JSONResponse(status_code=503, content=result.model_dump())
    return result
