import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getFixturePlan, scenarios } from "../services/mockTravelService";
import { loadVersions, saveVersion } from "../services/tripStorage";
import { dateLabel } from "../domain/types";
import { DayTimeline } from "../components/DayTimeline";
import { RouteDiagram } from "../components/RouteDiagram";
import { BudgetSummary } from "../components/BudgetSummary";
import { ConstraintReport } from "../components/ConstraintReport";
import { DestinationPhoto } from "../components/DestinationPhoto";
export function Itinerary() {
  const { tripId = "", versionId = "" } = useParams();
  const plan =
    loadVersions().versions.find(
      (p) => p.tripId === tripId && p.versionId === versionId,
    ) ?? getFixturePlan(tripId, versionId);
  const [index, setIndex] = useState(0);
  const [message, setMessage] = useState("");
  if (!plan)
    return (
      <section className="panel">
        <h1>Không tìm thấy lịch trình</h1>
        <Link to="/trips">Về chuyến đi</Link>
      </section>
    );
  const day = plan.days[Math.min(index, plan.days.length - 1)];
  const scenario = scenarios.find(
    (s) => s.result.plan?.versionId === plan.versionId,
  )!;
  return (
    <>
      <Link className="back-link" to="/trips">
        Về chuyến đi
      </Link>
      <div className="itinerary-cover">
        <DestinationPhoto photo="city" eager />
        <span className="photo-label">Đà Nẵng bên sông Hàn</span>
      </div>
      <div className="page-heading itinerary-heading">
        <div>
          <p className="muted">
            3 ngày 2 đêm · {plan.request.partySize} người · Phiên bản{" "}
            {plan.versionId}
          </p>
          <h1>Đà Nẵng, một hành trình vừa đủ.</h1>
          <p>
            {dateLabel(plan.request.startDate)} –{" "}
            {dateLabel(plan.request.endDate)} · {plan.travelMinutes} phút di
            chuyển cả chuyến
          </p>
        </div>
        <button onClick={() => setMessage(saveVersion(plan).message ?? "")}>
          Lưu phiên bản
        </button>
      </div>
      <p role="status" className={message ? "notice" : ""}>
        {message}
      </p>
      <div className="actions">
        {plan.versionId === "v1" ? (
          <Link
            className="button secondary"
            to="/trips/danang-demo/versions/v2"
          >
            Xem mẫu điều chỉnh: bỏ Sơn Trà
          </Link>
        ) : (
          <Link
            className="button secondary"
            to="/trips/danang-demo/versions/v1"
          >
            Xem phiên bản trước
          </Link>
        )}
        {scenario.baseline ? (
          <Link className="button secondary" to="/compare/standard">
            So sánh hai lịch mẫu
          </Link>
        ) : null}
      </div>
      <p className="fine">{scenario.result.reason}</p>
      <div className="day-buttons" aria-label="Chọn ngày">
        {plan.days.map((d, i) => (
          <button
            className="secondary"
            aria-pressed={i === index}
            key={d.date}
            onClick={() => setIndex(i)}
          >
            Ngày {i + 1} <span>{dateLabel(d.date)}</span>
          </button>
        ))}
      </div>
      <div className="two-columns itinerary">
        <div>
          <DayTimeline day={day} />
          <ConstraintReport checks={scenario.result.checks} />
        </div>
        <aside>
          <RouteDiagram day={day} />
          <BudgetSummary plan={plan} />
          <p className="fine">
            Snapshot {plan.snapshotId} · Giá và giờ hoạt động giả lập.
          </p>
        </aside>
      </div>
    </>
  );
}
