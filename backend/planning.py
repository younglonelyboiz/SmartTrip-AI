"""Deterministic bounded itinerary search. All feasibility is relative to stated assumptions."""
import asyncio
import math
from dataclasses import dataclass
from fastapi import HTTPException
from starlette.concurrency import run_in_threadpool
from backend.planning_catalog import load_planning_catalog
from backend.planning_models import Coverage, PlanDay, PlanRequest, PlanResponse, PlanningPlace, RouteLeg, Totals, Visit, minute
from backend.planning_routing import RouteMatrix, RoutingUnavailable, build_matrix, fetch_selected_legs

RATE_VND_PER_KM = 12000


def slot(start: int, duration: int, end: int, request: PlanRequest) -> tuple[int, int] | None:
    lunch = request.schedule.lunch
    if lunch and start < minute(lunch.end) and start + duration > minute(lunch.start):
        start = minute(lunch.end)
    return (start, start + duration) if start + duration <= end else None


def totals_for(day: PlanDay) -> Totals:
    admission = sum(v.admissionVnd for v in day.visits)
    transport = sum(l.transportVnd for l in day.legs)
    return Totals(admissionVnd=admission, transportVnd=transport, totalVnd=admission + transport,
                  distanceMeters=sum(l.distanceMeters for l in day.legs),
                  travelMinutes=sum(l.arrival - l.departure for l in day.legs),
                  visitMinutes=sum(v.durationMinutes for v in day.visits))


def response(request: PlanRequest, status: str, reason: str, days=None) -> PlanResponse:
    _, source, assumptions = load_planning_catalog(request.destination)
    assumptions = {**assumptions, "search": "Beam search width 300, tối đa 100.000 mở rộng; không cam kết tối ưu toàn cục."}
    days = days or []
    totals = Totals(**{key: sum(getattr(d.totals, key) for d in days) for key in Totals.model_fields}) if days else None
    covered = sum(bool(d.visits) for d in days)
    if days and covered < request.dayCount:
        reason += f" Chỉ có điểm ghé cho {covered}/{request.dayCount} ngày; danh mục hoặc điều kiện hiện tại chưa đủ để phủ toàn chuyến."
    return PlanResponse(status=status, request=request, reason=reason, assumptions=assumptions, source=source,
                        days=days, totals=totals, coverage=Coverage(plannedDays=covered, requestedDays=request.dayCount))


def preflight(request: PlanRequest, places: list[PlanningPlace]) -> str | None:
    by_id = {p.osmId: p for p in places}
    if any(i not in by_id for i in request.mandatoryPlaceIds):
        raise HTTPException(status_code=422, detail="Điểm bắt buộc không thuộc thành phố đã chọn.")
    required = [by_id[i] for i in request.mandatoryPlaceIds]
    fees = sum(p.admissionVnd for p in required)
    if request.budgetVnd is not None and fees > request.budgetVnd:
        return f"Tổng vé ước tính của các điểm bắt buộc {fees:,} VND vượt ngân sách {request.budgetVnd:,} VND, chưa tính di chuyển."
    groups = [p.exclusionGroup for p in required if p.exclusionGroup]
    if len(groups) != len(set(groups)):
        return "Các điểm bắt buộc có trải nghiệm chồng lấn trong cùng nhóm (Hoàng Thành/Tử Cấm Thành); hãy chọn một điểm."
    for p in required:
        start = max(minute(request.schedule.start), minute(p.visitWindow.start))
        end = min(minute(request.schedule.end), minute(p.visitWindow.end))
        if slot(start, p.durationMinutes, end, request) is None:
            return f"{p.name} không đủ thời gian tham quan trong khung giờ đã chọn, kể cả khi đi riêng một điểm."
    return None


def extend(day: PlanDay, place: PlanningPlace, request: PlanRequest, matrix: RouteMatrix) -> PlanDay | None:
    clock = day.visits[-1].departure if day.visits else minute(request.schedule.start)
    end = minute(request.schedule.end)
    leg = None
    if day.visits:
        raw = matrix.get((day.visits[-1].osmId, place.osmId))
        if raw is None:
            return None
        segment = slot(clock, math.ceil(raw.durationMs / 60000), end, request)
        if segment is None:
            return None
        departure, clock = segment
        leg = raw.model_copy(update={"departure": departure, "arrival": clock,
                                     "transportVnd": math.ceil(raw.distanceMeters * RATE_VND_PER_KM / 1000)})
    visit = slot(max(clock, minute(place.visitWindow.start)), place.durationMinutes, min(end, minute(place.visitWindow.end)), request)
    if visit is None:
        return None
    mandatory = place.osmId in request.mandatoryPlaceIds
    reason = "Điểm bắt buộc bạn đã chọn." if mandatory else f"Điểm {place.activityGroup} được ưu tiên trong danh mục; phù hợp thời gian, tuyến và ngân sách đã nhập."
    result = PlanDay(dayNumber=day.dayNumber, visits=[*day.visits, Visit(osmId=place.osmId, name=place.name, lat=place.lat, lon=place.lon,
        arrival=visit[0], departure=visit[1], durationMinutes=place.durationMinutes, mandatory=mandatory,
        recommendationReason=reason, admissionVnd=place.admissionVnd)], legs=[*day.legs, *([leg] if leg else [])], breaks=day.breaks)
    result.totals = totals_for(result)
    return result


