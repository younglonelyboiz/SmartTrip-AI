import { Link } from "react-router-dom";
import { snapshot } from "../services/mockTravelService";
import { SourceBadge } from "../components/SourceBadge";
export function Admin({ role }: { role: string }) {
  if (role !== "admin")
    return (
      <>
        <h1>Chế độ quản trị demo</h1>
        <p>
          Chọn hồ sơ quản trị để xem dữ liệu minh họa. Đây chỉ là chế độ giao
          diện.
        </p>
        <Link to="/demo-login">Chọn hồ sơ</Link>
      </>
    );
  return (
    <>
      <h1>Danh mục và nguồn dữ liệu</h1>
      <p>Chỉ xem bản mẫu. Không cập nhật dữ liệu hoặc gọi API thật.</p>
      <section className="panel">
        <h2>Nguồn và snapshot</h2>
        {snapshot.sources.map((s) => (
          <p key={s.id}>
            <strong>{s.name}</strong> <SourceBadge />
            <br />
            {s.notes}
          </p>
        ))}
        <p className="fine">{snapshot.snapshotId} · Ghi nhận 02/11/2026</p>
      </section>
      <section className="panel table-scroll">
        <table>
          <caption>Địa điểm ứng viên mô phỏng</caption>
          <thead>
            <tr>
              <th scope="col">Địa điểm</th>
              <th scope="col">Loại hình</th>
              <th scope="col">Thời lượng</th>
              <th scope="col">Điểm phù hợp mẫu</th>
            </tr>
          </thead>
          <tbody>
            {snapshot.places.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.category}</td>
                <td>{p.durationMinutes} phút</td>
                <td>{p.relevanceScore}/1000</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
