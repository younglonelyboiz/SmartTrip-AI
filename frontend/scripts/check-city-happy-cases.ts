import assert from "node:assert/strict";
import { cityHappyCases } from "../src/mocks/cityHappyCases";

for (const city of cityHappyCases) {
  const { snapshot, scenario, coordinates } = city;
  const plan = scenario.result.plan!;
  assert.equal(plan.isMock, true);
  assert.equal(plan.snapshotId, snapshot.snapshotId);
  assert.equal(plan.days.length, 3);
  let minutes = 0;
  const expectedCosts = [...snapshot.fixedCosts];
  const visited = new Set<string>();
  for (const day of plan.days) {
    let at = day.departureMinute;
    let previous = plan.request.depotId;
    for (const visit of day.visits) {
      assert(!visited.has(visit.placeId));
      visited.add(visit.placeId);
      const place = snapshot.places.find((item) => item.id === visit.placeId)!;
      const edge = snapshot.edges.find((item) => item.fromId === previous && item.toId === visit.placeId)!;
      assert(place && edge && coordinates[place.id]);
      assert(visit.startMinute >= at + edge.travelMinutes);
      assert.equal(visit.endMinute - visit.startMinute, place.durationMinutes);
      assert(place.windows[day.date].some((w) => visit.startMinute >= w.openMinute && visit.endMinute <= w.closeMinute));
      expectedCosts.push(edge.cost, place.visitCost);
      minutes += edge.travelMinutes;
      previous = place.id;
      at = visit.endMinute;
    }
    const back = snapshot.edges.find((item) => item.fromId === previous && item.toId === plan.request.depotId)!;
    assert(back);
    expectedCosts.push(back.cost);
    minutes += back.travelMinutes;
    assert.equal(day.returnMinute, at + back.travelMinutes);
    assert(day.returnMinute <= plan.request.dayEndMinute);
  }
  const total = (items: typeof expectedCosts) => items.reduce((n, c) => n + c.amountVnd * (c.basis === "per_person" ? plan.request.partySize : 1), 0);
  assert.equal(minutes, plan.travelMinutes);
  assert.equal(total(expectedCosts), plan.totalCostVnd);
  assert.equal(total(plan.costItems), plan.totalCostVnd);
  assert(plan.totalCostVnd <= plan.request.budgetVnd);
  assert(plan.request.mandatoryPlaceIds.every((id) => visited.has(id)));
  assert(plan.costItems.every((c) => c.provenance.kind === "simulated"));
  assert(snapshot.places.every((p) => p.provenance.kind === "simulated"));
  console.log(`PASS: ${plan.request.destination} — 3 days, windows, routes, costs, required places and provenance`);
}
