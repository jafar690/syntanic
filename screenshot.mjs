import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

const url = process.argv[2];
const name = process.argv[3];

if (!url) {
    console.error("Usage: node screenshot.mjs <url> [name]");
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

const filename = name ? `${name}.png` : getNextScreenshotName();
const outputPath = path.join(screenshotsDir, filename);

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setViewport({
        width: 1440,
        height: 900
    });

    console.log(`Opening ${url}`);

    await page.goto(url, {
        waitUntil: "networkidle2"
    });

    await page.screenshot({
        path: outputPath,
        fullPage: true
    });

    await browser.close();

    console.log(`Saved screenshot to ${outputPath}`);
})();
