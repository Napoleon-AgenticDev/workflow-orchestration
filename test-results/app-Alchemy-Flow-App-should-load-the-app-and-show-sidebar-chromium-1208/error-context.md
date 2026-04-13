# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app.spec.ts >> Alchemy Flow App >> should load the app and show sidebar
- Location: apps/alchemy-flow-e2e/src/app.spec.ts:4:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.sidebar')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('.sidebar')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - heading "Directory listing for /" [level=1] [ref=e2]
  - separator [ref=e3]
  - list [ref=e4]:
    - listitem [ref=e5]:
      - link "chunk-73C2GH4T.js" [ref=e6] [cursor=pointer]:
        - /url: chunk-73C2GH4T.js
    - listitem [ref=e7]:
      - link "chunk-73C2GH4T.js.map" [ref=e8] [cursor=pointer]:
        - /url: chunk-73C2GH4T.js.map
    - listitem [ref=e9]:
      - link "chunk-7TCFCQYQ.js" [ref=e10] [cursor=pointer]:
        - /url: chunk-7TCFCQYQ.js
    - listitem [ref=e11]:
      - link "chunk-7TCFCQYQ.js.map" [ref=e12] [cursor=pointer]:
        - /url: chunk-7TCFCQYQ.js.map
    - listitem [ref=e13]:
      - link "chunk-BWDXD4AI.js" [ref=e14] [cursor=pointer]:
        - /url: chunk-BWDXD4AI.js
    - listitem [ref=e15]:
      - link "chunk-BWDXD4AI.js.map" [ref=e16] [cursor=pointer]:
        - /url: chunk-BWDXD4AI.js.map
    - listitem [ref=e17]:
      - link "chunk-CB3BHLDL.js" [ref=e18] [cursor=pointer]:
        - /url: chunk-CB3BHLDL.js
    - listitem [ref=e19]:
      - link "chunk-CB3BHLDL.js.map" [ref=e20] [cursor=pointer]:
        - /url: chunk-CB3BHLDL.js.map
    - listitem [ref=e21]:
      - link "chunk-IIOMVTCE.js" [ref=e22] [cursor=pointer]:
        - /url: chunk-IIOMVTCE.js
    - listitem [ref=e23]:
      - link "chunk-IIOMVTCE.js.map" [ref=e24] [cursor=pointer]:
        - /url: chunk-IIOMVTCE.js.map
    - listitem [ref=e25]:
      - link "chunk-PTT2MMSM.js" [ref=e26] [cursor=pointer]:
        - /url: chunk-PTT2MMSM.js
    - listitem [ref=e27]:
      - link "chunk-PTT2MMSM.js.map" [ref=e28] [cursor=pointer]:
        - /url: chunk-PTT2MMSM.js.map
    - listitem [ref=e29]:
      - link "chunk-RIHWSOQY.js" [ref=e30] [cursor=pointer]:
        - /url: chunk-RIHWSOQY.js
    - listitem [ref=e31]:
      - link "chunk-RIHWSOQY.js.map" [ref=e32] [cursor=pointer]:
        - /url: chunk-RIHWSOQY.js.map
    - listitem [ref=e33]:
      - link "chunk-RREAQUU2.js" [ref=e34] [cursor=pointer]:
        - /url: chunk-RREAQUU2.js
    - listitem [ref=e35]:
      - link "chunk-RREAQUU2.js.map" [ref=e36] [cursor=pointer]:
        - /url: chunk-RREAQUU2.js.map
    - listitem [ref=e37]:
      - link "chunk-WQRT5RG3.js" [ref=e38] [cursor=pointer]:
        - /url: chunk-WQRT5RG3.js
    - listitem [ref=e39]:
      - link "chunk-WQRT5RG3.js.map" [ref=e40] [cursor=pointer]:
        - /url: chunk-WQRT5RG3.js.map
    - listitem [ref=e41]:
      - link "chunk-YTNGNZBL.js" [ref=e42] [cursor=pointer]:
        - /url: chunk-YTNGNZBL.js
    - listitem [ref=e43]:
      - link "chunk-YTNGNZBL.js.map" [ref=e44] [cursor=pointer]:
        - /url: chunk-YTNGNZBL.js.map
    - listitem [ref=e45]:
      - link "executions.component.css.map" [ref=e46] [cursor=pointer]:
        - /url: executions.component.css.map
    - listitem [ref=e47]:
      - link "favicon.ico" [ref=e48] [cursor=pointer]:
        - /url: favicon.ico
    - listitem [ref=e49]:
      - link "index.csr.html" [ref=e50] [cursor=pointer]:
        - /url: index.csr.html
    - listitem [ref=e51]:
      - link "main.js" [ref=e52] [cursor=pointer]:
        - /url: main.js
    - listitem [ref=e53]:
      - link "main.js.map" [ref=e54] [cursor=pointer]:
        - /url: main.js.map
    - listitem [ref=e55]:
      - link "nx-welcome.css.map" [ref=e56] [cursor=pointer]:
        - /url: nx-welcome.css.map
    - listitem [ref=e57]:
      - link "schedules.component.css.map" [ref=e58] [cursor=pointer]:
        - /url: schedules.component.css.map
    - listitem [ref=e59]:
      - link "styles.css" [ref=e60] [cursor=pointer]:
        - /url: styles.css
    - listitem [ref=e61]:
      - link "styles.css.map" [ref=e62] [cursor=pointer]:
        - /url: styles.css.map
    - listitem [ref=e63]:
      - link "workflow-editor.component.css.map" [ref=e64] [cursor=pointer]:
        - /url: workflow-editor.component.css.map
    - listitem [ref=e65]:
      - link "workflows.component.css.map" [ref=e66] [cursor=pointer]:
        - /url: workflows.component.css.map
  - separator [ref=e67]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Alchemy Flow App', () => {
  4  |   test('should load the app and show sidebar', async ({ page }) => {
  5  |     await page.goto('/');
  6  |     await page.waitForTimeout(1000);
  7  |     
  8  |     const screenshot1 = await page.screenshot({ path: 'apps/alchemy-flow-e2e/src/screenshots/01-landing.png' });
  9  |     console.log('Saved: 01-landing.png');
  10 |     
  11 |     const sidebar = page.locator('.sidebar');
> 12 |     await expect(sidebar).toBeVisible({ timeout: 5000 });
     |                           ^ Error: expect(locator).toBeVisible() failed
  13 |     
  14 |     await page.screenshot({ path: 'apps/alchemy-flow-e2e/src/screenshots/02-sidebar.png' });
  15 |     console.log('Saved: 02-sidebar.png');
  16 |   });
  17 | 
  18 |   test('should navigate to executions', async ({ page }) => {
  19 |     await page.goto('/executions');
  20 |     await page.waitForTimeout(1000);
  21 |     await page.screenshot({ path: 'apps/alchemy-flow-e2e/src/screenshots/03-executions.png' });
  22 |     console.log('Saved: 03-executions.png');
  23 |   });
  24 | 
  25 |   test('should navigate to schedules', async ({ page }) => {
  26 |     await page.goto('/schedules');
  27 |     await page.waitForTimeout(1000);
  28 |     await page.screenshot({ path: 'apps/alchemy-flow-e2e/src/screenshots/04-schedules.png' });
  29 |     console.log('Saved: 04-schedules.png');
  30 |   });
  31 | 
  32 |   test('should navigate to workflow editor', async ({ page }) => {
  33 |     await page.goto('/workflows');
  34 |     await page.waitForTimeout(1000);
  35 |     await page.screenshot({ path: 'apps/alchemy-flow-e2e/src/screenshots/05-workflows-list.png' });
  36 |     console.log('Saved: 05-workflows-list.png');
  37 |   });
  38 | });
```