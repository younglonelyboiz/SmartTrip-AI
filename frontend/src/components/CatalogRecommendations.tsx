import { useEffect, useRef, useState } from "react";
import { createCatalogDraft, fetchCatalogRecommendations, type CatalogDraft, type CatalogPlace } from "../services/prototypeApi";

const destinations = ["Đà Nẵng", "Huế", "Hà Nội"];

export function CatalogRecommendations({ interests, startDate, endDate }: { interests: string[]; startDate: string; endDate: string }) {
  const [destination, setDestination] = useState(destinations[0]);
  const [places, setPlaces] = useState<CatalogPlace[]>([]);
  const [status, setStatus] = useState("Đang tải danh mục…");
  const [selected, setSelected] = useState<string[]>([]);
  const [draft, setDraft] = useState<CatalogDraft | null>(null);
  const [draftStatus, setDraftStatus] = useState("");
  const [creating, setCreating] = useState(false);
  const interestKey = JSON.stringify(interests);
  const requestKey = JSON.stringify([destination, startDate, endDate, selected]);
  const requestKeyRef = useRef(requestKey);
  requestKeyRef.current = requestKey;

  useEffect(() => {
    const controller = new AbortController();
    setPlaces([]);
    setStatus("Đang tải danh mục…");
    fetchCatalogRecommendations(destination, JSON.parse(interestKey) as string[], controller.signal)
      .then((result) => {
        setPlaces(result.places);
        setStatus(result.places.length ? "" : "Chưa có điểm gợi ý.");
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus("Không tải được danh mục. Hãy kiểm tra backend.");
      });
    return () => controller.abort();
  }, [destination, interestKey]);

  useEffect(() => {
    setDraft(null);
    setDraftStatus("");
  }, [destination, startDate, endDate, selected]);

  async function createDraft() {
    if (!startDate || !endDate || endDate < startDate) {
      setDraftStatus("Vui lòng chọn ngày bắt đầu và kết thúc hợp lệ trong biểu mẫu.");
      return;
    }
    setCreating(true);
    setDraftStatus("");
    try {
      const result = await createCatalogDraft(destination, startDate, endDate, selected);
      if (requestKeyRef.current === requestKey) setDraft(result);
    } catch {
      if (requestKeyRef.current === requestKey) setDraftStatus("Không tạo được lịch nháp. Kiểm tra backend, điểm đã chọn và khoảng thời gian tối đa 14 ngày.");
    } finally {
      setCreating(false);
    }
  }

  return <section className="panel" aria-labelledby="osm-catalog-heading">
    <h2 id="osm-catalog-heading">Điểm dừng ứng viên</h2>
    <p className="fine">Chọn điểm để tạo lịch nháp theo ngày trong biểu mẫu. Tên, vị trí và nhãn chưa xác minh; lịch nháp chưa kiểm tra giờ, giá hay tuyến.</p>
    <label>Điểm đến
      <select value={destination} disabled={creating} onChange={(event) => { setSelected([]); setDestination(event.target.value); }}>
        {destinations.map((item) => <option key={item} value={item}>{item}</option>)}
      </select>
    </label>
    <p role="status" className="fine">{status}</p>
    <div className="candidate-list">
      {places.map((place) => <div className="candidate-row" key={place.osmId}>
        <div className="candidate-content">
          <strong>{place.name}</strong>
          <label className="fine"><input type="checkbox" disabled={creating} checked={selected.includes(place.osmId)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, place.osmId] : current.filter((id) => id !== place.osmId))} /> Thêm vào lịch nháp</label>
          <p className="fine">{place.tags.join(" · ")} · {place.matchedInterests.length ? `Khớp: ${place.matchedInterests.join(", ")}` : "Chưa khớp sở thích"}</p>
          <p className="fine">Giờ mở cửa và giá: chưa xác minh · <a href={`https://www.openstreetmap.org/${place.osmId}`} target="_blank" rel="noreferrer">Xem nguồn OSM</a></p>
        </div>
      </div>)}
    </div>
    <button type="button" disabled={creating || selected.length === 0} onClick={createDraft}>{creating ? "Đang tạo lịch nháp…" : `Tạo lịch nháp (${selected.length} điểm)`}</button>
    <p role="status" className="fine">{draftStatus}</p>
    {draft && <section aria-label="Lịch nháp từ địa điểm OSM">
      <h3>Lịch nháp {draft.destination}</h3>
      <p className="notice">Các điểm được chia luân phiên theo ngày đã chọn; chưa tối ưu hoặc kiểm tra giờ mở cửa, chi phí, di chuyển hay tính khả thi. Chưa thể lưu như lịch trình hoàn chỉnh.</p>
      {draft.days.map((day) => <div key={day.date}>
        <strong>{day.date}</strong>
        {day.places.length ? <ol>{day.places.map((place) => <li key={place.osmId}>{place.name} · giờ và chi phí chưa xác minh</li>)}</ol> : <p className="fine">Chưa có điểm.</p>}
      </div>)}
    </section>}
    <p className="fine">Dữ liệu bản đồ © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a> · ODbL.</p>
  </section>;
}
