import { useState } from "react";
import { Link } from "react-router-dom";
import { loadVersions, resetDemoStorage } from "../services/tripStorage";
import { currency, dateLabel } from "../domain/types";
import { DestinationPhoto } from "../components/DestinationPhoto";
import { PlaceGallery } from "../components/PlaceGallery";
import { Icon } from "../components/Icon";
export function Trips() {
  const [stored, setStored] = useState(loadVersions);
  const [notice, setNotice] = useState("");
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="muted">Không gian hành trình</p>
          <h1>Chuyến đi của bạn</h1>
          <p>
            Từ ý tưởng đến một lịch trình có thời gian và ngân sách rõ ràng.
          </p>
        </div>
        <Link className="button" to="/planner">
          Lập kế hoạch mới
        </Link>
      </div>
      <section className="trip-feature">
        <div>
          <span className="badge">Hành trình mẫu · 3 ngày 2 đêm</span>
          <h2>
            Đà Nẵng,
            <br />
            theo nhịp của bạn.
          </h2>
          <p>Biển Mỹ Khê, ẩm thực địa phương và những điểm dừng văn hóa.</p>
          <dl className="trip-facts">
            <div>
              <dt>
                <Icon name="calendar" />
                Thời gian
              </dt>
              <dd>10–12/12/2026</dd>
            </div>
            <div>
              <dt>
                <Icon name="people" />
                Đồng hành
              </dt>
              <dd>2 người</dd>
            </div>
            <div>
              <dt>
                <Icon name="wallet" />
                Ngân sách nhóm
              </dt>
              <dd>6.000.000 ₫</dd>
            </div>
          </dl>
          <Link className="button" to="/trips/danang-demo/versions/v1">
            Xem lịch trình mẫu
          </Link>
        </div>
        <div className="trip-feature-photo">
          <DestinationPhoto photo="beach" eager />
          <span className="photo-label">
            <Icon name="pin" /> Biển Mỹ Khê, Đà Nẵng
          </span>
        </div>
      </section>
      <PlaceGallery />
      <section className="panel saved-panel">
        <div className="section-title">
          <h2>Phiên bản đã lưu</h2>
          <button
            className="secondary"
            onClick={() => {
              try {
                resetDemoStorage();
                setStored(loadVersions());
                setNotice("Đã xóa riêng dữ liệu demo trên thiết bị.");
              } catch {
                setNotice("Trình duyệt chặn xóa dữ liệu.");
              }
            }}
          >
            Xóa dữ liệu demo
          </button>
        </div>
        <p role="status">{notice || stored.message}</p>
        {stored.versions.length ? (
          <ul className="saved-list">
            {stored.versions.map((p) => (
              <li key={p.versionId}>
                <Link to={`/trips/${p.tripId}/versions/${p.versionId}`}>
                  <strong>Đà Nẵng · {p.versionId}</strong>
                  <span>
                    {dateLabel(p.request.startDate)} ·{" "}
                    {currency(p.totalCostVnd)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">
            Chưa có phiên bản đã lưu. Mở lịch trình mẫu và chọn “Lưu phiên bản”.
          </p>
        )}
      </section>
    </>
  );
}
