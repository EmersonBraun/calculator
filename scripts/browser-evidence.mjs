import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const require = createRequire(new URL('../frontend/package.json', import.meta.url));
const { chromium } = require('@playwright/test');
const root = resolve(new URL('..', import.meta.url).pathname);
const outputDir = join(root, '.codex/verification/ui');
const port = 41731;
const apiPort = 41732;
const url = `http://127.0.0.1:${port}`;
const apiUrl = `http://127.0.0.1:${apiPort}`;
const viewports = [[320, 568], [390, 844], [768, 1024], [1440, 900]];
const failures = [];
const artifacts = [];
const results = [];
mkdirSync(outputDir, { recursive: true });

const api = spawn('go', ['run', './cmd/server'], { cwd: join(root, 'backend'), env: { ...process.env, PORT: String(apiPort) }, stdio: 'ignore' });
const server = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: join(root, 'frontend'), env: { ...process.env, VITE_API_BASE_URL: '', VITE_API_PROXY_TARGET: apiUrl }, stdio: 'ignore' });
const stop = () => { server.kill('SIGTERM'); api.kill('SIGTERM'); };
process.on('exit', stop);

async function waitUntilReady() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try { if ((await fetch(url)).ok && (await fetch(`${apiUrl}/healthz`)).ok) return; } catch {}
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
  }
  throw new Error(`Vite did not become ready on port ${port}`);
}

function artifact(path, viewport, state) {
  if (!existsSync(path)) return;
  artifacts.push({ type: 'screenshot', path: relative(root, path), sha256: createHash('sha256').update(readFileSync(path)).digest('hex'), viewport, state });
}

