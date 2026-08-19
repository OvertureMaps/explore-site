import { createServer } from 'node:http';
import { readFile, access } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const OUT_DIR = join('/home/runner/work/explore-site/explore-site', 'out');
const PORT = 3778;
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

const server = createServer(async (req, res) => {
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
const browser = await chromium.launch();

const context = await browser.newContext();
const page = await context.newPage();

// Capture console messages
page.on('console', msg => {
  console.log(`[CONSOLE ${msg.type()}] ${msg.text()}`);
});

page.on('pageerror', err => {
  console.log(`[PAGE ERROR] ${err.message}`);
});

page.on('requestfailed', request => {
  console.log(`[REQUEST FAILED] ${request.url()} - ${request.failure()?.errorText}`);
});

await page.addInitScript((t) => localStorage.setItem('theme', t), 'theme-dark');
await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

console.log('Waiting 5 seconds...');
await new Promise(r => setTimeout(r, 5000));

// Check what's on the page
const html = await page.content();
console.log('Has .tour-darkmode:', html.includes('tour-darkmode'));
console.log('Has mounted content:', html.includes('dark-mode-toggle'));
console.log('Body innerHTML length:', (await page.evaluate(() => document.body.innerHTML)).length);

// Get the actual HTML
const bodyContent = await page.evaluate(() => document.body.innerHTML.substring(0, 2000));
console.log('Body content:', bodyContent);

await browser.close();
await new Promise((resolve) => server.close(resolve));
