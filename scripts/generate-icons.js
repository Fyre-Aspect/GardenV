const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const svgContent = fs.readFileSync(
  path.join(__dirname, '../public/favicon.svg'),
  'utf8'
);

const sizes = [16, 32, 64, 192, 512];

async function generate() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  for (const size of sizes) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            * { margin: 0; padding: 0; }
            body { background: transparent; width: ${size}px; height: ${size}px; overflow: hidden; }
            svg { width: ${size}px; height: ${size}px; display: block; }
          </style>
        </head>
        <body>${svgContent}</body>
      </html>
    `);

    const outPath = path.join(__dirname, `../public/icon-${size}.png`);
    await page.screenshot({ path: outPath, clip: { x: 0, y: 0, width: size, height: size }, omitBackground: true });
    console.log(`Generated ${size}x${size} → ${outPath}`);
  }

  await browser.close();
}

generate().catch(err => { console.error(err); process.exit(1); });
