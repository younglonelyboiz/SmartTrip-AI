"""Reproducible offline comparison of two planners on editorial estimates."""
import argparse
import json
import math
import statistics
import time
from pathlib import Path

from backend.planning import extend, plan_itinerary, preflight, response, verify_plan
from backend.planning_catalog import load_planning_catalog
from backend.planning_models import PlanDay, PlanRequest, RouteLeg


def offline_matrix(places):
    """Synthetic road proxy for a benchmark only; never a user-facing route."""
    matrix = {}
    for a in places:
        for b in places:
            if a.osmId == b.osmId:
                continue
            lat = math.radians(b.lat - a.lat)
            lon = math.radians(b.lon - a.lon)
            h = math.sin(lat / 2) ** 2 + math.cos(math.radians(a.lat)) * math.cos(math.radians(b.lat)) * math.sin(lon / 2) ** 2
            distance = 2 * 6371000 * math.asin(min(1, math.sqrt(h))) * 1.35
            matrix[a.osmId, b.osmId] = RouteLeg(fromId=a.osmId, toId=b.osmId, distanceMeters=distance,
                                                 durationMs=math.ceil(distance / (25_000 / 3600) / 60) * 60_000)
    return matrix


def greedy_plan(request, places, matrix):
    conflict = preflight(request, places)
    if conflict:
        return response(request, "INFEASIBLE", conflict)
    days = [PlanDay(dayNumber=i + 1, breaks=[request.schedule.lunch] if request.schedule.lunch else []) for i in range(request.dayCount)]
    selected, groups = set(), set()
    ordered = sorted(places, key=lambda p: (p.osmId not in request.mandatoryPlaceIds, -p.priority, p.osmId))
    for place in ordered:
        if place.exclusionGroup and place.exclusionGroup in groups:
            continue
        for i, day in enumerate(days):
            candidate = extend(day, place, request, matrix)
            if candidate is None:
                continue
            total = sum(d.totals.totalVnd for d in days) - day.totals.totalVnd + candidate.totals.totalVnd
            if request.budgetVnd is not None and total > request.budgetVnd:
                continue
            days[i] = candidate
            selected.add(place.osmId)
            if place.exclusionGroup:
                groups.add(place.exclusionGroup)
            break
    if not set(request.mandatoryPlaceIds) <= selected or not selected:
        return response(request, "SEARCH_LIMIT", "Greedy chưa tìm được lịch; không chứng minh vô nghiệm.")
    result = response(request, "PLANNED_ESTIMATE", "Lịch greedy trên dữ liệu benchmark giả định.", days)
    verify_plan(result, places)
    return result


def cases(places):
    """36 fixed combinations, including tight budgets and mandatory places."""
    ids = [p.osmId for p in sorted(places, key=lambda p: p.osmId)]
    for day_count in (1, 2, 3):
        for budget in (0, 50_000, 150_000, None):
            for mandatory in ([], [ids[0]], [ids[0], ids[1]]):
                yield PlanRequest(destination="Đà Nẵng", dayCount=day_count, budgetVnd=budget, mandatoryPlaceIds=mandatory)


def metrics(result, places):
    if result.status != "PLANNED_ESTIMATE":
        return {"status": result.status, "valid": None, "score": None, "visits": 0, "coveredDays": 0,
                "travelMinutes": None, "costVnd": None}
    verify_plan(result, places)
    by_id = {p.osmId: p for p in places}
    chosen = [by_id[v.osmId] for d in result.days for v in d.visits]
    return {"status": result.status, "valid": True,
            "score": sum(p.priority for p in chosen) + 3 * len({p.activityGroup for p in chosen}),
            "visits": len(chosen), "coveredDays": result.coverage.plannedDays,
            "travelMinutes": result.totals.travelMinutes, "costVnd": result.totals.totalVnd}


def run_benchmark():
    places, source, assumptions = load_planning_catalog("Đà Nẵng")
    matrix = offline_matrix(places)
    rows = []
    for number, request in enumerate(cases(places), 1):
        row = {"case": number, "request": request.model_dump(), "results": {}}
        for name, planner in (("greedy", greedy_plan), ("beam", plan_itinerary)):
            start = time.perf_counter()
            result = planner(request, places, matrix)
            elapsed = (time.perf_counter() - start) * 1000
            row["results"][name] = {**metrics(result, places), "runtimeMs": round(elapsed, 3)}
        rows.append(row)
    summary = {}
    for name in ("greedy", "beam"):
        values = [row["results"][name] for row in rows]
        feasible = [v for v in values if v["valid"]]
        summary[name] = {"cases": len(values), "feasible": len(feasible), "validFeasible": sum(v["valid"] is True for v in feasible),
                         "statuses": {status: sum(v["status"] == status for v in values) for status in sorted({v["status"] for v in values})},
                         "meanScoreFeasible": round(statistics.mean(v["score"] for v in feasible), 2) if feasible else None,
                         "medianRuntimeMs": round(statistics.median(v["runtimeMs"] for v in values), 3)}
    paired = [row for row in rows if all(row["results"][name]["valid"] for name in ("greedy", "beam"))]
    summary["pairedFeasibleCases"] = len(paired)
    summary["meanScoreDeltaPaired"] = round(statistics.mean(row["results"]["beam"]["score"] - row["results"]["greedy"]["score"] for row in paired), 2) if paired else None
    return {"method": {"city": "Đà Nẵng", "caseCount": len(rows), "catalogSource": source,
                       "catalogAssumptionVersion": assumptions["version"],
                       "routing": "synthetic haversine × 1.35, constant 25 km/h; offline only, not real roads",
                       "score": "sum(place.priority) + 3 × distinct activity groups",
                       "runtimeCaveat": "Single run per case; wall clock timings depend on machine and are not stable benchmarks.",
                       "scope": "Editorial prices/opening windows; no lodging, meals, live traffic, verified opening hours or real user data."},
            "summary": summary, "cases": rows}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=Path("benchmark-results.json"))
    args = parser.parse_args()
    report = run_benchmark()
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report["summary"], ensure_ascii=False, indent=2))
    print(f"Wrote {args.output}")


if __name__ == "__main__":
    main()
