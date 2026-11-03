import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const dir = fileURLToPath(new URL("../../docs/uxui_screenshots/", import.meta.url));
let server;
let browser;
try {
  let base = process.env.SMARTTRIP_URL;
  if (!base) {
    const { createServer } = await import("vite");
    server = await createServer({
      root: fileURLToPath(new URL("../", import.meta.url)),
      server: { host: "127.0.0.1", port: 0 },
    });
    await server.listen();
    base = server.resolvedUrls.local[0];
  }
  browser = await chromium.launch({
    headless: true,
    ...(process.env.SMARTTRIP_CHROME ? { executablePath: process.env.SMARTTRIP_CHROME } : {}),
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, reducedMotion: "reduce" });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await mkdir(dir, { recursive: true });

  async function prepare(path, map = false) {
    await page.goto(new URL(path, base).href);
    await page.locator("h1").waitFor();
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.querySelectorAll("img:not(.leaflet-tile)")].map(async image => {
        image.loading = "eager";
        await image.decode();
      }));
    });
    if (map) {
      await page.locator(".leaflet-marker-icon").first().waitFor();
      await page.waitForFunction(() => {
        const tiles = [...document.querySelectorAll("img.leaflet-tile")];
        return tiles.length > 0 && tiles.every(tile => tile.complete && tile.naturalWidth > 0 && Number(getComputedStyle(tile).opacity) === 1);
      }, {}, { timeout: 45000 });
    }
    await page.locator("main").focus();
    await page.evaluate(() => window.scrollTo(0, 0));
  }

  await prepare("/");
  // Select the opening image using the actual carousel control.
  const active = await page.locator(".explore-hero-slide").evaluateAll(slides => slides.findIndex(slide => slide.classList.contains("is-active")));
  for (let i = 0; i < active; i++) await page.getByRole("button", { name: "Ảnh trước", exact: true }).click();
  const hero = await page.locator(".explore-hero").boundingBox();
  const destinations = await page.locator("#diem-den").boundingBox();
  await page.screenshot({
    path: `${dir}/happy_00_explore.png`, animations: "disabled", fullPage: true,
    clip: { x: 76, y: hero.y - 16, width: 1288, height: Math.ceil(destinations.y + destinations.height - hero.y + 32) },
  });

  await prepare("/planner", true);
  await page.locator("main").screenshot({ path: `${dir}/happy_02_planner.png`, animations: "disabled" });

  await prepare("/trips/danang-demo/versions/v1?origin=H%C3%A0+N%E1%BB%99i&mode=M%C3%A1y+bay&arrival=07%3A00&departure=19%3A00&transfer=60&travelCost=", true);
  const layout = await page.locator(".itinerary-destination-layout").boundingBox();
  const heading = await page.locator(".itinerary-heading").boundingBox();
  // Capture the complete daily timeline and geographic map together.
  const top = Math.max(0, heading.y - 18);
  await page.screenshot({
    path: `${dir}/happy_03_itinerary.png`, animations: "disabled", fullPage: true,
    clip: { x: 76, y: top, width: 1288, height: Math.ceil(layout.y + layout.height - top + 8) },
  });
  if (errors.length) throw new Error(errors.join("\n"));
  console.log("Captured 3 current UI screenshots; map tiles loaded; no page errors.");
} finally {
  await browser?.close();
  await server?.close();
}
