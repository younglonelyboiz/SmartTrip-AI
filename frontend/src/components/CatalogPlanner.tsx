import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { createCatalogPlan, fetchCatalogRecommendations, type CatalogPlace, type CatalogPlanRequest, type CatalogPlanResponse } from "../services/prototypeApi";
import { CatalogItinerary } from "./CatalogItinerary";

const cities = ["Đà Nẵng", "Huế", "Hà Nội"];
const initial: CatalogPlanRequest = {
  destination: cities[0], dayCount: 3, budgetVnd: null, mandatoryPlaceIds: [],
  schedule: { start: "08:00", end: "22:00", lunch: { start: "12:00", end: "13:00" } },
};

export function CatalogPlanner() {
  const [request, setRequest] = useState(initial);
  const [places, setPlaces] = useState<CatalogPlace[]>([]);
  const [catalogStatus, setCatalogStatus] = useState("Đang tải địa điểm…");
  const [catalogRetry, setCatalogRetry] = useState(0);
  const [catalogReady, setCatalogReady] = useState(false);
  const [result, setResult] = useState<CatalogPlanResponse | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const generation = useRef(0);
  const pending = useRef<AbortController | null>(null);
  const messageRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    setPlaces([]);
    setCatalogReady(false);
    setCatalogStatus("Đang tải địa điểm…");
    fetchCatalogRecommendations(request.destination, [], controller.signal).then((data) => {
      if (controller.signal.aborted) return;
      setPlaces(data.places);
      setCatalogReady(true);
      setCatalogStatus(data.places.length ? "" : "Thành phố chưa có địa điểm trong danh mục.");
    }).catch(() => {
      if (!controller.signal.aborted) setCatalogStatus("Không tải được địa điểm. Kiểm tra backend rồi thử lại.");
    });
    return () => controller.abort();
  }, [request.destination, catalogRetry]);
  useEffect(() => () => { generation.current++; pending.current?.abort(); }, []);

  function change(next: CatalogPlanRequest) {
    generation.current++;
    pending.current?.abort();
    setRequest(next);
    setResult(null);
    setMessage("");
    setLoading(false);
  }
  function schedule(start: string, end: string, lunch = request.schedule.lunch) {
    change({ ...request, schedule: { start, end, lunch } });
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    pending.current?.abort();
    const controller = new AbortController();
    pending.current = controller;
    const current = ++generation.current;
    setResult(null);
    setMessage("");
    setLoading(true);
    try {
      const data = await createCatalogPlan(request, controller.signal);
      if (generation.current !== current || controller.signal.aborted) return;
      if (data.status === "PLANNED_ESTIMATE") setResult(data);
      else { setMessage(data.reason); requestAnimationFrame(() => messageRef.current?.focus()); }
    } catch (error) {
      if (generation.current === current && !controller.signal.aborted) {
        setMessage(error instanceof Error ? error.message : "Không kết nối được backend. Hãy thử lại.");
        requestAnimationFrame(() => messageRef.current?.focus());
      }
    } finally {
      if (generation.current === current) setLoading(false);
    }
  }

  return <>
    <div className="page-heading"><div>
      <p className="muted">Một chuyến đi, theo cách của bạn</p>
      <h1>Thiết kế chuyến đi</h1>
      <p>Chọn thành phố và số ngày. Chúng tôi gợi ý điểm ghé, sắp xếp giờ và tuyến tham quan cho bạn.</p>
    </div></div>
    <form onSubmit={submit} className="catalog-planner" aria-label="Lập lịch chuyến đi">
      <div className="two-columns">
        <section className="panel" aria-labelledby="trip-input-heading">
          <h2 id="trip-input-heading">Thông tin chuyến đi</h2>
          <label>Điểm đến<select aria-label="Điểm đến" value={request.destination} onChange={e => change({ ...request, destination: e.target.value, mandatoryPlaceIds: [] })}>
            {cities.map(city => <option key={city}>{city}</option>)}
          </select></label>
          <label>Số ngày<input type="number" required min={1} max={14} step={1} value={Number.isNaN(request.dayCount) ? "" : request.dayCount} onChange={e => change({ ...request, dayCount: e.target.valueAsNumber })} /></label>
          <label>Ngân sách cho một người (VND, tùy chọn)<input type="number" min={0} step={1} max={Number.MAX_SAFE_INTEGER} placeholder="Để trống nếu chưa giới hạn" value={request.budgetVnd ?? ""} onChange={e => change({ ...request, budgetVnd: e.target.value === "" ? null : e.target.valueAsNumber })} aria-describedby="budget-scope" /></label>
          <p id="budget-scope" className="fine">Gồm vé tham quan và di chuyển giữa các điểm. Chưa gồm ăn uống, khách sạn và vé đến/rời thành phố. Giá chỉ là ước tính.</p>
          <details className="catalog-time-settings">
            <summary>Chỉnh giờ mỗi ngày (tùy chọn)</summary>
            <p className="fine">Áp dụng chung cho toàn chuyến. Mặc định 08:00–22:00, nghỉ trưa 12:00–13:00.</p>
            <div className="form-grid">
              <label>Giờ bắt đầu<input type="time" required value={request.schedule.start} onChange={e => schedule(e.target.value, request.schedule.end)} /></label>
              <label>Giờ kết thúc<input type="time" required value={request.schedule.end} onChange={e => schedule(request.schedule.start, e.target.value)} /></label>
            </div>
            <label className="catalog-check"><input type="checkbox" checked={request.schedule.lunch !== null} onChange={e => schedule(request.schedule.start, request.schedule.end, e.target.checked ? { start: "12:00", end: "13:00" } : null)} /> Nghỉ trưa</label>
            {request.schedule.lunch && <div className="form-grid">
              <label>Bắt đầu nghỉ<input type="time" required value={request.schedule.lunch.start} onChange={e => schedule(request.schedule.start, request.schedule.end, { start: e.target.value, end: request.schedule.lunch!.end })} /></label>
              <label>Kết thúc nghỉ<input type="time" required value={request.schedule.lunch.end} onChange={e => schedule(request.schedule.start, request.schedule.end, { start: request.schedule.lunch!.start, end: e.target.value })} /></label>
            </div>}
            <p className="fine">Khung giờ phải nằm trong cùng ngày; khoảng nghỉ nằm trong giờ đi chơi. Các điểm vẫn cần phù hợp khung tham quan riêng.</p>
          </details>
          <button type="submit" disabled={loading || !catalogReady || places.length === 0}>{loading ? "Đang tính lịch và tuyến…" : "Gợi ý lịch trình"}</button>
          <p className="fine" role="status" aria-live="polite">{loading ? "Đang tìm lịch phù hợp và lấy tuyến đường, có thể mất tối đa khoảng 45 giây." : "Bạn có thể để hệ thống tự chọn toàn bộ điểm ghé."}</p>
          <p ref={messageRef} tabIndex={-1} role="alert" className={message ? "notice" : ""}>{message}</p>
          <Link className="fine" to="/planner?scenario=standard">Xem kịch bản demo Đà Nẵng</Link>
        </section>
        <section className="panel" aria-labelledby="required-places-heading">
          <h2 id="required-places-heading">Điểm dừng bắt buộc <span className="fine">(tùy chọn)</span></h2>
          <p className="fine">Chọn điểm bạn nhất định muốn ghé. Hệ thống sẽ gợi ý thêm những điểm phù hợp.</p>
          <p role="status">{catalogStatus}</p>
          {!catalogReady && !catalogStatus.startsWith("Đang") && <button type="button" className="secondary" onClick={() => setCatalogRetry(n => n + 1)}>Tải lại địa điểm</button>}
          <div className="catalog-place-list">
            {places.map(place => <div className="catalog-place" key={place.osmId}>
              <label className="catalog-check"><input type="checkbox" checked={request.mandatoryPlaceIds.includes(place.osmId)} onChange={e => change({ ...request, mandatoryPlaceIds: e.target.checked ? [...request.mandatoryPlaceIds, place.osmId] : request.mandatoryPlaceIds.filter(id => id !== place.osmId) })} /><span>{place.name}<small>{place.tags.join(" · ")}</small></span></label>
              <a className="fine" href={`https://www.openstreetmap.org/${place.osmId}`} target="_blank" rel="noreferrer" aria-label={`Nguồn OSM: ${place.name}`}>OSM ↗</a>
            </div>)}
          </div>
          <p className="fine">Danh mục khảo sát OSM; tên và tọa độ chưa xác minh. Đã chọn {request.mandatoryPlaceIds.length} điểm bắt buộc.</p>
        </section>
      </div>
    </form>
    {result && <CatalogItinerary plan={result} />}
  </>;
}
