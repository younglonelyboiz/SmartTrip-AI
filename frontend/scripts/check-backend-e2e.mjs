import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const base = process.env.SMARTTRIP_URL || "http://127.0.0.1:5173";
const browser = await chromium.launch({ headless: true, ...(process.env.SMARTTRIP_CHROME ? { executablePath: process.env.SMARTTRIP_CHROME } : {}) });
const minute = value => Number(value.slice(0, 2)) * 60 + Number(value.slice(3));
function verify(plan, mandatory = []) {
  assert.equal(plan.status, "PLANNED_ESTIMATE", plan.reason);
  assert.equal(plan.days.length, plan.request.dayCount);
  const ids = plan.days.flatMap(day => day.visits.map(v => v.osmId));
  assert(ids.length > 0);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of mandatory) assert(ids.includes(id), `missing mandatory ${id}`);
  const total = plan.days.reduce((sum, day) => {
    assert.equal(day.legs.length, Math.max(0, day.visits.length - 1));
    for (const [i, leg] of day.legs.entries()) {
      assert.equal(leg.fromId, day.visits[i].osmId);
      assert.equal(leg.toId, day.visits[i + 1].osmId);
      assert(leg.coordinates.length >= 2);
      assert.equal(leg.transportVnd, Math.ceil(leg.distanceMeters * 12));
      assert.equal(leg.arrival - leg.departure, Math.ceil(leg.durationMs / 60000));
      assert(leg.departure >= day.visits[i].departure);
      assert(leg.arrival <= day.visits[i + 1].arrival);
    }
    for (const event of [...day.visits, ...day.legs]) {
      const start = "osmId" in event ? event.arrival : event.departure;
      const end = "osmId" in event ? event.departure : event.arrival;
      assert(start >= minute(plan.request.schedule.start));
      assert(end <= minute(plan.request.schedule.end));
      const lunch = plan.request.schedule.lunch;
      if (lunch) assert(!(start < minute(lunch.end) && end > minute(lunch.start)));
    }
    const value = day.visits.reduce((s, v) => s + v.admissionVnd, 0) + day.legs.reduce((s, l) => s + l.transportVnd, 0);
    assert.equal(day.totals.totalVnd, value);
    return sum + value;
  }, 0);
  assert.equal(plan.totals.totalVnd, total);
  if (plan.request.budgetVnd !== null) assert(total <= plan.request.budgetVnd);
}

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(base + "/planner");
  await page.getByRole("button", { name: "Gợi ý lịch trình", exact: true }).waitFor();
  let example;
  for (const city of ["Đà Nẵng", "Hà Nội", "Huế"]) {
    await page.getByLabel("Điểm đến", { exact: true }).selectOption(city);
    await page.getByRole("button", { name: "Gợi ý lịch trình", exact: true }).waitFor({ state: "visible" });
    const responseWait = page.waitForResponse(r => r.url().endsWith("/catalog/plan") && r.request().method() === "POST");
    await page.getByRole("button", { name: "Gợi ý lịch trình", exact: true }).click();
    const response = await responseWait;
    assert.equal(response.status(), 200);
    const plan = await response.json(); verify(plan);
    assert.equal(plan.coverage.plannedDays, 3, "3-day trips should use all 3 days when the catalog has enough suitable places");
    await page.getByRole("heading", { name: `Lịch trình ${city} · 3 ngày`, exact: true }).waitFor();
    for (let n = 1; n <= 3; n++) {
      await page.getByRole("button", { name: `Ngày ${n}`, exact: true }).click();
      const day = plan.days[n - 1];
      await page.getByRole("region", { name: `Chi tiết ngày ${n}`, exact: true }).getByRole("heading", { name: day.visits[0].name, exact: true }).waitFor();
      assert.equal(await page.locator(".catalog-result .leaflet-overlay-pane path").count(), day.legs.length);
    }
    const ids = plan.days.flatMap(d => d.visits).slice(0, 2).map(v => v.osmId);
    // A second real request with mandatory stops, a changed duration and an explicit budget.
    const withMandatory = await page.request.post(base + "/api/prototype/catalog/plan", { data: { destination: city, dayCount: 2, budgetVnd: 3000000, mandatoryPlaceIds: ids } });
    assert.equal(withMandatory.status(), 200);
    verify(await withMandatory.json(), ids);
    if (city === "Huế") {
      example = plan;
      await mkdir("test-results", { recursive: true });
      await page.getByRole("button", { name: "Ngày 1", exact: true }).click();
      await page.screenshot({ path: "test-results/catalog-live-desktop.png", fullPage: true });
    }
    console.log(`PASS live: ${city}, auto recommendations + mandatory stops, GraphHopper geometry, timeline and totals`);
  }

  await page.getByText("Chỉnh giờ mỗi ngày (tùy chọn)", { exact: true }).click();
  await page.getByLabel("Nghỉ trưa", { exact: true }).uncheck();
  await page.getByLabel("Giờ bắt đầu", { exact: true }).fill("09:00");
  await page.getByLabel("Giờ kết thúc", { exact: true }).fill("20:00");
  await page.getByLabel("Ngân sách cho một người (VND, tùy chọn)", { exact: true }).fill("0");
  const zeroWait = page.waitForResponse(r => r.url().endsWith("/catalog/plan"));
  await page.getByRole("button", { name: "Gợi ý lịch trình", exact: true }).click();
  const zero = await (await zeroWait).json(); verify(zero);
  assert.equal(zero.request.budgetVnd, 0);
  assert.equal(zero.request.schedule.lunch, null);
  assert.equal(zero.request.schedule.start, "09:00");
  assert.equal(zero.totals.totalVnd, 0);

  await page.goto(base + "/planner");
  await page.getByLabel("Điểm đến", { exact: true }).selectOption("Huế");
  await page.getByRole("checkbox", { name: /Lăng Tự Đức/ }).check();
  await page.getByLabel("Ngân sách cho một người (VND, tùy chọn)", { exact: true }).fill("1");
  await page.getByRole("button", { name: "Gợi ý lịch trình", exact: true }).click();
  await page.getByRole("alert").filter({ hasText: "vượt ngân sách" }).waitFor();
  assert.equal(await page.locator(".catalog-result").count(), 0);
  await page.getByLabel("Điểm đến", { exact: true }).selectOption("Đà Nẵng");
  assert.equal(await page.getByRole("checkbox", { checked: true }).count(), 0);

  // Controlled responses exercise retry and stale-request behavior, separately from live routing above.
  let status = "ROUTING_UNAVAILABLE";
  await page.route("**/api/prototype/catalog/plan", route => route.fulfill({
    status: status === "ROUTING_UNAVAILABLE" ? 503 : 200, contentType: "application/json",
    body: JSON.stringify({ ...example, status, reason: `test-${status}`, days: [], totals: null }),
  }));
  for (status of ["ROUTING_UNAVAILABLE", "SEARCH_LIMIT", "DATA_ERROR"]) {
    await page.getByRole("button", { name: "Gợi ý lịch trình", exact: true }).click();
    await page.getByRole("alert").filter({ hasText: `test-${status}` }).waitFor();
    assert.equal(await page.locator(".catalog-result").count(), 0);
  }
  await page.unroute("**/api/prototype/catalog/plan");
  let release;
  const held = new Promise(resolve => { release = resolve; });
  let started;
  const startedPromise = new Promise(resolve => { started = resolve; });
  await page.route("**/api/prototype/catalog/plan", async route => { started(); await held; await route.fulfill({ json: example }).catch(() => {}); });
  await page.getByRole("button", { name: "Gợi ý lịch trình", exact: true }).click();
  await startedPromise;
  await page.getByLabel("Số ngày", { exact: true }).fill("2");
  await page.getByLabel("Số ngày", { exact: true }).fill("3");
  release();
  await page.unroute("**/api/prototype/catalog/plan", { behavior: "wait" });
  assert.equal(await page.locator(".catalog-result").count(), 0, "stale A→B→A response must not appear");
  assert.equal(await page.getByRole("alert").innerText(), "");

  // One-stop and uncovered-day rendering must not invent connecting roads.
  const single = structuredClone(zero);
  single.days = [{ ...single.days[0], visits: single.days.flatMap(d => d.visits).slice(0, 1), legs: [] }, { ...single.days[0], dayNumber: 2, visits: [], legs: [] }];
  single.request.dayCount = 2;
  single.reason = "Chỉ có điểm ghé cho 1/2 ngày";
  single.coverage = { plannedDays: 1, requestedDays: 2 };
  await page.route("**/api/prototype/catalog/plan", route => route.fulfill({ json: single }));
  await page.route("https://tile.openstreetmap.org/**", route => route.abort());
  await page.getByRole("button", { name: "Gợi ý lịch trình", exact: true }).click();
  await page.getByRole("heading", { name: /Lịch trình Huế/ }).waitFor();
  assert.equal(await page.locator(".catalog-result .leaflet-marker-icon").count(), 1);
  assert.equal(await page.locator(".catalog-result .leaflet-overlay-pane path").count(), 0);
  await page.getByRole("status").filter({ hasText: "Không tải được nền bản đồ" }).waitFor();
  for (const width of [375, 390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `overflow ${width}`);
  }
  await page.getByRole("button", { name: "Ngày 2", exact: true }).click();
  await page.getByText("Chưa xếp được điểm cho ngày này", { exact: false }).waitFor();
  assert.equal(await page.locator(".catalog-result .leaflet-container").count(), 0);
  await mkdir("test-results", { recursive: true });
  await page.screenshot({ path: "test-results/catalog-planner.png", fullPage: true });
  await page.unroute("**/api/prototype/catalog/plan");

  // Preserve the fixture demo and its existing routing integration.
  await page.goto(base + "/planner?scenario=standard");
  await page.getByRole("button", { name: "Xem kết quả mock" }).click();
  await page.getByRole("heading", { name: "Đà Nẵng, một hành trình vừa đủ." }).waitFor();
  await page.getByText("Biển Mỹ Khê → Chợ Hàn:", { exact: false }).waitFor();
  await page.getByRole("button", { name: "Ngày 2" }).click();
  await page.getByText("Ngũ Hành Sơn → Bảo tàng Chăm:", { exact: false }).waitFor();
  assert.deepEqual(errors, []);
  console.log("PASS browser: optional hours, zero budget, mandatory conflict, retry/error statuses, stale response, single/empty day, tile failure, responsive, fixture regression; no page errors");
} finally { await browser.close(); }