@dataclass(frozen=True)
class State:
    days: tuple[PlanDay, ...]
    mask: int
    cost: int
    travel: int


def verify_plan(result: PlanResponse, places: list[PlanningPlace]) -> None:
    """Recheck every returned constraint independently of search ranking/pruning."""
    request = result.request
    by_id = {p.osmId: p for p in places}
    seen, groups = set(), set()
    if len(result.days) != request.dayCount:
        raise ValueError("Wrong day count")
    for index, day in enumerate(result.days, 1):
        if day.dayNumber != index or len(day.legs) != max(0, len(day.visits) - 1):
            raise ValueError("Invalid day structure")
        intervals = []
        for visit in day.visits:
            p = by_id[visit.osmId]
            if visit.osmId in seen or p.exclusionGroup and p.exclusionGroup in groups:
                raise ValueError("Duplicate experience")
            seen.add(visit.osmId)
            if p.exclusionGroup:
                groups.add(p.exclusionGroup)
            if (visit.departure - visit.arrival != p.durationMinutes or visit.admissionVnd != p.admissionVnd
                or visit.arrival < minute(p.visitWindow.start) or visit.departure > minute(p.visitWindow.end)
                or visit.mandatory != (p.osmId in request.mandatoryPlaceIds)):
                raise ValueError("Invalid visit")
            intervals.append((visit.arrival, visit.departure))
        for a, leg, b in zip(day.visits, day.legs, day.visits[1:]):
            if (leg.fromId != a.osmId or leg.toId != b.osmId or leg.departure < a.departure or leg.arrival > b.arrival
                or leg.arrival - leg.departure != math.ceil(leg.durationMs / 60000)
                or leg.transportVnd != math.ceil(leg.distanceMeters * RATE_VND_PER_KM / 1000)):
                raise ValueError("Invalid leg")
            intervals.append((leg.departure, leg.arrival))
        for start, end in intervals:
            if start < minute(request.schedule.start) or end > minute(request.schedule.end) or end < start:
                raise ValueError("Outside day")
            lunch = request.schedule.lunch
            if lunch and start < minute(lunch.end) and end > minute(lunch.start):
                raise ValueError("Overlaps lunch")
        if totals_for(day) != day.totals:
            raise ValueError("Wrong day totals")
    if not set(request.mandatoryPlaceIds) <= seen or not seen:
        raise ValueError("Missing mandatory or empty itinerary")
    expected = Totals(**{key: sum(getattr(d.totals, key) for d in result.days) for key in Totals.model_fields})
    if expected != result.totals or request.budgetVnd is not None and expected.totalVnd > request.budgetVnd:
        raise ValueError("Wrong totals or over budget")


