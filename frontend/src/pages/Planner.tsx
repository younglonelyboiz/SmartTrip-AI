import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  scenarios,
  snapshot,
  getScenario,
} from "../services/mockTravelService";
import { defaultJourney, journeyFromSearch, journeySearch, journeyConflict } from "../domain/journey";
import type { TravelRequest } from "../domain/types";
import { DestinationPhoto } from "../components/DestinationPhoto";
import { placePhotos } from "../domain/photos";
import { Icon } from "../components/Icon";
export function Planner() {
  const [params] = useSearchParams();
  const initialScenario = scenarios.find(s => s.id === params.get("scenario")) ?? scenarios[0];
  const [id, setId] = useState(initialScenario.id);
  const [req, setReq] = useState<TravelRequest>(() =>
    (() => {
      const request = structuredClone(initialScenario.request);
      const place = params.get("place");
      if (place && snapshot.places.some(p => p.id === place)) {
        request.mandatoryPlaceIds = [...new Set([...request.mandatoryPlaceIds, place])];
        request.excludedPlaceIds = request.excludedPlaceIds.filter(id => id !== place);
      }
      return request;
    })(),
  );
  const [journey, setJourney] = useState(() => journeyFromSearch("?" + params.toString()) ?? defaultJourney());
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  function select(id: string) {
    setId(id);
    setReq(structuredClone(scenarios.find((s) => s.id === id)!.request));
    setMessage("");
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (
      req.endDate < req.startDate ||
      !Number.isInteger(req.partySize) ||
      req.partySize < 1 ||
      !Number.isInteger(req.budgetVnd) ||
      req.budgetVnd < 0
    ) {
      setMessage(
        "Kiểm tra ngày đi, số người nguyên dương và ngân sách VND nguyên không âm.",
      );
      return;
    }
    if (!journeyFromSearch(journeySearch(journey))) {
      setMessage("Kiểm tra điểm đi, giờ đến–về và dự trù VND nguyên không âm.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const response = await getScenario(req, id);
      if (response.kind === "unsupported") setMessage(response.message);
      else if (response.scenario.result.plan) {
        const p = response.scenario.result.plan;
        const invalid = journeyConflict(journey, p);
        if (invalid) { setMessage(invalid); return; }
        navigate(`/trips/${p.tripId}/versions/${p.versionId}${journeySearch(journey)}`);
      } else setMessage(response.scenario.result.reason);
    } catch {
      setMessage("Không tải được dữ liệu demo. Hãy thử chọn lại kịch bản.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="muted">Bắt đầu từ điều bạn muốn</p>
          <h1>Thiết kế chuyến đi</h1>
          <p>Chọn mẫu để khám phá lịch trình và các tình huống ràng buộc.</p>
        </div>
      </div>
      <div className="two-columns planner-layout">
        <form className="panel" onSubmit={submit}>
          <h2>Yêu cầu chuyến đi</h2>
          <label>
            Kịch bản minh họa
            <select
              value={id}
              disabled={loading}
              onChange={(e) => select(e.target.value)}
            >
              {scenarios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </label>
          <fieldset disabled={loading}>
            <legend>Điểm đi và chặng đi–về</legend>
            <div className="form-grid">
              <label>Điểm xuất phát<input required maxLength={100} value={journey.origin} onChange={e=>setJourney({...journey,origin:e.target.value})} /></label>
              <label>Phương tiện đi–về<select value={journey.mode} onChange={e=>setJourney({...journey,mode:e.target.value})}>{['Máy bay','Tàu hỏa','Xe khách','Ô tô'].map(mode=><option key={mode}>{mode}</option>)}</select></label>
              <label>Giờ đến điểm đến (ngày đầu)<input type="time" required value={journey.arrival} onChange={e=>setJourney({...journey,arrival:e.target.value})}/></label>
              <label>Giờ rời điểm đến (ngày cuối)<input type="time" required value={journey.departure} onChange={e=>setJourney({...journey,departure:e.target.value})}/></label>
              <label>Thời gian mỗi chặng nối (phút)<input type="number" required min="0" max="1440" step="1" value={journey.transferMinutes} onChange={e=>setJourney({...journey,transferMinutes:Number(e.target.value)})}/></label>
              <label>Dự trù đi–về và chặng nối cả nhóm (VND)<input type="number" min="0" max="9007199254740991" step="1" placeholder="Chưa biết" value={journey.travelCost} onChange={e=>setJourney({...journey,travelCost:e.target.value})}/></label>
            </div>
            <p className="fine">Giờ đến/rời là tại sân bay, ga hoặc bến ở điểm đến; thời gian nối bao gồm di chuyển đến nơi lưu trú và khoảng đệm bạn cần. Chưa tra cứu chuyến hoặc giá thực tế. Chưa biết chi phí thì để trống.</p>
          </fieldset>
          <fieldset disabled={loading}>
            <legend>Thời gian và ngân sách</legend>
            <div className="form-grid">
              <label>
                Điểm đến
                <input
                  value={req.destination}
                  onChange={(e) =>
                    setReq({ ...req, destination: e.target.value })
                  }
                />
              </label>
              <label>
                Số người
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={req.partySize}
                  onChange={(e) =>
                    setReq({ ...req, partySize: Number(e.target.value) })
                  }
                />
              </label>
              <label>
                Ngày bắt đầu
                <input
                  type="date"
                  required
                  value={req.startDate}
                  onChange={(e) =>
                    setReq({ ...req, startDate: e.target.value })
                  }
                />
              </label>
              <label>
                Ngày kết thúc
                <input
                  type="date"
                  required
                  value={req.endDate}
                  min={req.startDate}
                  onChange={(e) => setReq({ ...req, endDate: e.target.value })}
                />
              </label>
            </div>
            <label>
              Ngân sách tổng nhóm (VND)
              <input
                type="number"
                min="0"
                step="1"
                required
                value={req.budgetVnd}
                onChange={(e) =>
                  setReq({ ...req, budgetVnd: Number(e.target.value) })
                }
              />
            </label>
            <label>
              Sở thích (phân cách bằng dấu phẩy)
              <input
                value={req.interests.join(", ")}
                onChange={(e) =>
                  setReq({
                    ...req,
                    interests: e.target.value.split(",").map((x) => x.trim()),
                  })
                }
              />
            </label>
            <p className="fine">
              Khung giờ mẫu 08:00–18:00 · Cùng nơi lưu trú mỗi ngày. Đây là form
              có cấu trúc, chưa có AI phân tích yêu cầu.
            </p>
          </fieldset>
          <button disabled={loading} type="submit">
            {loading ? "Đang mở kịch bản…" : "Xem kết quả mock"}
          </button>
          <div
            className={message ? "notice" : ""}
            role="status"
            aria-live="polite"
          >
            {message}
          </div>
        </form>
        <aside className="panel candidates-panel">
          <h2>Điểm dừng ứng viên</h2>
          <p className="muted">
            Điểm phù hợp và thông số giả lập, chưa chạy hệ gợi ý.
          </p>
          <div className="candidate-list">
            {snapshot.places.map((p) => (
              <div key={p.id} className="candidate-row">
                {placePhotos[p.id] ? (
                  <DestinationPhoto
                    photo={placePhotos[p.id]!}
                    className="candidate-photo"
                  />
                ) : (
                  <div className="candidate-placeholder">
                    <Icon name="pin" />
                  </div>
                )}
                <div className="candidate-content">
                  <strong>{p.name}</strong>
                  <p>
                    {p.category} · {p.durationMinutes} phút
                  </p>
                  <div className="checks-inline">
                    <label>
                      <input
                        type="checkbox"
                        disabled={
                          loading || req.excludedPlaceIds.includes(p.id)
                        }
                        checked={req.mandatoryPlaceIds.includes(p.id)}
                        onChange={(e) =>
                          setReq({
                            ...req,
                            mandatoryPlaceIds: e.target.checked
                              ? [...req.mandatoryPlaceIds, p.id]
                              : req.mandatoryPlaceIds.filter((x) => x !== p.id),
                          })
                        }
                      />{" "}
                      Bắt buộc
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        disabled={
                          loading || req.mandatoryPlaceIds.includes(p.id)
                        }
                        checked={req.excludedPlaceIds.includes(p.id)}
                        onChange={(e) =>
                          setReq({
                            ...req,
                            excludedPlaceIds: e.target.checked
                              ? [...req.excludedPlaceIds, p.id]
                              : req.excludedPlaceIds.filter((x) => x !== p.id),
                          })
                        }
                      />{" "}
                      Loại trừ
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {req.lockedVisits.length ? (
            <p className="notice">
              Giữ Mỹ Khê ngày 10/12 lúc 08:20 như phiên bản trước.
            </p>
          ) : null}
        </aside>
      </div>
    </>
  );
}
