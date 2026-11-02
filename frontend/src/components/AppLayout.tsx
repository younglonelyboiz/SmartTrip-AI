import { useEffect, useRef } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { photos, photoSource, type PhotoKey } from "../domain/photos";
export function AppLayout({ role }: { role: string }) {
  const { pathname } = useLocation();
  const main = useRef<HTMLElement>(null);
  useEffect(() => {
    main.current?.focus();
  }, [pathname]);
  return (
    <>
      <a className="skip" href="#main">
        Đến nội dung chính
      </a>
      <header>
        <Link className="brand" to="/">
          <img className="brand-mark" src="/logo.svg" alt="" width="42" height="48" />
          <span className="brand-wordmark">SmartTrip<span className="brand-ai">AI</span></span>
        </Link>
        <nav aria-label="Điều hướng chính">
          <NavLink to="/" end>Khám phá</NavLink>
          <NavLink to="/trips">Chuyến đi</NavLink>
          <NavLink to="/planner">Lập kế hoạch</NavLink>
          {role === "admin" ? <NavLink to="/admin">Dữ liệu</NavLink> : null}
        </nav>
        <Link className="profile" to="/demo-login">
          {role === "admin" ? "Quản trị viên" : "Khách du lịch"} · Demo
        </Link>
      </header>
      <div className="mock-banner">
        Dữ liệu mô phỏng · Không phải giá thực tế hoặc kết quả chạy thuật toán
      </div>
      <main id="main" ref={main} tabIndex={-1}>
        <Outlet />
      </main>
      <footer>
        <div className="footer-brand">
          SmartTripAI{" "}
          <span>Du lịch tự túc Việt Nam · Prototype nghiên cứu</span>
        </div>
        <details className="photo-credits">
          <summary>Nguồn ảnh</summary>
          <p>
            Ảnh Đà Nẵng: Christophe95 / Wikimedia Commons.{" "}
            <a
              href="https://creativecommons.org/licenses/by-sa/4.0/"
              target="_blank"
              rel="noreferrer"
            >
              CC BY-SA 4.0
            </a>
            . Ảnh được thu nhỏ và cắt khung khi hiển thị; các bản hiển thị ảnh
            giữ cùng giấy phép.
          </p>
          <ul>
            {(Object.keys(photos) as PhotoKey[]).map((key) => (
              <li key={key}>
                <a href={photoSource(key)} target="_blank" rel="noreferrer">
                  {photos[key].title}
                </a>{" — "}
                {key === "hanoi" ? "NKSTTSSHNVN · CC BY-SA 4.0" : key === "hue" ? "NguyenThanhBac123 · CC0" : "Christophe95 · CC BY-SA 4.0"}
              </li>
            ))}
          </ul>
        </details>
      </footer>
    </>
  );
}
