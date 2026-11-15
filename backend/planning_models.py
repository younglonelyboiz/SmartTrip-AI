"""Contracts for estimated itineraries; monetary values are integer VND per person."""
from typing import Annotated, Any, Literal
from pydantic import BaseModel, ConfigDict, Field, model_validator

Clock = Annotated[str, Field(pattern=r"^(?:[01]\d|2[0-3]):[0-5]\d$")]
Money = Annotated[int, Field(strict=True, ge=0, le=9_007_199_254_740_991)]
City = Literal["Hà Nội", "Huế", "Đà Nẵng"]


def minute(clock: str) -> int:
    h, m = clock.split(":")
    return int(h) * 60 + int(m)


class Contract(BaseModel):
    model_config = ConfigDict(extra="forbid")


class TimeWindow(Contract):
    start: Clock
    end: Clock

    @model_validator(mode="after")
    def ordered(self):
        if minute(self.start) >= minute(self.end):
            raise ValueError("Giờ bắt đầu phải trước giờ kết thúc trong cùng ngày.")
        return self


class DaySchedule(TimeWindow):
    start: Clock = "08:00"
    end: Clock = "22:00"
    lunch: TimeWindow | None = Field(default_factory=lambda: TimeWindow(start="12:00", end="13:00"))

    @model_validator(mode="after")
    def contained_break(self):
        if self.lunch and not (minute(self.start) <= minute(self.lunch.start) < minute(self.lunch.end) <= minute(self.end)):
            raise ValueError("Khoảng nghỉ phải nằm trong khung giờ mỗi ngày; chỉnh hoặc tắt nghỉ trưa.")
        return self


class PlanRequest(Contract):
    destination: City
    dayCount: Annotated[int, Field(strict=True, ge=1, le=14)]
    budgetVnd: Money | None = None
    mandatoryPlaceIds: list[str] = Field(default_factory=list, max_length=30)
    schedule: DaySchedule = Field(default_factory=DaySchedule)

    @model_validator(mode="after")
    def unique_ids(self):
        if len(set(self.mandatoryPlaceIds)) != len(self.mandatoryPlaceIds):
            raise ValueError("Không chọn trùng địa điểm bắt buộc.")
        return self


class PlanningPlace(Contract):
    osmId: str
    name: str
    lat: Annotated[float, Field(ge=-90, le=90, allow_inf_nan=False)]
    lon: Annotated[float, Field(ge=-180, le=180, allow_inf_nan=False)]
    tags: list[str]
    durationMinutes: Annotated[int, Field(strict=True, gt=0, le=840)]
    visitWindow: TimeWindow
    admissionVnd: Money
    priority: Annotated[int, Field(strict=True, ge=1, le=10)]
    activityGroup: str
    exclusionGroup: str | None = None


class Visit(Contract):
    osmId: str
    name: str
    lat: float
    lon: float
    arrival: int
    departure: int
    durationMinutes: int
    mandatory: bool
    recommendationReason: str
    admissionVnd: int


class RouteLeg(Contract):
    fromId: str
    toId: str
    distanceMeters: float
    durationMs: float
    coordinates: list[list[float]] = Field(default_factory=list)
    transportVnd: int = 0
    departure: int = 0
    arrival: int = 0


class Totals(Contract):
    admissionVnd: int = 0
    transportVnd: int = 0
    totalVnd: int = 0
    distanceMeters: float = 0
    travelMinutes: int = 0
    visitMinutes: int = 0


class PlanDay(Contract):
    dayNumber: int
    visits: list[Visit] = Field(default_factory=list)
    legs: list[RouteLeg] = Field(default_factory=list)
    breaks: list[TimeWindow] = Field(default_factory=list)
    totals: Totals = Field(default_factory=Totals)


class Coverage(Contract):
    plannedDays: int
    requestedDays: int


class PlanResponse(Contract):
    status: Literal["PLANNED_ESTIMATE", "INFEASIBLE", "SEARCH_LIMIT", "ROUTING_UNAVAILABLE", "DATA_ERROR"]
    request: PlanRequest
    reason: str
    assumptions: dict[str, Any]
    source: dict[str, Any]
    days: list[PlanDay] = Field(default_factory=list)
    totals: Totals | None = None
    coverage: Coverage
