import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
const browser = await chromium.launch({
  headless: true,
  ...(process.env.SMARTTRIP_CHROME
    ? { executablePath: process.env.SMARTTRIP_CHROME }
    : {}),
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const dir = "../docs/uxui_screenshots";
await mkdir(dir, { recursive: true });
try {
  for (const [path, file] of [
    ["/demo-login", "happy_01_login"],
    ["/planner", "happy_02_planner"],
    ["/trips/danang-demo/versions/v1", "happy_03_itinerary"],
    ["/compare/standard", "happy_04_comparison"],
  ]) {
    await page.goto("http://127.0.0.1:5173" + path);
    await page.locator("h1").waitFor();
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
  await page.goto("http://127.0.0.1:5173/demo-login");
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
  await page.goto("http://127.0.0.1:5173/trips/danang-demo/versions/v1");
  await page.getByRole("button", { name: "Lưu phiên bản" }).click();
  await page.goto("http://127.0.0.1:5173/trips/danang-demo/versions/v2");
  await page.getByRole("button", { name: "Lưu phiên bản" }).click();
  await page.goto("http://127.0.0.1:5173/trips");
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
  console.log("PASS: captured 6 real FE screenshots for README");
} finally {
  await browser.close();
}
