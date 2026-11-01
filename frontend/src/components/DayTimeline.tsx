import { snapshot } from "../services/mockTravelService";
import { clock, type DayPlan } from "../domain/types";
import { DestinationPhoto } from "./DestinationPhoto";
import { placePhotos } from "../domain/photos";
export function DayTimeline({ day }: { day: DayPlan }) {
  let previous = "hotel";
  return (
    <section className="panel">
      <div className="section-title">
        <h2>Lịch trình trong ngày</h2>
        <span className="badge">Giờ Việt Nam</span>
      </div>
      <p className="depot">
        {clock(day.departureMinute)} · Xuất phát từ nơi lưu trú
      </p>
      <ol className="timeline">
        {day.visits.map((v, i) => {
          const place = snapshot.places.find((p) => p.id === v.placeId)!;
          const edge = snapshot.edges.find(
            (e) => e.fromId === previous && e.toId === place.id,
          );
          previous = place.id;
          return (
            <li key={v.placeId}>
              <span className="stop-number">{i + 1}</span>
              <div className="visit-content">
                <p className="fine">Di chuyển {edge?.travelMinutes} phút</p>
                <p className="time">
                  {clock(v.startMinute)} – {clock(v.endMinute)}
                </p>
                <h3>{place.name}</h3>
                <p className="muted">
                  {place.category} · Tham quan {place.durationMinutes} phút
                </p>
                {placePhotos[place.id] ? (
                  <DestinationPhoto
                    photo={placePhotos[place.id]!}
                    className="visit-photo"
                  />
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
      <p className="depot">
        {clock(day.returnMinute)} · Trở về nơi lưu trú, đã tính thời gian di
        chuyển
      </p>
    </section>
  );
}
