import raw from "../mocks/scenarios.json";
import type {
  DatasetSnapshot,
  Scenario,
  TravelRequest,
  MockResponse,
} from "../domain/types";
export const snapshot = raw.snapshot as DatasetSnapshot;
export const scenarios = raw.scenarios as Scenario[];
const canonical = (value: unknown): string => {
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  if (value && typeof value === "object")
    return (
      "{" +
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => JSON.stringify(k) + ":" + canonical(v))
        .join(",") +
      "}"
    );
  return JSON.stringify(value);
};
export const sameRequest = (a: TravelRequest, b: TravelRequest) =>
  canonical(a) === canonical(b);
export async function getScenario(
  request: TravelRequest,
  scenarioId: string,
): Promise<MockResponse> {
  const scenario = scenarios.find((s) => s.id === scenarioId);
  if (!scenario || !sameRequest(request, scenario.request))
    return {
      kind: "unsupported",
      message:
        "Bộ demo chưa có kết quả cho tổ hợp này. Chọn lại một kịch bản mẫu để xem lịch phù hợp.",
    };
  await new Promise((resolve) => setTimeout(resolve, 300));
  return { kind: "supported", scenario: structuredClone(scenario) };
}
export const getFixturePlan = (tripId: string, versionId: string) =>
  scenarios
    .map((s) => s.result.plan)
    .find((p) => p?.tripId === tripId && p.versionId === versionId) ?? null;
