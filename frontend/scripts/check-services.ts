import assert from "node:assert/strict";
import { getScenario, scenarios } from "../src/services/mockTravelService.ts";
import {
  loadVersions,
  saveVersion,
  resetDemoStorage,
  STORAGE_KEY,
} from "../src/services/tripStorage.ts";
const storage = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (k: string) => storage.get(k) ?? null,
    setItem: (k: string, v: string) => storage.set(k, v),
    removeItem: (k: string) => storage.delete(k),
  },
  configurable: true,
});
for (const s of scenarios)
  assert.equal((await getScenario(s.request, s.id)).kind, "supported");
const req = structuredClone(scenarios[0].request);
req.budgetVnd = 5123456;
assert.equal((await getScenario(req, "standard")).kind, "unsupported");
assert.equal(
  (await getScenario(scenarios[0].request, "missing")).kind,
  "unsupported",
);
const v1 = scenarios[0].result.plan!,
  v2 = scenarios.find((s) => s.id === "replan")!.result.plan!;
assert(saveVersion(v1).ok);
assert(saveVersion(v2).ok);
assert.equal(loadVersions().versions.length, 2);
assert(saveVersion(v1).ok);
assert.equal(loadVersions().versions.length, 2);
storage.set(STORAGE_KEY, "{broken");
assert.equal(loadVersions().ok, false);
storage.set(STORAGE_KEY, JSON.stringify({ schemaVersion: 0, versions: [] }));
assert.equal(loadVersions().ok, false);
storage.set("other.app", "keep");
resetDemoStorage();
assert.equal(storage.get("other.app"), "keep");
Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: () => null,
    setItem: () => {
      throw Error("quota");
    },
    removeItem: () => {},
  },
  configurable: true,
});
assert.equal(saveVersion(v1).ok, false);
console.log(
  "PASS: request matching, unsupported, versions, corrupt/old storage, quota, scoped reset",
);
