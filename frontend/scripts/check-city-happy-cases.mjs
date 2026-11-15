import assert from "node:assert/strict";
import { chromium } from "playwright";

const base = process.env.SMARTTRIP_URL || "http://127.0.0.1:5173";
const browser = await chromium.launch({ headless: true, ...(process.env.SMARTTRIP_CHROME ? { executablePath: process.env.SMARTTRIP_CHROME } : {}) });
try {
  const page = await browser.newPage();
  for (const [destination, tripId, dayRoutes] of [
    ["Đà Nẵng", "danang-demo", ["Biển Mỹ Khê → Chợ Hàn:", "Ngũ Hành Sơn → Bảo tàng Chăm:", "Bán đảo Sơn Trà → Cầu Tình Yêu:"]],
    ["Hà Nội", "hanoi-demo", ["Tượng đài Lý Thái Tổ → Nhà 48 phố Hàng Ngang:", "Bảo tàng Địa chất Việt Nam → Chợ Đêm Hàng Đào – Đồng Xuân:", "Di Tích Lịch Sử Chùa Láng → Đài quan sát Lotte Skywalk:"]],
    ["Huế", "hue-demo", ["Hoàng Thành Huế → Tượng đài Phan Bội Châu:", "Lăng Tự Đức → Lăng Dục Đức:", "Đàn Xã Tắc → Đúc đồng Dương Xuân:"]],
  ]) {
    await page.goto(base + "/");
    await page.getByRole("link", { name: `Xem lộ trình ${destination}` }).click();
    await page.getByRole("heading", { name: `${destination}, một hành trình vừa đủ.` }).waitFor();
    assert(page.url().includes(`/trips/${tripId}/versions/v1`));
    await page.getByText("Happy case minh họa", { exact: false }).waitFor();
    await page.getByRole("heading", { name: "Lịch trình trong ngày" }).waitFor();
    await page.getByRole("heading", { name: "Dự toán tại điểm đến" }).waitFor();
    await page.getByText(dayRoutes[0], { exact: false }).waitFor();
    await page.getByRole("button", { name: "Ngày 2" }).click();
    assert.equal(await page.getByRole("button", { name: "Ngày 2" }).getAttribute("aria-pressed"), "true");
    await page.getByText(dayRoutes[1], { exact: false }).waitFor();
    await page.getByRole("button", { name: "Ngày 3" }).click();
    await page.getByText(dayRoutes[2], { exact: false }).waitFor();
    await page.getByRole("button", { name: "Lưu phiên bản" }).click();
    await page.getByRole("status").filter({ hasText: "Đã lưu phiên bản" }).waitFor();
  }
  await page.goto(base + "/trips");
  await page.reload();
  for (const destination of ["Đà Nẵng", "Hà Nội", "Huế"]) {
    await page.getByRole("link", { name: new RegExp(`${destination} · v1`) }).waitFor();
  }
  await page.getByRole("link", { name: /Huế · v1/ }).click();
  await page.getByRole("heading", { name: "Huế, một hành trình vừa đủ." }).waitFor();
  console.log("PASS: three destination happy cases, daily views, budget, save and reload");
} finally {
  await browser.close();
}
