import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

const url = process.argv[2];
const name = process.argv[3];
const screen = process.argv[4] || "desktop";

if (!url) {
    console.error("Usage: node screenshot.mjs <url> [name] [desktop|tablet|mobile]");
    process.exit(1);
}

const baseDir = process.cwd();
const screenshotsDir = path.join(baseDir, "screenshots");

fs.mkdirSync(screenshotsDir, { recursive: true });

function getNextScreenshotName() {
    const files = fs.readdirSync(screenshotsDir);

    const numbers = files
        .map(f => f.match(/^screenshot-(\d+)\.png$/))
        .filter(Boolean)
        .map(m => Number(m[1]));

    const next = numbers.length ? Math.max(...numbers) + 1 : 1;

    return `screenshot-${next}.png`;
}

const baseName = name ? name : getNextScreenshotName().replace(".png", "");
const filename = `${baseName}-${screen}.png`;
const outputPath = path.join(screenshotsDir, filename);

(async () => {

    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    // viewport presets
    const viewports = {
        desktop: { width: 1440, height: 900 },
        tablet: { width: 1024, height: 1366 },
        mobile: { width: 390, height: 844, isMobile: true, hasTouch: true }
    };

    const viewport = viewports[screen] || viewports.desktop;

    await page.setViewport(viewport);

    console.log(`Opening ${url} (${screen})`);

    await page.goto(url, { waitUntil: "networkidle0" });

    // wait for fonts
    await page.evaluate(async () => {
        if (document.fonts) await document.fonts.ready;
    });

    // disable animations
    await page.addStyleTag({
        content: `
      *,
      *::before,
      *::after {
        animation-delay: -1s !important;
        animation-duration: 0s !important;
        animation-play-state: paused !important;
        transition: none !important;
      }
    `
    });

    // layout stabilization
    await page.evaluate(() => {
        return new Promise(resolve => {
            requestAnimationFrame(() => requestAnimationFrame(resolve));
        });
    });

    await page.screenshot({
        path: outputPath,
        fullPage: true
    });

    await browser.close();

    console.log(`Saved screenshot to ${outputPath}`);

})();
