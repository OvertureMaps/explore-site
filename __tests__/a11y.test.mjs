/**
 * WCAG 2.2 AA accessibility tests using Node's built-in test runner.
 * Requires a built `out/` directory — run `npm run build` first.
 * Run with: npm run test:a11y
 */

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, access } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const OUT_DIR = join(__dirname, '..', 'out');
const PORT = 3777;
const BASE_URL = `http://localhost:${PORT}`;

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.pbf': 'application/x-protobuf',
};

let server, browser;

before(async () => {
  // Fail fast if the build output doesn't exist
  await access(join(OUT_DIR, 'index.html')).catch(() => {
    throw new Error(`out/index.html not found — run 'npm run build' before running accessibility tests`);
  });

  // Minimal static file server — falls back to index.html for SPA routing
  server = createServer(async (req, res) => {
    const urlPath = req.url.split('?')[0];
    const filePath = join(OUT_DIR, urlPath === '/' ? 'index.html' : urlPath);
    try {
      const data = await readFile(filePath);
      res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] ?? 'application/octet-stream' });
      res.end(data);
    } catch {
      try {
        const data = await readFile(join(OUT_DIR, 'index.html'));
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
      } catch {
        res.writeHead(404);
        res.end('Not found');
      }
    }
  });
  await new Promise((resolve) => server.listen(PORT, resolve));
  browser = await chromium.launch();
});

after(async () => {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
});

function formatViolations(violations, label) {
  if (violations.length === 0) return;
  const detail = violations
    .map((v) =>
      `[${v.impact}] ${v.id}: ${v.description}\n` +
      v.nodes.map((n) => `  • ${n.target}`).join('\n')
    )
    .join('\n\n');
  assert.fail(`${violations.length} WCAG 2.2 AA violation(s) — ${label}:\n\n${detail}`);
}

// @axe-core/playwright requires pages created via browser.newContext().newPage()
async function openPage(theme) {
  const context = await browser.newContext();
  const page = await context.newPage();
  // Set theme in localStorage before navigation so keepTheme() picks it up
  await page.addInitScript((t) => localStorage.setItem('theme', t), theme);
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  // The page returns null until React mounts — wait for the header to appear
  await page.waitForSelector('.tour-darkmode', { timeout: 10000 });
  return { page, context };
}

async function runAxe(page) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  return violations;
}

for (const theme of ['theme-dark', 'theme-light']) {
  test(`homepage passes WCAG 2.2 AA (${theme})`, async () => {
    const { page, context } = await openPage(theme);
    try {
      formatViolations(await runAxe(page), `homepage ${theme}`);
    } finally {
      await context.close();
    }
  });

  test(`homepage with layers sidebar open passes WCAG 2.2 AA (${theme})`, async () => {
    const { page, context } = await openPage(theme);
    try {
      // Click the floating toggle button (contains LayersIcon) to open the drawer
      await page.locator('button:has([data-testid="LayersIcon"])').click();
      // Wait for the Tabs inside the drawer to render (MUI Tabs has role="tablist")
      await page.waitForSelector('[role="tablist"]', { timeout: 5000 });
      formatViolations(await runAxe(page), `layers sidebar ${theme}`);
    } finally {
      await context.close();
    }
  });
}
