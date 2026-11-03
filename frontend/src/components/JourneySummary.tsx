import { Link } from 'react-router-dom';
import { journeyFromSearch, journeyConflict, minuteOfDay } from '../domain/journey';
import { clock, currency, dateLabel, type PlanVersion } from '../domain/types';
export function JourneySummary({plan,search}:{plan:PlanVersion;search:string}) {
  const j=journeyFromSearch(search);
  if (!j) return <section className="panel journey-summary"><h2>Toàn hành trình của bạn</h2><p>Lịch tham quan bắt đầu và kết thúc tại nơi lưu trú ở {plan.request.destination}. Chưa có thông tin đi–về từ tỉnh/thành xuất phát.</p><Link to="/planner">Bổ sung điểm đi và chặng đi–về</Link></section>;
  const conflict=journeyConflict(j,plan);
  const subtotal=plan.totalCostVnd+(j.travelCost===''?0:Number(j.travelCost));
  return <section className="panel journey-summary"><h2>{j.origin} → {plan.request.destination} → {j.origin}</h2><p>{j.mode} · Thời gian do bạn nhập, chưa đối chiếu lịch vận hành thực tế.</p>
    <div className="journey-stages"><div><strong>Đến {plan.request.destination}</strong><p>{dateLabel(plan.request.startDate)} · {j.arrival}</p><small>Chặng nối: {j.transferMinutes} phút. Sẵn sàng tham quan từ {(minuteOfDay(j.arrival)+j.transferMinutes>=1440 ? "ngày kế tiếp" : clock(minuteOfDay(j.arrival)+j.transferMinutes))}.</small></div><div><strong>Tham quan tại điểm đến</strong><p>Lịch theo ngày ở trên</p><small>Thời gian di chuyển nội đô tách biệt chặng liên tỉnh.</small></div><div><strong>Rời {plan.request.destination}</strong><p>{dateLabel(plan.request.endDate)} · {j.departure}</p><small>Cần kết thúc tham quan trước {clock(Math.max(0,minuteOfDay(j.departure)-j.transferMinutes))} để nối chặng về.</small></div></div>
    {conflict ? <p className="notice" role="alert">{conflict}</p> : <p>Giờ đến–về phù hợp với lịch mẫu theo thời gian nối bạn nhập.</p>}
    <p><strong>{j.travelCost===''?'Chi phí đã biết':'Tổng dự trù theo thông tin bạn nhập'}: {currency(subtotal)}</strong></p>
    <p className="fine">{j.travelCost===''?'Chưa có chi phí đi–về và chặng nối, nên chưa thể xác nhận ngân sách toàn chuyến.':`Gồm ${currency(plan.totalCostVnd)} tại điểm đến (giả lập) và ${currency(Number(j.travelCost))} đi–về/chặng nối (do bạn nhập). Đây không phải báo giá.`}</p>
    {j.travelCost!==''&&subtotal>plan.request.budgetVnd?<p className="notice">Tổng dự trù vượt ngân sách nhóm {currency(subtotal-plan.request.budgetVnd)}. Cần điều chỉnh kế hoạch hoặc ngân sách.</p>:null}
  </section>;
}
