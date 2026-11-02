import { currency, type PlanVersion } from "../domain/types";
import { SourceBadge } from "./SourceBadge";
export function BudgetSummary({ plan }: { plan: PlanVersion }) {
  return (
    <section className="panel budget">
      <h2>
        Dự toán tại điểm đến <SourceBadge />
      </h2>
      <p className="big-value">{currency(plan.totalCostVnd)}</p>
      <p className="muted">
        Cả nhóm {plan.request.partySize} người ·{" "}
        {currency(plan.totalCostVnd / plan.request.partySize)}/người
      </p>
      <meter
        min={0}
        max={plan.request.budgetVnd}
        value={plan.totalCostVnd}
        aria-label="Mức sử dụng ngân sách"
      />
      <p>Ngân sách nhóm: {currency(plan.request.budgetVnd)}</p>
      <details>
        <summary>Xem từng khoản chi</summary>
        <ul className="costs">
          {plan.costItems.map((c, i) => (
            <li key={c.id + "-" + i}>
              <span>
                {c.label}
                <small>
                  {c.basis === "per_person"
                    ? `${currency(c.amountVnd)} × ${plan.request.partySize} người`
                    : "Theo nhóm"}
                </small>
              </span>
              <strong>
                {currency(
                  c.amountVnd *
                    (c.basis === "per_person" ? plan.request.partySize : 1),
                )}
              </strong>
            </li>
          ))}
        </ul>
      </details>
      <p className="fine">
        Giá giả lập gồm lưu trú, ăn uống dự trù, tham quan và di chuyển. Không
        dùng để đặt dịch vụ. Chưa gồm đi–về liên tỉnh và chặng nối sân bay/ga/bến xe.
      </p>
    </section>
  );
}
