import { snapshot } from "../services/mockTravelService";
import type { DayPlan } from "../domain/types";
export function RouteDiagram({ day }: { day: DayPlan }) {
  const names = [
    "Nơi lưu trú",
    ...day.visits.map(
      (v) => snapshot.places.find((p) => p.id === v.placeId)!.name,
    ),
    "Nơi lưu trú",
  ];
  return (
    <section className="panel route-panel">
      <h2>Tuyến trong ngày</h2>
      <svg
        viewBox={`0 0 360 ${names.length * 70}`}
        role="img"
        aria-label={"Tuyến mô phỏng: " + names.join(", ")}
      >
        <path
          d={`M35 30 V${(names.length - 1) * 70 + 30}`}
          stroke="var(--color-primary)"
          strokeWidth="3"
          strokeDasharray="5 5"
        />
        {names.map((n, i) => (
          <g key={i}>
            <circle
              cx="35"
              cy={i * 70 + 30}
              r="12"
              fill={
                i === 0 || i === names.length - 1
                  ? "var(--color-ink)"
                  : "var(--color-primary)"
              }
            />
            <text x="62" y={i * 70 + 35} fill="var(--color-ink)" fontSize="14">
              {n}
            </text>
          </g>
        ))}
      </svg>
      <p className="fine">
        Sơ đồ mô phỏng, không theo tỷ lệ và không dùng để dẫn đường.
      </p>
    </section>
  );
}
