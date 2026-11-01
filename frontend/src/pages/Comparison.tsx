import { Link, useParams } from "react-router-dom";
import { scenarios, sameRequest } from "../services/mockTravelService";
import { currency } from "../domain/types";
export function Comparison() {
  const { scenarioId } = useParams();
  const s = scenarios.find((s) => s.id === scenarioId);
  const a = s?.baseline,
    b = s?.result.plan;
  if (
    !a ||
    !b ||
    a.snapshotId !== b.snapshotId ||
    !sameRequest(a.request, b.request)
  )
    return (
      <>
        <h1>Không có cặp lịch mẫu để so sánh</h1>
        <Link to="/planner">Chọn kịch bản</Link>
      </>
    );
  return (
    <>
      <Link className="back-link" to="/trips/danang-demo/versions/v1">
        Về lịch trình
      </Link>
      <h1>Hai cách sắp xếp, cùng một chuyến đi.</h1>
      <p className="notice">
        Đây là hai lịch trình được dựng sẵn. Chênh lệch dưới đây không phải kết
        quả benchmark thuật toán.
      </p>
      <div className="comparison">
        {[
          [a, "Lịch mẫu ban đầu"],
          [b, "Lịch mẫu đề xuất"],
        ].map(([plan, title]) => {
          const p = plan as typeof a;
          return (
            <section className="panel" key={p.versionId}>
              <h2>{title as string}</h2>
              <p className="big-value">
                {p.travelMinutes} <small>phút di chuyển</small>
              </p>
              <p>
                Tổng chi phí nhóm: <strong>{currency(p.totalCostVnd)}</strong>
              </p>
              <p>
                {p.days.reduce((n, d) => n + d.visits.length, 0)} điểm dừng · Đã
                gồm lượt quay về
              </p>
              <div
                className="bar"
                style={{
                  width: `${(p.travelMinutes / Math.max(a.travelMinutes, b.travelMinutes)) * 100}%`,
                }}
              />
              <p className="fine">
                Cùng request, snapshot {p.snapshotId} và tập điểm. Chưa đo
                runtime hoặc objective từ solver.
              </p>
            </section>
          );
        })}
      </div>
      <p>
        Chênh lệch mẫu: {a.travelMinutes - b.travelMinutes} phút di chuyển và{" "}
        {currency(a.totalCostVnd - b.totalCostVnd)} chi phí nhóm.
      </p>
    </>
  );
}
