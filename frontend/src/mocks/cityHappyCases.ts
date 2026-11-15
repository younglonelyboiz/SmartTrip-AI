import type { CostItem, DatasetSnapshot, DayPlan, Place, PlanVersion, Scenario, TravelEdge, TravelRequest } from "../domain/types";
import type { PhotoKey } from "../domain/photos";

// Scenario values are fictional and are never prices, schedules, or actual route times.
type Location = { id: string; name: string; category: string; coordinates: [number, number] };
export interface CityHappyCase {
  snapshot: DatasetSnapshot;
  scenario: Scenario;
  coordinates: Record<string, [number, number]>;
  photo: PhotoKey;
  headline: string;
}

const dates = ["2026-12-10", "2026-12-11", "2026-12-12"];
const fact = { sourceId: "city-fixture", kind: "simulated" as const, recordedAt: "2026-11-02T03:00:00Z", validFrom: dates[0], validTo: dates[2], method: "Giả lập cho happy case, không phải thông tin thực tế." };
const price = (id: string, label: string, amountVnd: number, basis: CostItem["basis"]): CostItem => ({ id, label, amountVnd, basis, provenance: { sourceId: "city-fixture", kind: "simulated", recordedAt: fact.recordedAt, serviceDate: dates[0], currency: "VND", conditions: "Giá giả lập phục vụ demo, không phải giá hiện hành." } });

function buildCity(destination: string, tripId: string, photo: PhotoKey, locations: Location[]): CityHappyCase {
  const request: TravelRequest = { destination, startDate: dates[0], endDate: dates[2], partySize: 2, budgetVnd: 6000000, dayStartMinute: 480, dayEndMinute: 1080, depotId: "hotel", interests: ["văn hóa"], mandatoryPlaceIds: [locations[0].id], excludedPlaceIds: [], lockedVisits: [] };
  const places: Place[] = locations.map((place) => ({ id: place.id, name: place.name, category: place.category, durationMinutes: 60, relevanceScore: 500, sourceId: "city-fixture", provenance: fact, windows: Object.fromEntries(dates.map((date) => [date, [{ openMinute: 480, closeMinute: 1080, provenance: fact }]])), visitCost: price(`visit-${place.id}`, `Tham quan ${place.name}`, 30000, "per_person") }));
  const edges: TravelEdge[] = [];
  const days: DayPlan[] = [];
  const costItems = [price("hotel", "Lưu trú cả nhóm · 2 đêm", 1000000, "per_group"), price("meals", "Ăn uống mỗi người · 3 ngày", 300000, "per_person")];
  let travelMinutes = 0;
  for (let i = 0; i < 3; i++) {
    const a = places[i * 2], b = places[i * 2 + 1];
    const legs = [["hotel", a.id, 20], [a.id, b.id, 15], [b.id, "hotel", 20]] as const;
    for (const [fromId, toId, minutes] of legs) {
      const cost = price(`${dates[i]}-${fromId}-${toId}`, `Di chuyển ${fromId} → ${toId}`, minutes * 1000, "per_group");
      edges.push({ fromId, toId, travelMinutes: minutes, distanceKm: minutes / 5, cost, provenance: fact });
      costItems.push(cost);
      travelMinutes += minutes;
    }
    costItems.push(a.visitCost, b.visitCost);
    days.push({ date: dates[i], departureMinute: 480, returnMinute: 655, visits: [{ placeId: a.id, startMinute: 500, endMinute: 560 }, { placeId: b.id, startMinute: 575, endMinute: 635 }] });
  }
  const totalCostVnd = costItems.reduce((sum, item) => sum + item.amountVnd * (item.basis === "per_person" ? request.partySize : 1), 0);
  const snapshotId = `${tripId}-snapshot`;
  const snapshot: DatasetSnapshot = { snapshotId, recordedAt: fact.recordedAt, configVersion: "demo-1", places, edges, fixedCosts: costItems.slice(0, 2), sources: [{ id: "city-fixture", name: "Kịch bản giả lập", status: "simulated", notes: "Giờ, giá và di chuyển là giả lập; tên và vị trí tham khảo OSM." }] };
  const plan: PlanVersion = { tripId, versionId: "v1", parentVersionId: null, snapshotId, request, days, costItems, totalCostVnd, travelMinutes, status: "FEASIBLE", isMock: true, configVersion: "demo-1", objectiveVersion: "demo-1" };
  const scenario: Scenario = { id: tripId, title: `${destination} · happy case`, description: "Lịch mẫu, không chạy solver.", request, result: { runId: `run-${tripId}`, snapshotId, request, status: "FEASIBLE", reason: "Lịch mẫu khả thi theo dữ liệu giả lập; chưa chạy solver.", checks: [{ code: "time", status: "pass", message: "Thời gian di chuyển và tham quan phù hợp dữ liệu giả lập.", evidence: { snapshotId, basis: "fixture-validation" } }, { code: "budget", status: "pass", message: "Tổng chi phí giả lập trong ngân sách nhóm.", evidence: { snapshotId, basis: "fixture-validation" } }, { code: "mandatory", status: "pass", message: "Có điểm bắt buộc; không có điểm bị loại.", evidence: { snapshotId, basis: "fixture-validation" } }], plan, isMock: true, skippedPlaces: [], configVersion: "demo-1", objectiveVersion: "demo-1" } };
  return { snapshot, scenario, coordinates: Object.fromEntries(locations.map((place) => [place.id, place.coordinates])), photo, headline: `${destination}, một hành trình vừa đủ.` };
}

export const cityHappyCases: CityHappyCase[] = [
  buildCity("Hà Nội", "hanoi-demo", "hanoi", [
    { id: "hn-ho-guom", name: "Tượng đài Lý Thái Tổ", category: "lịch sử", coordinates: [21.0274885, 105.854501] },
    { id: "hn-hang-ngang", name: "Nhà 48 phố Hàng Ngang", category: "văn hóa", coordinates: [21.0343278, 105.8504388] },
    { id: "hn-dia-chat", name: "Bảo tàng Địa chất Việt Nam", category: "bảo tàng", coordinates: [21.0235524, 105.8587723] },
    { id: "hn-cho-dem", name: "Chợ Đêm Hàng Đào – Đồng Xuân", category: "ẩm thực", coordinates: [21.0335078, 105.8509571] },
    { id: "hn-chua-lang", name: "Di Tích Lịch Sử Chùa Láng", category: "văn hóa", coordinates: [21.0234337, 105.802772] },
    { id: "hn-lotte", name: "Đài quan sát Lotte Skywalk", category: "ngắm cảnh", coordinates: [21.0322019, 105.8123288] },
  ]),
  buildCity("Huế", "hue-demo", "hue", [
    { id: "hue-hoang-thanh", name: "Hoàng Thành Huế", category: "văn hóa", coordinates: [16.4689726, 107.5781266] },
    { id: "hue-phan-boi-chau", name: "Tượng đài Phan Bội Châu", category: "lịch sử", coordinates: [16.46715, 107.5898061] },
    { id: "hue-tu-duc", name: "Lăng Tự Đức", category: "văn hóa", coordinates: [16.4331813, 107.5645857] },
    { id: "hue-duc-duc", name: "Lăng Dục Đức", category: "văn hóa", coordinates: [16.4510937, 107.5931525] },
    { id: "hue-xa-tac", name: "Đàn Xã Tắc", category: "lịch sử", coordinates: [16.4650415, 107.5712089] },
    { id: "hue-duong-xuan", name: "Đúc đồng Dương Xuân", category: "làng nghề", coordinates: [16.4532498, 107.5632941] },
  ]),
];
