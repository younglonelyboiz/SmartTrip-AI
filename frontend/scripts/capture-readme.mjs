import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
const browser = await chromium.launch({
  headless: true,
  ...(process.env.SMARTTRIP_CHROME
    ? { executablePath: process.env.SMARTTRIP_CHROME }
    : {}),
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const base = process.env.SMARTTRIP_URL || "http://127.0.0.1:5174";
const dir = "../docs/uxui_screenshots";
await mkdir(dir, { recursive: true });
try {
  for (const [path, file] of [
    ["/", "happy_00_explore"],
    ["/diem-den/hue", "happy_07_hue"],
    ["/demo-login", "happy_01_login"],
    ["/planner", "happy_02_planner"],
    ["/trips/danang-demo/versions/v1", "happy_03_itinerary"],
    ["/compare/standard", "happy_04_comparison"],
  ]) {
    await page.goto(base + path);
    await page.locator("h1").waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.locator("main").focus();
    await page.locator("img").evaluateAll(async (images) => {
      await Promise.all(
        images.map(async (image) => {
          image.loading = "eager";
          await image.decode();
        }),
      );
    });
    await page.screenshot({ path: `${dir}/${file}.png`, fullPage: true });
  }
  await page.goto(base + "/demo-login");
  await page.getByRole("button", { name: "Xem dữ liệu quản trị" }).click();
  await page
    .getByRole("heading", { name: "Danh mục và nguồn dữ liệu" })
    .waitFor();
  await page.locator("main").focus();
  await page.locator("img").evaluateAll(async (images) => {
    await Promise.all(
      images.map(async (image) => {
        image.loading = "eager";
        await image.decode();
      }),
    );
  });
  await page.screenshot({ path: `${dir}/happy_05_admin.png`, fullPage: true });
  await page.goto(base + "/trips/danang-demo/versions/v1");
  await page.getByRole("button", { name: "Lưu phiên bản" }).click();
  await page.goto(base + "/trips/danang-demo/versions/v2");
  await page.getByRole("button", { name: "Lưu phiên bản" }).click();
  await page.goto(base + "/trips");
  await page.getByRole("link", { name: "Đà Nẵng · v2" }).waitFor();
  await page.locator("main").focus();
  await page.locator("img").evaluateAll(async (images) => {
    await Promise.all(
      images.map(async (image) => {
        image.loading = "eager";
        await image.decode();
      }),
    );
  });
  await page.screenshot({ path: `${dir}/happy_06_trips.png`, fullPage: true });
  await page.goto(base);
  await page.evaluate(() => document.fonts.ready);
  await page.locator("img").evaluateAll(images => Promise.all(images.map(async image => {image.loading = "eager"; await image.decode();})));
  for (const [selector, name] of [[".explore-hero", "hero"], ["#diem-den", "destinations"], ["#lich-trinh-mau", "templates"], ["#cam-nang", "guides"]]) {
    await page.locator(selector).screenshot({path: `${dir}/detail_${name}.png`});
  }
  await page.goto(base + "/planner");
  await page.evaluate(() => document.fonts.ready);
  await page.locator("img").evaluateAll(images => Promise.all(images.map(async image => {image.loading="eager";await image.decode();})));
  await page.locator(".planner-layout").screenshot({path: `${dir}/detail_planner.png`});
  await page.goto(base + "/planner");
  await page.getByLabel("Dự trù đi–về và chặng nối cả nhóm (VND)").fill("3000000");
  await page.getByRole("button", {name: "Xem kết quả mock"}).click();
  await page.locator(".journey-summary").waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.locator(".journey-summary").screenshot({path: `${dir}/detail_journey.png`});
  console.log("PASS: refreshed UI screenshots, presentation details and full journey");
} finally {
  await browser.close();
}
