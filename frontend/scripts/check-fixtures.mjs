import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
const { snapshot, scenarios } = JSON.parse(
  readFileSync(new URL("../src/mocks/scenarios.json", import.meta.url), "utf8"),
);
const edge = (a, b) => {
  const e = snapshot.edges.find((e) => e.fromId === a && e.toId === b);
  assert(e, `missing edge ${a}/${b}`);
  return e;
};
const amount = (c, p) => c.amountVnd * (c.basis === "per_person" ? p : 1);
export function validate(plan) {
  const req = plan.request;
  assert.equal(plan.snapshotId, snapshot.snapshotId);
  assert.equal(
    plan.days.length,
    (Date.parse(req.endDate) - Date.parse(req.startDate)) / 86400000 + 1,
  );
  const seen = new Set();
  let travel = 0;
  const costs = [...snapshot.fixedCosts];
  for (const [dayIndex, d] of plan.days.entries()) {
    assert.equal(
      d.date,
      new Date(Date.parse(req.startDate) + dayIndex * 86400000)
        .toISOString()
        .slice(0, 10),
    );
    assert(d.departureMinute >= req.dayStartMinute);
    let now = d.departureMinute,
      prev = req.depotId;
    for (const v of d.visits) {
      assert(!seen.has(v.placeId), "duplicate place");
      seen.add(v.placeId);
      assert(!req.excludedPlaceIds.includes(v.placeId));
      const p = snapshot.places.find((p) => p.id === v.placeId);
      assert(p);
      const e = edge(prev, p.id);
      now += e.travelMinutes;
      travel += e.travelMinutes;
      costs.push(e.cost, p.visitCost);
      assert(v.startMinute >= now, "travel not accounted");
      assert.equal(v.endMinute - v.startMinute, p.durationMinutes);
      assert(
        p.windows[d.date]?.some(
          (w) => v.startMinute >= w.openMinute && v.endMinute <= w.closeMinute,
        ),
        "outside window",
      );
      now = v.endMinute;
      prev = p.id;
    }
    if (d.visits.length) {
      const e = edge(prev, req.depotId);
      now += e.travelMinutes;
      travel += e.travelMinutes;
      costs.push(e.cost);
    }
    assert.equal(d.returnMinute, now, "return travel must be included");
    assert(d.returnMinute <= req.dayEndMinute);
  }
  req.mandatoryPlaceIds.forEach((id) => assert(seen.has(id)));
  req.lockedVisits.forEach((l) =>
    assert(
      plan.days
        .find((d) => d.date === l.date)
        ?.visits.some(
          (v) => v.placeId === l.placeId && v.startMinute === l.startMinute,
        ),
      "locked visit changed",
    ),
  );
  const total = costs.reduce((n, c) => n + amount(c, req.partySize), 0);
  assert.equal(
    plan.costItems.reduce((n, c) => n + amount(c, req.partySize), 0),
    total,
  );
  assert.equal(plan.totalCostVnd, total, "wrong total");
  assert.equal(plan.travelMinutes, travel);
  assert(total <= req.budgetVnd);
  assert(plan.isMock);
}
for (const s of scenarios) {
  assert.deepEqual(s.request, s.result.request);
  assert.equal(s.result.snapshotId, snapshot.snapshotId);
  const solution = ["FEASIBLE", "OPTIMAL", "TIMEOUT_WITH_SOLUTION"].includes(
    s.result.status,
  );
  assert.equal(Boolean(s.result.plan), solution);
  if (s.result.plan) {
    assert.deepEqual(s.request, s.result.plan.request);
    validate(s.result.plan);
  }
  if (s.baseline) {
    validate(s.baseline);
    assert.deepEqual(s.baseline.request, s.result.plan.request);
    assert.equal(s.baseline.snapshotId, s.result.plan.snapshotId);
  }
}
// Negative controls prove the checker catches bad sums and omitted return travel.
const badTotal = structuredClone(scenarios[0].result.plan);
badTotal.totalCostVnd++;
assert.throws(() => validate(badTotal), /wrong total/);
const badReturn = structuredClone(scenarios[0].result.plan);
badReturn.days[0].returnMinute--;
assert.throws(() => validate(badReturn), /return travel/);
const v1 = scenarios[0].result.plan,
  v2 = scenarios.find((s) => s.id === "replan").result.plan;
assert.equal(v2.parentVersionId, v1.versionId);
assert.deepEqual(v2.days[0], v1.days[0]);
console.log(
  `PASS: ${scenarios.length} scenarios, baseline, cost/time/window/return/locked checks; 2 negative controls detected`,
);
