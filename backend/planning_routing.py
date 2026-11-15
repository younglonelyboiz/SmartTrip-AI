"""Bounded directed GraphHopper queries; unavailable service is never a straight line."""
import asyncio
import math
from collections.abc import Sequence
import httpx
from backend.planning_models import PlanningPlace, RouteLeg

PORTS = {"Đà Nẵng": 8989, "Hà Nội": 8991, "Huế": 8993}
class RouteMatrix(dict[tuple[str, str], RouteLeg | None]):
    """Confirmed absent routes differ from pairs whose service query failed."""
    def __init__(self, *args, failed_pairs=(), **kwargs):
        super().__init__(*args, **kwargs)
        self.failed_pairs = frozenset(failed_pairs)


ROUTING_TIMEOUT_SECONDS = 45
# Shared across requests, not just within one matrix.
_SEMAPHORE = asyncio.Semaphore(6)


class RoutingUnavailable(Exception):
    pass


def make_client() -> httpx.AsyncClient:
    return httpx.AsyncClient(timeout=10.0, trust_env=False)


def nonnegative(value) -> bool:
    return type(value) in (float, int) and math.isfinite(value) and value >= 0


async def _query(client: httpx.AsyncClient, city: str, origin: PlanningPlace, target: PlanningPlace, geometry: bool) -> RouteLeg | None:
    params = [("point", f"{p.lat},{p.lon}") for p in (origin, target)]
    params += [("profile", "car"), ("points_encoded", "false"), ("calc_points", str(geometry).lower()), ("instructions", "false")]
    async with _SEMAPHORE:
        response = await client.get(f"http://127.0.0.1:{PORTS[city]}/route", params=params)
    if response.status_code == 400:
        body = response.json()
        hints = body.get("hints", []) if isinstance(body, dict) else []
        if isinstance(hints, list) and any(isinstance(h, dict) and h.get("details") == "com.graphhopper.util.exceptions.ConnectionNotFoundException" for h in hints):
            return None
    response.raise_for_status()
    path = response.json()["paths"][0]
    distance, duration = path["distance"], path["time"]
    if not nonnegative(distance) or not nonnegative(duration):
        raise ValueError("Invalid route metrics")
    coordinates = path["points"]["coordinates"] if geometry else []
    if geometry and (not isinstance(coordinates, list) or len(coordinates) < 2 or any(
        not isinstance(pair, list) or len(pair) != 2
        or any(type(v) not in (int, float) or not math.isfinite(v) for v in pair)
        or abs(pair[0]) > 180 or abs(pair[1]) > 90 for pair in coordinates
    )):
        raise ValueError("Invalid route geometry")
    return RouteLeg(fromId=origin.osmId, toId=target.osmId, distanceMeters=distance, durationMs=duration, coordinates=coordinates)


async def _queries(city: str, pairs: Sequence[tuple[PlanningPlace, PlanningPlace]], geometry: bool, *, tolerate_errors: bool = False) -> list[RouteLeg | None | BaseException]:
    async def run():
        async with make_client() as client:
            tasks = [asyncio.create_task(_query(client, city, a, b, geometry)) for a, b in pairs]
            try:
                return await asyncio.gather(*tasks, return_exceptions=tolerate_errors)
            finally:
                for task in tasks:
                    if not task.done():
                        task.cancel()
                await asyncio.gather(*tasks, return_exceptions=True)
    try:
        return await asyncio.wait_for(run(), timeout=ROUTING_TIMEOUT_SECONDS)
    except (httpx.HTTPError, KeyError, IndexError, TypeError, ValueError, asyncio.TimeoutError) as exc:
        raise RoutingUnavailable("Không lấy được tuyến GraphHopper; hãy kiểm tra dịch vụ định tuyến của thành phố.") from exc


async def build_matrix(destination: str, places: list[PlanningPlace]) -> RouteMatrix:
    pairs = [(a, b) for a in places for b in places if a.osmId != b.osmId]
    values = await _queries(destination, pairs, False, tolerate_errors=True)
    failed = {(a.osmId, b.osmId) for (a, b), value in zip(pairs, values) if isinstance(value, BaseException)}
    if failed and len(failed) == len(pairs):
        raise RoutingUnavailable("Không lấy được tuyến GraphHopper; hãy kiểm tra dịch vụ định tuyến của thành phố.")
    return RouteMatrix({(a.osmId, b.osmId): None if isinstance(value, BaseException) else value for (a, b), value in zip(pairs, values)}, failed_pairs=failed)


async def fetch_selected_legs(destination: str, pairs: list[tuple[PlanningPlace, PlanningPlace]]) -> list[RouteLeg]:
    values = await _queries(destination, pairs, True)
    if any(value is None for value in values):
        raise RoutingUnavailable("Tuyến đã chọn không còn khả dụng; hãy thử tính lại.")
    return [value for value in values if value is not None]
