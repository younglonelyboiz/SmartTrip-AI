import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const base = process.env.SMARTTRIP_URL || "http://127.0.0.1:5173";
const browser = await chromium.launch({
  headless: true,
  ...(process.env.SMARTTRIP_CHROME
    ? { executablePath: process.env.SMARTTRIP_CHROME }
    : {}),
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }),
  errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await mkdir("test-results", { recursive: true });
try {
  await page.goto(base + "/demo-login");
  await page.getByRole("button", { name: "Khám phá bản demo" }).click();
  await page.getByRole("link", { name: "Lập kế hoạch mới" }).click();
  await page.getByRole("button", { name: "Xem kết quả mock" }).click();
  await page
    .getByRole("heading", { name: "Đà Nẵng, một hành trình vừa đủ." })
    .waitFor();
  await page.getByRole("button", { name: "Ngày 2" }).click();
  await page
    .getByRole("heading", { name: "Ngũ Hành Sơn", exact: true })
    .waitFor();
  await page.getByRole("button", { name: "Ngày 1" }).click();
  await page.getByRole("button", { name: "Lưu phiên bản" }).click();
  await page
    .getByRole("status")
    .filter({ hasText: "Đã lưu phiên bản v1" })
    .waitFor();
  await page.screenshot({
    path: "test-results/itinerary-desktop.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "So sánh hai lịch mẫu" }).click();
  await page
    .getByRole("heading", { name: "Hai cách sắp xếp, cùng một chuyến đi." })
    .waitFor();
  assert((await page.locator("body").innerText()).includes("110 phút"));
  await page.getByRole("link", { name: "Về lịch trình", exact: true }).click();
  await page
    .getByRole("link", { name: "Xem mẫu điều chỉnh: bỏ Sơn Trà" })
    .click();
  await page.getByRole("button", { name: "Lưu phiên bản" }).click();
  await page.getByRole("link", { name: "Về chuyến đi", exact: true }).click();
  await page.reload();
  await page.getByRole("link", { name: "Đà Nẵng · v1" }).waitFor();
  await page.getByRole("link", { name: "Đà Nẵng · v2" }).waitFor();
  await page.getByRole("link", { name: "Lập kế hoạch", exact: true }).click();
  for (const [id, text] of [
    ["budget-conflict", "Chi phí cố định 1.600.000"],
    ["timeout", "Chưa có chứng cứ vô nghiệm"],
  ]) {
    await page.getByLabel("Kịch bản minh họa").selectOption(id);
    await page.getByRole("button", { name: "Xem kết quả mock" }).click();
    await page.getByRole("status").filter({ hasText: text }).waitFor();
  }
  await page.getByLabel("Kịch bản minh họa").selectOption("standard");
  await page.getByLabel("Ngân sách tổng nhóm (VND)").fill("5123456");
  await page.getByRole("button", { name: "Xem kết quả mock" }).click();
  await page
    .getByRole("status")
    .filter({ hasText: "Bộ demo chưa có kết quả" })
    .waitFor();
  await page.evaluate(() => {
    localStorage.setItem("smarttrip.demo.v1", "{invalid");
    localStorage.setItem("other.app", "keep");
  });
  await page.getByRole("link", { name: "Chuyến đi", exact: true }).click();
  await page
    .getByRole("status")
    .filter({ hasText: "Không đọc được dữ liệu demo" })
    .waitFor();
  await page.getByRole("button", { name: "Xóa dữ liệu demo" }).click();
  assert.equal(
    await page.evaluate(() => localStorage.getItem("other.app")),
    "keep",
  );
  await page.getByRole("link", { name: "Khách du lịch · Demo" }).click();
  await page.getByRole("button", { name: "Xem dữ liệu quản trị" }).click();
  await page
    .getByRole("heading", { name: "Danh mục và nguồn dữ liệu" })
    .waitFor();
  for (const width of [320, 375, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      "admin navigation overflow at " + width,
    );
    assert.equal(await page.locator("nav a").count(), 4);
  }

  await page.goto(base + "/trips/danang-demo/versions/v1");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "test-results/itinerary-mobile.png",
    fullPage: true,
  });
  for (const path of [
    "/trips/danang-demo/versions/v1",
    "/planner",
    "/trips",
    "/compare/standard",
    "/admin",
    "/unknown",
  ]) {
    await page.goto(base + path);
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `overflow ${path}`,
    );
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(base + "/planner");
  await page.getByLabel("Kịch bản minh họa").waitFor();
  await page.locator(".skip").focus();
  assert.equal(
    await page.locator(":focus").textContent(),
    "Đến nội dung chính",
  );
  await page.keyboard.press("Enter");
  assert.equal(await page.locator(":focus").getAttribute("id"), "main");
  assert.equal(
    await page.locator("label input:not([type=checkbox]),label select").count(),
    13,
  );
  for (const path of [
    "/demo-login",
    "/trips",
    "/planner",
    "/trips/danang-demo/versions/v1",
  ]) {
    await page.goto(base + path);
    await page.locator("h1").waitFor();
    const images = await page.locator("img:not(.brand-mark)").evaluateAll(async (images) => {
      return Promise.all(
        images.map(async (image) => {
          image.loading = "eager";
          await image.decode();
          return { width: image.naturalWidth, alt: image.alt };
        }),
      );
    });
    assert(images.length > 0, "photos missing on " + path);
    assert(
      images.every((image) => image.width > 0 && image.alt.length > 0),
      "broken photo/alt on " + path,
    );
    assert.equal(
      await page
        .locator("body")
        .evaluate(() =>
          getComputedStyle(document.documentElement)
            .getPropertyValue("--blue-600")
            .trim(),
        ),
      "#256bb7",
    );
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      "photo layout overflow " + path,
    );
  }
  await page.goto(base + "/trips/no-such-trip/versions/v1");
  await page
    .getByRole("heading", { name: "Không tìm thấy lịch trình" })
    .waitFor();
  assert.deepEqual(errors, []);
  console.log(
    "PASS: standard, comparison, conflict, timeout, unsupported, save/reload v1+v2, corrupt storage/reset, admin, deep links, 390px overflow, keyboard skip, reduced motion; no page errors",
  );
} finally {
  await browser.close();
}
