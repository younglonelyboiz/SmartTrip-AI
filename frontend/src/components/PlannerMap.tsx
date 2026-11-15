import { useEffect, useId, useRef, useState } from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import { snapshot } from "../services/mockTravelService";
import { fetchRoute, type RouteLeg } from "../services/prototypeApi";
import type { DatasetSnapshot } from "../domain/types";

// Representative positions for the demo destinations, not entrance/navigation coordinates.
const coordinates: Record<string, L.LatLngTuple> = {
  "my-khe": [16.0547, 108.2473],
  "han-market": [16.0679, 108.2240],
  marble: [15.9994, 108.2634],
  museum: [16.0607, 108.2230],
  "son-tra": [16.1003, 108.2779],
  bridge: [16.0611, 108.2300],
};

export function PlannerMap({ placeIds, destination, showRoadRoute = false, data = snapshot, positions = coordinates }: { placeIds: string[]; destination: string; showRoadRoute?: boolean; data?: DatasetSnapshot; positions?: Record<string, L.LatLngTuple> }) {
  const headingId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const [tileError, setTileError] = useState(false);
  const [routeStatus, setRouteStatus] = useState("");
  const [routeLegs, setRouteLegs] = useState<RouteLeg[]>([]);
  const routeKey = JSON.stringify(placeIds);
  const places = placeIds.flatMap((id) => {
    const place = data.places.find((item) => item.id === id);
    return place && positions[id] ? [place] : [];
  });

  useEffect(() => {
    if (!containerRef.current) return;
    const ids: string[] = JSON.parse(routeKey);
    const stops = ids.flatMap((id) => {
      const place = data.places.find((item) => item.id === id);
      return place && positions[id] ? [place] : [];
    });
    // Leaflet 1.9 leaves a zoom-transition timer alive after remove(); days/routes unmount maps.
    const map = L.map(containerRef.current, { scrollWheelZoom: false, zoomControl: false, zoomAnimation: false });
    mapRef.current = map;
    L.control.zoom({ position: "topright" }).addTo(map);
    const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    tiles.on("tileerror", () => setTileError(true));
    tiles.on("tileload", () => setTileError(false));
    const points = stops.map((place) => positions[place.id]);
    if (!showRoadRoute && points.length > 1) {
      L.polyline(points, { color: "#fff", weight: 7, opacity: .95 }).addTo(map);
      L.polyline(points, { color: "#256bb7", weight: 3, dashArray: "7 7" }).addTo(map);
    }
    stops.forEach((place, index) => {
      const label = document.createElement("strong");
      label.textContent = `${index + 1}. ${place.name}`;
      const marker = L.marker(positions[place.id], {
        icon: L.divIcon({
          className: "destination-map-pin",
          html: `<span>${index + 1}</span>`,
          iconSize: [36, 36], iconAnchor: [18, 18],
        }),
        title: `${index + 1}. ${place.name}`,
        alt: place.name,
      }).addTo(map).bindPopup(label);
      const tooltip = document.createElement("span");
      tooltip.textContent = place.name;
      marker.bindTooltip(tooltip, { direction: "top", offset: [0, -18] });
      markersRef.current[place.id] = marker;
    });
    if (points.length) map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 14 });
    else map.setView([16.06, 108.23], 12);
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
      markersRef.current = {};
    };
  }, [routeKey, showRoadRoute, data, positions]);

  useEffect(() => {
    setRouteLegs([]);
    if (!showRoadRoute) return;
    const ids = (JSON.parse(routeKey) as string[]).filter((id) => positions[id]);
    if (ids.length < 2) {
      setRouteStatus("Cần ít nhất hai điểm dừng để tính tuyến đường.");
      return;
    }
    const controller = new AbortController();
    setRouteStatus("Đang tính tuyến ô tô từ GraphHopper…");
    fetchRoute(ids, controller.signal).then(({ legs }) => {
      const map = mapRef.current;
      if (!map || controller.signal.aborted) return;
      const routePoints: L.LatLngTuple[] = [];
      legs.forEach((leg) => {
        const path: L.LatLngTuple[] = leg.coordinates.map(([lon, lat]) => [lat, lon]);
        routePoints.push(...path);
        L.polyline(path, { color: "#fff", weight: 7, opacity: .95 }).addTo(map);
        L.polyline(path, { color: "#256bb7", weight: 4, opacity: .95 }).addTo(map);
      });
      if (routePoints.length) map.fitBounds(L.latLngBounds(routePoints), { padding: [48, 48], maxZoom: 14 });
      setRouteLegs(legs);
      setRouteStatus("");
    }).catch(() => {
      if (!controller.signal.aborted) setRouteStatus("Chưa tính được tuyến đường. Hãy kiểm tra backend và GraphHopper đang chạy.");
    });
    return () => controller.abort();
  }, [routeKey, showRoadRoute, positions]);

  function fitRoute() {
    const points: L.LatLngTuple[] = routeLegs.length
      ? routeLegs.flatMap((leg) => leg.coordinates.map(([lon, lat]) => [lat, lon] as L.LatLngTuple))
      : places.map((place) => positions[place.id]);
    if (points.length) mapRef.current?.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 14 });
  }

  return <section className="panel planner-map-panel" aria-labelledby={headingId}>
    <div className="planner-map-heading">
      <div><p className="map-eyebrow">BẢN ĐỒ ĐIỂM ĐẾN</p><h2 id={headingId}>{destination || "Đà Nẵng"}</h2></div>
      <span className="map-status"><i />{places.length} điểm dừng</span>
    </div>
    <div className="destination-map-wrap">
      <div className="destination-map" ref={containerRef} aria-label="Bản đồ tương tác các điểm đến, dùng nút cộng trừ để thu phóng" />
      <button type="button" className="map-fit-button" onClick={fitRoute} disabled={!places.length}>⌖ Toàn tuyến</button>
      {tileError && <p className="map-network-notice" role="status">Chưa tải được nền bản đồ. Kiểm tra kết nối mạng; danh sách điểm dừng vẫn ở bên dưới.</p>}
    </div>
    <ol className="map-stop-list">
      {places.map((place, index) => <li key={place.id}><button type="button" onClick={() => {
        mapRef.current?.panTo(positions[place.id]);
        markersRef.current[place.id]?.openPopup();
      }}><span>{index + 1}</span>{place.name}<small>↗</small></button></li>)}
    </ol>
    {!places.length && <p className="fine">Chọn điểm bắt buộc để hiển thị trên bản đồ.</p>}
    {showRoadRoute ? <>
      {routeStatus && <p className="fine map-disclaimer" role="status">{routeStatus}</p>}
      {routeLegs.length > 0 && <div className="fine map-disclaimer">
        <p>Tuyến ô tô dự kiến giữa các điểm ghé · GraphHopper / OpenStreetMap. Chưa bao gồm nơi lưu trú; tọa độ là tham khảo.</p>
        <ul>{routeLegs.map((leg, index) => <li key={`${index}-${leg.fromId}-${leg.toId}`}>
          {data.places.find((place) => place.id === leg.fromId)?.name} → {data.places.find((place) => place.id === leg.toId)?.name}: khoảng {(leg.distanceMeters / 1000).toFixed(1)} km · ước tính {Math.ceil(leg.durationMs / 60000)} phút
        </li>)}</ul>
        <p>Số liệu tính riêng, khác lịch mẫu giả lập; chưa phản ánh giao thông hoặc hạn chế rẽ, không dùng để chỉ dẫn lái xe.</p>
      </div>}
    </> : <p className="fine map-disclaimer">Vị trí tham khảo. Đường nét đứt nối thứ tự ghé, chưa phải tuyến chỉ đường thực tế.</p>}
  </section>;
}
