import type { MockResponse, TravelRequest } from "../domain/types";

export interface BackendRecommendation {
  placeId: string;
  matchedInterests: string[];
}

async function post<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`/api/prototype/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!response.ok) throw new Error(`Backend HTTP ${response.status}`);
  return response.json() as Promise<T>;
}

export function fetchRecommendations(interests: string[], signal: AbortSignal) {
  return post<{ recommendations: BackendRecommendation[] }>("recommendations", { interests }, signal);
}

export function fetchScenario(request: TravelRequest, scenarioId: string) {
  return post<MockResponse>("scenarios", { request, scenarioId });
}

export interface CatalogPlace {
  osmId: string;
  name: string;
  lat: number;
  lon: number;
  tags: string[];
  matchedInterests: string[];
  verificationStatus: "unverified";
  openingHours: null;
  price: null;
}

export function fetchCatalogRecommendations(destination: string, interests: string[], signal: AbortSignal) {
  return post<{ destination: string; places: CatalogPlace[] }>("catalog/recommendations", { destination, interests }, signal);
}

export interface CatalogDraft {
  destination: string;
  status: "DRAFT_UNVALIDATED";
  days: { date: string; places: Pick<CatalogPlace, "osmId" | "name" | "lat" | "lon" | "tags">[] }[];
}

export function createCatalogDraft(destination: string, startDate: string, endDate: string, placeIds: string[]) {
  return post<CatalogDraft>("catalog/draft", { destination, startDate, endDate, placeIds });
}

export interface RouteLeg {
  fromId: string;
  toId: string;
  coordinates: number[][]; // GeoJSON longitude, latitude
  distanceMeters: number;
  durationMs: number;
}

export function fetchRoute(placeIds: string[], signal: AbortSignal) {
  return post<{ profile: "car"; source: string; legs: RouteLeg[] }>("route", { placeIds }, signal);
}

export interface TimeWindow { start: string; end: string }
export interface CatalogPlanRequest {
  destination: string;
  dayCount: number;
  budgetVnd: number | null;
  mandatoryPlaceIds: string[];
  schedule: TimeWindow & { lunch: TimeWindow | null };
}
export interface CatalogVisit {
  osmId: string; name: string; lat: number; lon: number;
  arrival: number; departure: number; durationMinutes: number;
  mandatory: boolean; recommendationReason: string; admissionVnd: number;
}
export interface CatalogTotals {
  admissionVnd: number; transportVnd: number; totalVnd: number;
  distanceMeters: number; travelMinutes: number; visitMinutes: number;
}
export interface CatalogPlanDay {
  dayNumber: number; visits: CatalogVisit[];
  legs: (RouteLeg & { departure: number; arrival: number; transportVnd: number })[];
  breaks: TimeWindow[]; totals: CatalogTotals;
}
export interface CatalogPlanResponse {
  status: "PLANNED_ESTIMATE" | "INFEASIBLE" | "SEARCH_LIMIT" | "ROUTING_UNAVAILABLE" | "DATA_ERROR";
  request: CatalogPlanRequest; reason: string;
  assumptions: { version?: string; notice?: string; budgetScope?: string; routingNotice?: string; transportVndPerKm?: number; search?: string };
  source: { name?: string; attribution?: string; licenseUrl?: string; snapshotTimestamp?: string };
  days: CatalogPlanDay[]; totals: CatalogTotals | null;
  coverage: { plannedDays: number; requestedDays: number };
}
export async function createCatalogPlan(request: CatalogPlanRequest, signal: AbortSignal): Promise<CatalogPlanResponse> {
  const response = await fetch("/api/prototype/catalog/plan", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request), signal,
  });
  const body = await response.json();
  if (response.status === 503 && body.status === "ROUTING_UNAVAILABLE") return body;
  if (!response.ok) {
    const detail = body.detail;
    throw new Error(typeof detail === "string" ? detail : Array.isArray(detail)
      ? detail.map((item: { msg?: string }) => item.msg || "Dữ liệu không hợp lệ").join(" · ")
      : `Backend HTTP ${response.status}`);
  }
  return body;
}
