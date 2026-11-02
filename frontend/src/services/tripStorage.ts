import type { PlanVersion } from "../domain/types";
import { scenarios } from "./mockTravelService";
export const STORAGE_KEY = "smarttrip.demo.v1";
export interface StorageResult {
  ok: boolean;
  versions: PlanVersion[];
  message?: string;
}
// Only known, immutable demo plans may enter storage. Never trust localStorage as API data.
const allowed = scenarios.flatMap((s) =>
  s.result.plan ? [s.result.plan] : [],
);
function validVersion(value: unknown): value is PlanVersion {
  return allowed.some((p) => JSON.stringify(p) === JSON.stringify(value));
}
export function loadVersions(): StorageResult {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ok: true, versions: [] };
    const data = JSON.parse(raw);
    if (
      data.schemaVersion !== 1 ||
      !Array.isArray(data.versions) ||
      !data.versions.every(validVersion)
    )
      throw Error("schema");
    return { ok: true, versions: data.versions };
  } catch {
    return {
      ok: false,
      versions: [],
      message:
        "Không đọc được dữ liệu demo trên thiết bị. Hãy xóa dữ liệu demo để bắt đầu lại.",
    };
  }
}
export function saveVersion(version: PlanVersion): StorageResult {
  const loaded = loadVersions();
  if (!loaded.ok) return loaded;
  if (!validVersion(version))
    return {
      ok: false,
      versions: loaded.versions,
      message: "Phiên bản không thuộc bộ dữ liệu demo.",
    };
  const versions = [
    ...loaded.versions.filter(
      (v) => v.versionId !== version.versionId || v.tripId !== version.tripId,
    ),
    version,
  ];
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ schemaVersion: 1, versions }),
    );
    return {
      ok: true,
      versions,
      message: "Đã lưu phiên bản " + version.versionId + " trên thiết bị.",
    };
  } catch {
    return {
      ok: false,
      versions: loaded.versions,
      message:
        "Không lưu được trên thiết bị. Có thể bộ nhớ đã đầy hoặc trình duyệt chặn lưu trữ.",
    };
  }
}
export function resetDemoStorage(): void {
  localStorage.removeItem(STORAGE_KEY);
  for (const plan of allowed) {
    localStorage.removeItem('smarttrip.journey.' + encodeURIComponent(plan.tripId) + '.' + encodeURIComponent(plan.versionId));
  }
}
