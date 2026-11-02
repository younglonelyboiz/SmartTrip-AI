import { Link, useParams } from "react-router-dom";
import { destinations } from "../domain/destinations";
import { DestinationPhoto } from "../components/DestinationPhoto";
export function Destination() {
  const { destinationId } = useParams();
  const destination = destinations.find(d => d.id === destinationId && d.days.length);
  if (!destination) return <section className="panel"><h1>Không tìm thấy điểm đến</h1><Link to="/">Về khám phá</Link></section>;
  return <>
    <Link className="back-link" to="/#diem-den">Về các điểm đến</Link>
    <div className="province-cover"><DestinationPhoto photo={destination.photo} eager /></div>
    <div className="province-heading"><p>{destination.region} · {destination.duration}</p><h1>{destination.name}, một hành trình để khám phá.</h1><p>{destination.description}</p></div>
    <p className="notice">Lộ trình tham khảo minh họa, chưa qua kiểm tra tuyến đường, giờ mở cửa hoặc chi phí. Hãy xác nhận thông tin trước khi đi.</p>
    <div className="province-days">{destination.days.map((day, index) => <section className="panel" key={day.title}><p className="muted">Ngày {index + 1}</p><h2>{day.title}</h2><ol>{day.stops.map(stop => <li key={stop}>{stop}</li>)}</ol></section>)}</div>
    <p>Muốn thử lập lịch với ràng buộc thời gian và ngân sách? Bộ demo tương tác hiện hỗ trợ Đà Nẵng.</p><Link className="button" to="/planner">Thử lập kế hoạch Đà Nẵng</Link>
  </>;
}