def plan_itinerary(request: PlanRequest, places: list[PlanningPlace], matrix: RouteMatrix, *, max_expansions: int = 100000) -> PlanResponse:
    conflict = preflight(request, places)
    if conflict:
        return response(request, "INFEASIBLE", conflict)
    required = sum(1 << i for i, p in enumerate(places) if p.osmId in request.mandatoryPlaceIds)
    def new_day(number):
        return PlanDay(dayNumber=number, breaks=[request.schedule.lunch] if request.schedule.lunch else [])
    beam = [State((new_day(1),), 0, 0, 0)]
    best = None
    expansions = 0
    # A state uses each point at most once; closing a day is the only other transition.
    def value(state):
        chosen = [p for i, p in enumerate(places) if state.mask & (1 << i)]
        return (sum(p.priority for p in chosen) + 3 * len({p.activityGroup for p in chosen}),
                sum(bool(d.visits) for d in state.days), -state.travel, -state.cost)
    def rank(state):
        score, covered, travel, cost = value(state)
        # Preserve branches that close days early enough to cover the whole trip.
        balance = sum(len(d.visits) ** 2 for d in state.days)
        return ((state.mask & required).bit_count(), score + 20 * covered - 2 * balance, score, covered, travel, cost)
    for _ in range(len(places) + request.dayCount):
        successors = {}
        for state in beam:
            if state.mask and state.mask & required == required and (best is None or value(state) > value(best)):
                best = state
            if expansions >= max_expansions:
                break
            used_groups = {p.exclusionGroup for i, p in enumerate(places) if state.mask & (1 << i) and p.exclusionGroup}
            for i in sorted(range(len(places)), key=lambda j: (not bool(required & (1 << j)), -places[j].priority, places[j].osmId)):
                if expansions >= max_expansions:
                    break
                if state.mask & (1 << i) or places[i].exclusionGroup and places[i].exclusionGroup in used_groups:
                    continue
                expansions += 1
                day = extend(state.days[-1], places[i], request, matrix)
                if day is None:
                    continue
                cost = state.cost - state.days[-1].totals.totalVnd + day.totals.totalVnd
                if request.budgetVnd is not None and cost > request.budgetVnd:
                    continue
                child = State((*state.days[:-1], day), state.mask | (1 << i), cost,
                              state.travel - state.days[-1].totals.travelMinutes + day.totals.travelMinutes)
                # Equivalent future options: keep the less expensive/faster representative.
                key = (child.mask, len(child.days), i, day.visits[-1].departure, cost)
                previous = successors.get(key)
                if previous is None or rank(child) > rank(previous):
                    successors[key] = child
                if child.mask & required == required and (best is None or value(child) > value(best)):
                    best = child
            if len(state.days) < request.dayCount and state.days[-1].visits:
                child = State((*state.days, new_day(len(state.days) + 1)), state.mask, state.cost, state.travel)
                successors[(child.mask, len(child.days), -1, 0, child.cost)] = child
        if not successors or expansions >= max_expansions:
            break
        beam = sorted(successors.values(), key=rank, reverse=True)[:300]
    if best is None:
        return response(request, "SEARCH_LIMIT", "Chưa tìm được lịch đáp ứng yêu cầu trong giới hạn tìm kiếm và dữ liệu hiện tại. Thử tăng số ngày, ngân sách hoặc giảm điểm bắt buộc; đây không phải kết luận vô nghiệm.")
    days = list(best.days)
    while len(days) < request.dayCount:
        days.append(new_day(len(days) + 1))
    result = response(request, "PLANNED_ESTIMATE", "Đã tạo lịch theo dữ liệu và chi phí ước tính; cần kiểm tra giờ mở cửa và giá thực tế trước chuyến đi.", days)
    verify_plan(result, places)
    return result


async def create_plan(request: PlanRequest) -> PlanResponse:
    try:
        places, _, _ = load_planning_catalog(request.destination)
        conflict = preflight(request, places)
        if conflict:
            return response(request, "INFEASIBLE", conflict)
        async def routed_plan():
            matrix = await build_matrix(request.destination, places)
            result = await run_in_threadpool(plan_itinerary, request, places, matrix)
            if result.status != "PLANNED_ESTIMATE":
                if getattr(matrix, "failed_pairs", ()):
                    raise RoutingUnavailable("Một số chặng lỗi dịch vụ nên chưa kiểm tra được lịch đáp ứng yêu cầu; hãy thử lại.")
                return result
            if getattr(matrix, "failed_pairs", ()):
                result.reason += " Một số chặng lỗi đã bị loại; lịch này chỉ dùng các chặng đã tính được."
            by_id = {p.osmId: p for p in places}
            pairs = [(by_id[l.fromId], by_id[l.toId]) for d in result.days for l in d.legs]
            geometry = await fetch_selected_legs(request.destination, pairs)
            offset = 0
            for day in result.days:
                for leg in day.legs:
                    current = geometry[offset]
                    offset += 1
                    if abs(current.distanceMeters - leg.distanceMeters) > 0.01 or abs(current.durationMs - leg.durationMs) > 1:
                        raise RoutingUnavailable("Số liệu tuyến đã thay đổi trong khi tính; hãy thử tạo lại lịch.")
                    leg.coordinates = current.coordinates
            verify_plan(result, places)
            return result
        return await asyncio.wait_for(routed_plan(), timeout=45)
    except (RoutingUnavailable, asyncio.TimeoutError) as exc:
        return response(request, "ROUTING_UNAVAILABLE", str(exc) or "Định tuyến quá thời gian; hãy thử lại.")
    except (KeyError, ValueError, TypeError, OSError) as exc:
        # A damaged catalog must still produce a readable structured error.
        return PlanResponse(status="DATA_ERROR", request=request, reason="Dữ liệu lập lịch không hợp lệ hoặc chưa đủ; hãy kiểm tra catalog và metadata.",
                            assumptions={}, source={}, coverage=Coverage(plannedDays=0, requestedDays=request.dayCount))
