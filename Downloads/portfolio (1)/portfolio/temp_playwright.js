const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('CONSOLE', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGEERROR', err.message));
  page.on('requestfailed', req => console.log('REQFAILED', req.url(), req.failure()?.errorText));
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  const html = await page.content();
  console.log('PAGE HTML LENGTH', html.length);
  const root = await page.$('#root');
  console.log('ROOT EXISTS', !!root);
  const text = await page.innerText('body');
  console.log('BODY TEXT PREVIEW', text.slice(0, 200));
  await browser.close();
})();
