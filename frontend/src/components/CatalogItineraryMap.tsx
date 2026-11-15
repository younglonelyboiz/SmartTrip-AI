import { useEffect, useRef, useState } from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { CatalogPlanDay } from "../services/prototypeApi";

export function CatalogItineraryMap({ day }: { day: CatalogPlanDay }) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markers = useRef<L.Marker[]>([]);
  const [tileError, setTileError] = useState(false);
  useEffect(() => {
    if (!container.current) return;
    setTileError(false);
    // Leaflet 1.9 leaves a zoom-transition timer alive after remove(); days/routes unmount maps.
    const map = L.map(container.current, { scrollWheelZoom: false, zoomAnimation: false });
    mapRef.current = map;
    const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
    }).addTo(map);
    tiles.on("tileerror", () => setTileError(true));
    const points: L.LatLngTuple[] = [];
    day.legs.forEach(leg => {
      const path: L.LatLngTuple[] = leg.coordinates.map(([lon, lat]) => [lat, lon]);
      points.push(...path);
      L.polyline(path, { color: "#256bb7", weight: 4 }).addTo(map);
    });
    markers.current = day.visits.map((visit, index) => {
      points.push([visit.lat, visit.lon]);
      const text = document.createElement("strong");
      text.textContent = `${index + 1}. ${visit.name}`;
      return L.marker([visit.lat, visit.lon], {
        title: visit.name, alt: visit.name,
        icon: L.divIcon({ className: "destination-map-pin", html: `<span>${index + 1}</span>`, iconSize: [36, 36], iconAnchor: [18, 18] }),
      }).addTo(map).bindPopup(text);
    });
    if (points.length) map.fitBounds(L.latLngBounds(points), { padding: [32, 32], maxZoom: 14 });
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container.current);
    return () => { observer.disconnect(); map.remove(); mapRef.current = null; markers.current = []; };
  }, [day]);
  return <section className="panel planner-map-panel" aria-label={`Bản đồ ngày ${day.dayNumber}`}>
    <h3>Tuyến tham quan ngày {day.dayNumber}</h3>
    <p className="fine">{day.legs.length ? "Tuyến ô tô dự kiến · GraphHopper / OpenStreetMap" : "Một điểm tham quan; không có chặng giữa các điểm."}</p>
    <div className="destination-map" ref={container} aria-label="Bản đồ tương tác, dùng nút cộng trừ để thu phóng" />
    {tileError && <p role="status" className="notice">Không tải được nền bản đồ. Tuyến và danh sách điểm vẫn được giữ; hãy kiểm tra kết nối mạng.</p>}
    <ol className="map-stop-list">{day.visits.map((visit, index) => <li key={visit.osmId}><button type="button" onClick={() => {
      mapRef.current?.panTo([visit.lat, visit.lon]); markers.current[index]?.openPopup();
    }}><span>{index + 1}</span>{visit.name}</button></li>)}</ol>
  </section>;
}
