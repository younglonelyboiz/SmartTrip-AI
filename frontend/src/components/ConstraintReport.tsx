import type { ConstraintCheck } from "../domain/types";
export function ConstraintReport({ checks }: { checks: ConstraintCheck[] }) {
  return (
    <section className="panel">
      <h2>Kiểm tra ràng buộc</h2>
      <ul className="checks">
        {checks.map((c) => (
          <li key={c.code} className={c.status}>
            <strong>
              {c.status === "pass"
                ? "Đạt"
                : c.status === "fail"
                  ? "Chưa đạt"
                  : "Chưa xác định"}
            </strong>
            <span>{c.message}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