let browser;
try {
  await waitUntilReady();
  browser = await chromium.launch();
  for (const [width, height] of viewports) {
    const viewport = `${width}x${height}`;
    const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
    const errors = [];
    let expectingApiFailure = false;
    page.on('pageerror', (error) => errors.push(`page: ${error.message}`));
    page.on('console', (message) => { if (message.type() === 'error' && !(expectingApiFailure && message.text().includes('503'))) errors.push(`console: ${message.text()}`); });
    page.on('requestfailed', (request) => errors.push(`network: ${request.url()} ${request.failure()?.errorText ?? 'failed'}`));
    await page.goto(url, { waitUntil: 'networkidle' });
    const initialPanel = await page.locator('.display-panel').boundingBox();
    await page.keyboard.press('7');
    await page.keyboard.press('*');
    await page.keyboard.press('8');
    const populatedPanel = await page.locator('.display-panel').boundingBox();
    if (!initialPanel || !populatedPanel || initialPanel.width !== populatedPanel.width || initialPanel.height !== populatedPanel.height) errors.push('display: panel dimensions changed after input');
    const populatedPath = join(outputDir, `${viewport}-populated.png`);
    await page.screenshot({ path: populatedPath, fullPage: false });
    artifact(populatedPath, viewport, 'populated');
    await page.keyboard.press('Enter');
    try { await page.getByLabel('Calculator display').filter({ hasText: '56' }).waitFor({ timeout: 3000 }); }
    catch { errors.push('interaction: 7 × 8 did not display 56'); }
    await page.getByRole('button', { name: 'Clear calculator' }).click();
    await page.keyboard.type('2+3');
    await page.keyboard.press('*');
    await page.getByLabel('Calculator display').filter({ hasText: '5' }).waitFor({ timeout: 3000 });
    await page.keyboard.type('4');
    await page.keyboard.press('Enter');
    try { await page.getByLabel('Calculator display').filter({ hasText: '20' }).waitFor({ timeout: 3000 }); }
    catch { errors.push('interaction: chained 2 + 3 × 4 did not display 20'); }
    await page.getByRole('button', { name: 'Clear calculator' }).click();
    await page.keyboard.type('9');
    await page.getByRole('button', { name: 'Toggle sign' }).click();
    await page.getByRole('button', { name: 'Square root' }).click();
    await page.getByRole('button', { name: 'Equals' }).click();
    if (!await page.getByRole('alert').getByText(/zero or greater/i).isVisible()) errors.push('validation: negative square root did not show an inline error');
    await page.getByRole('button', { name: 'Clear calculator' }).click();
    await page.getByRole('button', { name: 'Clear calculator' }).focus();
    await page.keyboard.press('Shift+Tab');
    if (!await page.getByRole('button', { name: 'Backspace' }).evaluate((element) => element === document.activeElement)) errors.push('keyboard: tab did not focus the first calculator control');
    await page.route('**/api/calculate', (route) => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: 'Service temporarily unavailable.' } }) }));
    expectingApiFailure = true;
    await page.getByRole('button', { name: 'Clear calculator' }).click();
    await page.keyboard.type('1+1');
    await page.keyboard.press('Enter');
    try { await page.getByRole('alert').getByText(/temporarily unavailable/i).waitFor({ timeout: 3000 }); }
    catch { errors.push('interaction: API failure did not preserve an inline error'); }
    await page.unroute('**/api/calculate');
    expectingApiFailure = false;
    await page.getByRole('button', { name: 'Clear calculator' }).click();
    const metrics = await page.evaluate(() => {
      const calculator = document.querySelector('.calculator-wrap');
      const display = document.querySelector('.display');
      const displayStyle = getComputedStyle(display);
      const calculatorRect = calculator.getBoundingClientRect();
      const displayRect = display.getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(display);
      const textRect = range.getBoundingClientRect();
      const keys = [...document.querySelectorAll('.keypad .key:not(.backspace)')].map((key) => getComputedStyle(key).fontSize);
      const backspaceStyle = getComputedStyle(document.querySelector('.backspace'));
      return {
        pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        calculatorInsideViewport: calculatorRect.left >= 0 && calculatorRect.right <= innerWidth && calculatorRect.top >= 0 && calculatorRect.bottom <= innerHeight,
        displayTextInside: textRect.left >= displayRect.left && textRect.right <= displayRect.right && textRect.top >= displayRect.top && textRect.bottom <= displayRect.bottom,
        displayBounds: { display: { top: displayRect.top, right: displayRect.right, bottom: displayRect.bottom, left: displayRect.left }, text: { top: textRect.top, right: textRect.right, bottom: textRect.bottom, left: textRect.left } },
        displayRightPadding: Number.parseFloat(displayStyle.paddingRight),
        keyFontSizes: [...new Set(keys)],
        backspaceFontSize: Number.parseFloat(backspaceStyle.fontSize),
        minimumKeySize: Math.min(...[...document.querySelectorAll('.keypad .key')].map((key) => Math.min(key.getBoundingClientRect().width, key.getBoundingClientRect().height))),
      };
    });
    if (metrics.pageOverflow > 1) errors.push(`layout: horizontal overflow ${metrics.pageOverflow}px`);
    if (!metrics.calculatorInsideViewport) errors.push('layout: calculator is outside the viewport');
    if (!metrics.displayTextInside || metrics.displayRightPadding < 8) errors.push(`display: text lacks safe bounds (${metrics.displayRightPadding}px right padding)`);
    if (metrics.keyFontSizes.length !== 1 || metrics.backspaceFontSize < 26) errors.push(`typography: inconsistent key labels (${metrics.keyFontSizes.join(', ')}, backspace ${metrics.backspaceFontSize}px)`);
    if (metrics.minimumKeySize < 44) errors.push(`accessibility: key target is ${metrics.minimumKeySize}px`);
    const screenshotPath = join(outputDir, `${viewport}-initial.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });
    artifact(screenshotPath, viewport, 'initial');
    results.push({ viewport, metrics, failures: errors });
    failures.push(...errors.map((error) => `${viewport}: ${error}`));
    await page.close();
  }
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
} finally {
  await browser?.close();
  stop();
}

const criteria = {
  'ui-display': { status: failures.some((item) => item.includes('display:')) ? 'failed' : 'passed' },
  'ui-typography': { status: failures.some((item) => item.includes('typography:')) ? 'failed' : 'passed' },
  'ui-responsive': { status: failures.some((item) => item.includes('layout:')) ? 'failed' : 'passed' },
  'ui-targets': { status: failures.some((item) => item.includes('accessibility:')) ? 'failed' : 'passed' },
  'ui-interaction': { status: failures.some((item) => /interaction:|validation:|keyboard:/.test(item)) ? 'failed' : 'passed' },
  'ui-runtime': { status: failures.some((item) => /page:|console:|network:/.test(item)) ? 'failed' : 'passed' },
};
const result = { status: failures.length ? 'failed' : 'pending-human-review', capability: 'real-browser', artifacts, criteria, viewports: viewports.map(([width, height]) => `${width}x${height}`), results, failures };
console.log(JSON.stringify(result));
if (failures.length) process.exitCode = 1;
