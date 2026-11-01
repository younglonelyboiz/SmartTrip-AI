export type SolverStatus =
  | "FEASIBLE"
  | "OPTIMAL"
  | "INFEASIBLE"
  | "TIMEOUT_WITH_SOLUTION"
  | "TIMEOUT_NO_SOLUTION"
  | "INVALID_INPUT"
  | "DATA_ERROR";
export interface TravelRequest {
  destination: string;
  startDate: string;
  endDate: string;
  partySize: number;
  budgetVnd: number;
  dayStartMinute: number;
  dayEndMinute: number;
  depotId: string;
  interests: string[];
  mandatoryPlaceIds: string[];
  excludedPlaceIds: string[];
  lockedVisits: { placeId: string; date: string; startMinute: number }[];
}
export interface Provenance {
  sourceId: string;
  kind: "observed" | "estimated" | "simulated";
  recordedAt: string;
  serviceDate: string;
  currency: "VND";
  conditions: string;
}
export interface CostItem {
  id: string;
  label: string;
  amountVnd: number;
  basis: "per_person" | "per_group";
  provenance: Provenance;
}
export interface FactProvenance {
  sourceId: string;
  kind: "observed" | "estimated" | "simulated";
  recordedAt: string;
  validFrom: string;
  validTo: string;
  method: string;
}
export interface Place {
  provenance: FactProvenance;
  id: string;
  name: string;
  category: string;
  durationMinutes: number;
  relevanceScore: number;
  windows: Record<
    string,
    { openMinute: number; closeMinute: number; provenance: FactProvenance }[]
  >;
  visitCost: CostItem;
  sourceId: string;
}
export interface TravelEdge {
  provenance: FactProvenance;
  fromId: string;
  toId: string;
  travelMinutes: number;
  distanceKm: number;
  cost: CostItem;
}
export interface DatasetSnapshot {
  snapshotId: string;
  recordedAt: string;
  configVersion: string;
  places: Place[];
  edges: TravelEdge[];
  fixedCosts: CostItem[];
  sources: {
    id: string;
    name: string;
    status: "simulated" | "verified" | "unverified";
    notes: string;
  }[];
}
export interface DayPlan {
  date: string;
  departureMinute: number;
  returnMinute: number;
  visits: { placeId: string; startMinute: number; endMinute: number }[];
}
export interface PlanVersion {
  configVersion: string;
  objectiveVersion: string;
  tripId: string;
  versionId: string;
  parentVersionId: string | null;
  snapshotId: string;
  request: TravelRequest;
  days: DayPlan[];
  costItems: CostItem[];
  totalCostVnd: number;
  travelMinutes: number;
  status: SolverStatus;
  isMock: boolean;
}
export interface ConstraintCheck {
  evidence: Record<string, string | number | boolean | null>;
  code: string;
  status: "pass" | "fail" | "unknown";
  message: string;
}
export interface OptimizationResult {
  configVersion: string;
  objectiveVersion: string;
  skippedPlaces: { placeId: string; reason: string }[];
  runId: string;
  snapshotId: string;
  request: TravelRequest;
  status: SolverStatus;
  reason: string;
  checks: ConstraintCheck[];
  plan: PlanVersion | null;
  isMock: boolean;
}
export interface Scenario {
  id: string;
  title: string;
  description: string;
  request: TravelRequest;
  result: OptimizationResult;
  baseline?: PlanVersion;
}
export type MockResponse =
  | { kind: "supported"; scenario: Scenario }
  | { kind: "unsupported"; message: string };
export const currency = (n: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(n);
export const clock = (n: number) =>
  `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
export const dateLabel = (date: string) =>
  new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(date + "T12:00:00+07:00"));
