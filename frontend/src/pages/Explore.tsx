import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DestinationPhoto } from "../components/DestinationPhoto";
import { scenarios } from "../services/mockTravelService";

import { destinations } from "../domain/destinations";

const guides = [
  { title: "Bắt đầu từ một chuyến đi vừa sức", text: "Chọn số ngày và những nơi bạn thực sự muốn ghé trước khi thêm các điểm khác. Dành khoảng nghỉ giữa các hoạt động để lịch trình không quá dày.", tip: "Trong Planner, đánh dấu những điểm bắt buộc và bỏ qua các điểm chưa phù hợp." },
  { title: "Tính ngân sách cho cả nhóm", text: "Thống nhất số người và ngân sách chung. Tách chi phí theo người khỏi các khoản dùng chung để tránh cộng thiếu hoặc tính trùng.", tip: "Dự toán demo đã có lưu trú và ăn uống giả lập; hãy bổ sung dự trù đi–về liên tỉnh và chặng nối." },
  { title: "Kiểm tra trước khi lên đường", text: "Kiểm tra lại giờ hoạt động, điều kiện thời tiết và giá tại nguồn chính thức. Dành thêm thời gian cho việc di chuyển và những thay đổi ngoài dự kiến.", tip: "Giá và tuyến trong prototype là mô phỏng, không dùng làm báo giá hoặc chỉ đường thực tế." },
];
export function Explore() {
  const slides = [
    { photo: "hanoi" as const, title: "Hà Nội", subtitle: "Phố cũ, nhịp sống mới" },
    { photo: "hue" as const, title: "Huế", subtitle: "Chậm lại bên dòng Hương" },
    { photo: "beach" as const, title: "Đà Nẵng" , subtitle: "Chạm vào miền biển xanh" },
    { photo: "haGiang" as const, title: "Mã Pí Lèng · Hà Giang", subtitle: "Dòng Nho Quế giữa miền đá nở hoa" },
  ];
  const [activeSlide, setActiveSlide] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setActiveSlide((current) => (current + 1) % slides.length), 5200);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  return <div className="explore">
    <section className="explore-hero" aria-roledescription="carousel" aria-label="Điểm đến nổi bật">
      <div className="explore-hero-slides" aria-live="off">
        {slides.map((slide, index) => <div className={`explore-hero-slide${index === activeSlide ? " is-active" : ""}`} key={slide.photo} aria-hidden={index !== activeSlide}>
          <DestinationPhoto photo={slide.photo} eager={index === 0} />
          <div className="hero-photo-caption"><span>{slide.title}</span><small>{slide.subtitle}</small></div>
        </div>)}
      </div>
      <div className="explore-hero-copy"><p>Khám phá Việt Nam</p><h1>Một chuyến đi<br />theo cách của bạn.</h1><p>Bắt đầu từ nơi muốn đến. Sắp xếp hành trình theo thời gian, ngân sách và những điều bạn yêu thích.</p><div className="actions"><Link className="button" to="/planner">Lập kế hoạch chuyến đi</Link><a className="button secondary" href="#diem-den">Khám phá điểm đến</a></div></div>
      <div className="hero-carousel-controls" aria-label="Chọn ảnh điểm đến">
        <button className="hero-carousel-arrow" type="button" aria-label="Ảnh trước" onClick={() => setActiveSlide((activeSlide - 1 + slides.length) % slides.length)}>←</button>
        <button className="hero-carousel-arrow" type="button" aria-label="Ảnh tiếp theo" onClick={() => setActiveSlide((activeSlide + 1) % slides.length)}>→</button>
      </div>
    </section>
    <section id="diem-den" className="explore-section" aria-labelledby="destinations-heading">
      <div className="explore-section-heading"><div><h2 id="destinations-heading">Bạn muốn ghé nơi nào?</h2><p>Chọn tỉnh, thành yêu thích để xem ngay lộ trình mẫu.</p></div><span className="explore-label">Điểm đến trong bộ demo</span></div>
      <div className="destination-grid">{destinations.map(d => <article className="explore-destination-card" key={d.id}><DestinationPhoto photo={d.photo} /><div><span className="explore-label">{d.region} · {d.duration}</span><h3>{d.name}</h3><p>{d.description}</p><Link to={d.href}>Xem lộ trình {d.name}</Link></div></article>)}</div>
    </section>
    <section id="lich-trinh-mau" className="explore-section" aria-labelledby="templates-heading">
      <div className="explore-section-heading"><div><h2 id="templates-heading">Một vài cách bắt đầu</h2><p>Chọn lịch trình mẫu rồi xem các yêu cầu đã được chuẩn bị sẵn.</p></div></div>
      <div className="template-grid">{scenarios.filter(s => s.result.plan).slice(0,3).map((s, index) => <Link className="template-card" to={`/planner?scenario=${encodeURIComponent(s.id)}`} key={s.id}><DestinationPhoto photo={index === 0 ? "beach" : "marble"} /><span className="explore-label">Đà Nẵng · Mẫu mô phỏng</span><h3>{s.title}</h3><p>{s.request.partySize} người · Ngân sách nhóm {new Intl.NumberFormat("vi-VN").format(s.request.budgetVnd)} đ</p><strong>Xem yêu cầu chuyến đi</strong></Link>)}</div>
    </section>
    <section id="cam-nang" className="explore-section" aria-labelledby="guides-heading"><div className="explore-section-heading"><div><h2 id="guides-heading">Chuẩn bị để đi thảnh thơi hơn</h2><p>Một vài điều hữu ích trước khi bạn hoàn thiện lịch trình.</p></div></div><div className="guide-list">{guides.map(g => <details className="guide-item" key={g.title}><summary>{g.title}</summary><p>{g.text}</p><p>{g.tip}</p></details>)}</div></section>
  </div>;
}
