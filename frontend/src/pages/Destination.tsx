import { Link, useParams } from "react-router-dom";
import { destinations } from "../domain/destinations";
import { DestinationPhoto } from "../components/DestinationPhoto";
import { additionalItineraries, type SampleItinerary } from "../domain/destinationItineraries";
export function Destination() {
  const { destinationId } = useParams();
  const destination = destinations.find(d => d.id === destinationId && d.days.length);
  if (!destination) return <section className="panel"><h1>Không tìm thấy điểm đến</h1><Link to="/">Về khám phá</Link></section>;
  const itineraries: SampleItinerary[] = [
    { title: `${destination.name} thong thả`, duration: destination.duration, description: destination.description, days: destination.days },
    ...(additionalItineraries[destination.id] ?? []),
  ];
  return <>
    <Link className="back-link" to="/#diem-den">Về các điểm đến</Link>
    <div className="province-cover"><DestinationPhoto photo={destination.photo} eager /></div>
    <div className="province-heading"><p>{destination.region} · {destination.duration}</p><h1>{destination.name}, một hành trình để khám phá.</h1><p>{destination.description}</p></div>
    <p className="notice">Lộ trình tham khảo minh họa, chưa qua kiểm tra tuyến đường, giờ mở cửa hoặc chi phí. Hãy xác nhận thông tin trước khi đi.</p>
    <section aria-labelledby="sample-itineraries-heading">
      <h2 id="sample-itineraries-heading">Một vài lịch trình tham khảo</h2>
      <p>Chọn một lịch để xem các gợi ý theo ngày.</p>
      <div className="province-days">{itineraries.map((itinerary, itineraryIndex) => <details className="panel sample-itinerary" key={itinerary.title} open={itineraryIndex === 0}>
        <summary><span><strong>{itinerary.title}</strong><small>{itinerary.duration} · {itinerary.description}</small></span></summary>
        {itinerary.days.map((day, index) => <section className="sample-itinerary-day" key={day.title}><p className="muted">Ngày {index + 1}</p><h3>{day.title}</h3><ol>{day.stops.map(stop => <li key={stop}>{stop}</li>)}</ol></section>)}
      </details>)}</div>
    </section>
    <p>Xem lịch trình demo chi tiết kèm bản đồ và dự toán giả lập.</p><Link className="button" to={destination.href}>Xem happy case {destination.name}</Link>
  </>;
}
