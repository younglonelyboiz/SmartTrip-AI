import { useState } from "react";
import type { CatalogPlanResponse } from "../services/prototypeApi";
import { CatalogItineraryMap } from "./CatalogItineraryMap";

export const clock = (minutes: number) => `${Math.floor(minutes / 60).toString().padStart(2, "0")}:${(minutes % 60).toString().padStart(2, "0")}`;
export const money = (value: number) => `${new Intl.NumberFormat("vi-VN").format(value)} ₫`;

export function CatalogItinerary({ plan }: { plan: CatalogPlanResponse }) {
  const [selectedDay, setSelectedDay] = useState(0);
  const day = plan.days[selectedDay] ?? plan.days[0];
  if (!day || !plan.totals) return null;
  const events = [
    ...day.visits.map(visit => ({ kind: "visit" as const, at: visit.arrival, visit })),
    ...day.legs.map(leg => ({ kind: "leg" as const, at: leg.departure, leg })),
    ...day.breaks.map(pause => ({ kind: "break" as const, at: Number(pause.start.slice(0, 2)) * 60 + Number(pause.start.slice(3)), pause })),
  ].sort((a, b) => a.at - b.at);
  return <section className="catalog-result" aria-labelledby="catalog-result-heading">
    <div className="page-heading"><div>
      <p className="muted">Lịch được tính từ yêu cầu của bạn</p>
      <h2 id="catalog-result-heading">Lịch trình {plan.request.destination} · {plan.request.dayCount} ngày</h2>
      <p role="status">{plan.reason}</p>
    </div></div>
    <dl className="catalog-totals" aria-label="Dự toán toàn chuyến">
      <div><dt>Tổng ước tính / người</dt><dd>{money(plan.totals.totalVnd)}</dd></div>
      <div><dt>Vé tham quan</dt><dd>{money(plan.totals.admissionVnd)}</dd></div>
      <div><dt>Di chuyển giữa điểm</dt><dd>{money(plan.totals.transportVnd)}</dd></div>
      <div><dt>Tuyến tham quan</dt><dd>{(plan.totals.distanceMeters / 1000).toFixed(1)} km · {plan.totals.travelMinutes} phút</dd></div>
    </dl>
    <p className="fine">{plan.request.budgetVnd === null ? "Không giới hạn ngân sách." : `Ngân sách: ${money(plan.request.budgetVnd)} / người.`} Có điểm ghé trong {plan.coverage.plannedDays}/{plan.coverage.requestedDays} ngày. Khung chung {plan.request.schedule.start}–{plan.request.schedule.end}.</p>
    <div className="catalog-day-buttons" role="group" aria-label="Chọn ngày tham quan">
      {plan.days.map((item, index) => <button type="button" className={index === selectedDay ? "" : "secondary"} aria-pressed={index === selectedDay} key={item.dayNumber} onClick={() => setSelectedDay(index)}>Ngày {item.dayNumber}</button>)}
    </div>
    <div className="two-columns catalog-day-layout">
      <section className="panel" aria-label={`Chi tiết ngày ${day.dayNumber}`}>
        <h3>Ngày {day.dayNumber}</h3>
        <p>{day.visits.length} điểm · dự toán {money(day.totals.totalVnd)} · {(day.totals.distanceMeters / 1000).toFixed(1)} km di chuyển</p>
        {!day.visits.length ? <p className="notice">Chưa xếp được điểm cho ngày này trong danh mục và điều kiện hiện tại. Lịch chưa phủ đầy đủ toàn chuyến.</p> : <ol className="catalog-timeline">
          {events.map((event, i) => <li key={`${event.kind}-${i}`} className={`catalog-event catalog-event-${event.kind}`}>
            {event.kind === "visit" ? <>
              <p className="catalog-event-time">{clock(event.visit.arrival)}–{clock(event.visit.departure)} · {event.visit.durationMinutes} phút</p>
              <h4>{event.visit.name}</h4>
              <span className="badge">{event.visit.mandatory ? "Điểm bắt buộc" : "Được gợi ý"}</span>
              <p className="fine">{event.visit.recommendationReason}</p>
              <p>Vé ước tính: {money(event.visit.admissionVnd)}</p>
            </> : event.kind === "leg" ? <>
              <p className="catalog-event-time">{clock(event.leg.departure)}–{clock(event.leg.arrival)} · Di chuyển ô tô</p>
              <p>{(event.leg.distanceMeters / 1000).toFixed(1)} km · {event.leg.arrival - event.leg.departure} phút · {money(event.leg.transportVnd)}</p>
            </> : <p className="catalog-event-time">{event.pause.start}–{event.pause.end} · Nghỉ trưa (chưa gồm tiền ăn)</p>}
          </li>)}
        </ol>}
        <p className="fine">Khoảng trống giữa các hoạt động là thời gian chờ hoặc tự do. Mỗi ngày bắt đầu tại điểm ghé đầu và kết thúc ở điểm ghé cuối.</p>
      </section>
      {day.visits.length > 0 && <CatalogItineraryMap day={day} />}
    </div>
    <details className="panel catalog-assumptions">
      <summary>Nguồn dữ liệu và cách tính dự toán</summary>
      <p>{plan.assumptions.notice}</p>
      <p>{plan.assumptions.budgetScope}</p>
      <p>Di chuyển ước tính {money(plan.assumptions.transportVndPerKm ?? 0)}/km, làm tròn lên từng chặng đến VND; không phải báo giá taxi. Thời gian chặng làm tròn lên phút.</p>
      <p>{plan.assumptions.routingNotice}</p>
      <p>{plan.assumptions.search}</p>
      <p className="fine">Phiên bản giả định: {plan.assumptions.version} · OSM snapshot: {plan.source.snapshotTimestamp}</p>
    </details>
    <p className="fine">Giá, giờ và thời lượng tham quan là ước tính chưa xác minh. Dữ liệu bản đồ © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a> · ODbL.</p>
  </section>;
}
