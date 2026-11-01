import { useNavigate } from "react-router-dom";
import { DestinationPhoto } from "../components/DestinationPhoto";
import { Icon } from "../components/Icon";
export function DemoLogin({ setRole }: { setRole: (role: string) => void }) {
  const navigate = useNavigate();
  return (
    <section className="welcome panel">
      <div className="welcome-copy">
        <p className="muted">Một chuyến đi vừa với bạn</p>
        <h1>
          Đi ít vòng hơn.
          <br />
          Trải nghiệm nhiều hơn.
        </h1>
        <p>
          Khám phá cách SmartTrip sắp xếp thời gian, địa điểm và ngân sách thành
          một hành trình dễ theo dõi.
        </p>
        <div className="actions">
          {[
            ["traveler", "Khám phá bản demo"],
            ["admin", "Xem dữ liệu quản trị"],
          ].map(([role, label]) => (
            <button
              className={role === "admin" ? "secondary" : undefined}
              key={role}
              onClick={() => {
                setRole(role);
                navigate(role === "admin" ? "/admin" : "/trips");
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="fine">
          Hồ sơ mô phỏng, không xác thực. Không nhập thông tin cá nhân thật. Kế
          hoạch lưu trên trình duyệt này.
        </p>
      </div>
      <div className="welcome-visual">
        <DestinationPhoto photo="beach" eager />
        <div className="welcome-postcard">
          <Icon name="pin" />
          <div>
            <strong>Đà Nẵng đang chờ bạn</strong>
            <span>Biển xanh và một hành trình riêng</span>
          </div>
        </div>
        <div className="welcome-small-photo">
          <DestinationPhoto photo="city" eager />
          <span>Khám phá thành phố bên sông Hàn</span>
        </div>
      </div>
    </section>
  );
}
