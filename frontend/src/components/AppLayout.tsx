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
        <Link className="brand" to="/trips">
          <svg width="30" height="34" viewBox="0 0 30 34" aria-hidden="true">
            <path
              d="M15 2C-2 2-2 21 15 32 32 21 32 2 15 2Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="m8 18 5-8 3 11 5-8"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
          <span>
            SmartTrip <small>AI</small>
          </span>
        </Link>
        <nav aria-label="Điều hướng chính">
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
          SmartTrip AI{" "}
          <span>Du lịch tự túc Việt Nam · Prototype nghiên cứu</span>
        </div>
        <details className="photo-credits">
          <summary>Nguồn ảnh</summary>
          <p>
            Ảnh: Christophe95 / Wikimedia Commons.{" "}
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
                </a>
              </li>
            ))}
          </ul>
        </details>
      </footer>
    </>
  );
}
