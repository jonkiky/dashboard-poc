import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Every test has its own browser context and empty localStorage. Fix only the
  // displayed clock, so seeded approval expiry stays deterministic over time.
  await page.clock.setFixedTime(new Date('2026-11-02T15:00:00Z'));
  await page.route('**/*', async (route) => {
    const hostname = new URL(route.request().url()).hostname;
    if (hostname === '127.0.0.1' || hostname === 'localhost') await route.continue();
    else await route.abort('blockedbyclient');
  });
  await page.goto('/');
});

async function completeReview(page: Page, rationale: string) {
  const checks = page.getByRole('checkbox');
  await expect(checks).toHaveCount(4);
  for (let index = 0; index < 4; index += 1) await checks.nth(index).check();
  await page.getByRole('textbox', { name: 'Decision rationale' }).fill(rationale);
}

async function openLab(page: Page) {
  await page.getByRole('button', { name: 'Simulation lab', exact: true }).click();
  return page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: 'Test an approval boundary', exact: true }) });
}

test('MCP-first overview leads to a scoped server approval that survives reload with a decision trail', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'MCP governance, at a glance.', exact: true })).toBeVisible();
  const metrics = page.getByRole('region', { name: 'MCP governance metrics' });
  await expect(metrics.locator('.metric-card').filter({ has: page.getByText('MCP servers', { exact: true }) }).locator('strong')).toHaveText('04');
  await expect(metrics.locator('.metric-card').filter({ has: page.getByText('Approved MCP servers', { exact: true }) }).locator('strong')).toHaveText('02');
  await page.getByRole('link', { name: /Review workspace/ }).click();
  await expect(page.getByRole('heading', { name: 'Lab Workspace File Index', exact: true })).toBeVisible();
  const approve = page.getByRole('button', { name: 'Approve scoped use' });
  await expect(approve).toBeDisabled();
  await completeReview(page, 'Internal lab metadata scope and synthetic evaluation evidence reviewed.');
  await expect(approve).toBeEnabled();
  await approve.click();
  await expect(page.getByText('Decision recorded: approved', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('Decision recorded: approved', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Audit trail', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Scoped approval granted', exact: true })).toBeVisible();
  await expect(page.getByText(/Internal lab metadata scope and synthetic evaluation evidence reviewed\./)).toBeVisible();
  // Draft edits should not manufacture an event for every check or keystroke.
  await expect(page.getByRole('heading', { name: 'Review draft saved', exact: true })).toHaveCount(0);
});

test('review attestations cannot override the controlled-data export blocker', async ({ page }) => {
  await page.getByRole('link', { name: /Review workspace/ }).click();
  await page.getByRole('button', { name: /Clinical Cohort Export Connector/ }).click();
  await completeReview(page, 'All attestations checked to demonstrate the hard destination blocker.');
  await expect(page.getByText('4 / 4 checks', { exact: true })).toBeVisible();
  await expect(page.getByText('Action required', { exact: true })).toBeVisible();
  await expect(page.getByText(/Controlled data cannot be sent to an external/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Approve scoped use' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Reject submission' })).toBeEnabled();
  await page.reload();
  await page.getByRole('button', { name: /Clinical Cohort Export Connector/ }).click();
  await expect(page.getByText('4 / 4 checks', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Approve scoped use' })).toBeDisabled();
});

test('the simulation lab permits public scope and denies wider data, action, or environment scope', async ({ page }) => {
  const lab = await openLab(page);
  await expect(lab.getByRole('combobox', { name: 'Asset', exact: true })).toHaveValue('mcp-imaging');
  await lab.getByRole('combobox', { name: 'Asset', exact: true }).selectOption('skill-cohort');
  await lab.getByRole('button', { name: 'Run access simulation' }).click();
  await expect(lab.getByRole('heading', { name: 'Allowed by demo policy' })).toBeVisible();
  await lab.getByRole('combobox', { name: 'Input data', exact: true }).selectOption('Controlled');
  await lab.getByRole('button', { name: 'Run access simulation' }).click();
  await expect(lab.getByRole('heading', { name: 'Denied by demo policy' })).toBeVisible();
  await expect(lab.getByText(/does not permit Controlled data/).first()).toBeVisible();
  await lab.getByRole('combobox', { name: 'Input data', exact: true }).selectOption('Public');
  await lab.getByRole('combobox', { name: 'Requested action', exact: true }).selectOption('write:unapproved');
  await lab.getByRole('button', { name: 'Run access simulation' }).click();
  await expect(lab.getByText(/not approved for action write:unapproved/)).toBeVisible();
  await lab.getByRole('combobox', { name: 'Requested action', exact: true }).selectOption('read:metadata');
  await lab.getByRole('combobox', { name: 'Execution environment', exact: true }).selectOption('Unmanaged workstation');
  await lab.getByRole('button', { name: 'Run access simulation' }).click();
  await expect(lab.getByText(/not approved for the Unmanaged workstation environment/).first()).toBeVisible();
});

test('an upstream permission change suspends the connector and cohort workflow and denies subsequent use', async ({ page }) => {
  let lab = await openLab(page);
  await lab.getByRole('combobox', { name: 'Asset', exact: true }).selectOption('skill-cohort');
  await lab.getByRole('button', { name: 'Run access simulation' }).click();
  await expect(lab.getByRole('heading', { name: 'Allowed by demo policy' })).toBeVisible();
  await lab.getByRole('button', { name: 'Close lab' }).click();
  await page.getByRole('button', { name: 'Explore the change scenario' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Simulate upstream change' }).click();
  await page.getByRole('link', { name: 'Asset inventory', exact: true }).click();
  await expect(page.getByRole('button', { name: /^MCP servers/ })).toHaveAttribute('aria-pressed', 'true');
  const imaging = page.getByRole('row').filter({ hasText: 'Imaging Metadata Connector' });
  await expect(imaging.getByText('Suspended', { exact: true })).toBeVisible();
  await expect(imaging.getByText(/v1\.3\.0/)).toBeVisible();
  await expect(page.getByRole('row').filter({ hasText: 'Public Imaging Cohort Planner' })).toHaveCount(0);
  const literature = page.getByRole('row').filter({ hasText: 'Literature Search Connector' });
  await expect(literature.getByText('Approved', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /^Agent skills/ }).click();
  const cohort = page.getByRole('row').filter({ hasText: 'Public Imaging Cohort Planner' });
  await expect(cohort.getByText('Suspended', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /^All assets/ }).click();
  await expect(imaging.getByText('Suspended', { exact: true })).toBeVisible();
  await expect(cohort.getByText('Suspended', { exact: true })).toBeVisible();
  lab = await openLab(page);
  await lab.getByRole('combobox', { name: 'Asset', exact: true }).selectOption('skill-cohort');
  await lab.getByRole('button', { name: 'Run access simulation' }).click();
  await expect(lab.getByRole('heading', { name: 'Denied by demo policy' })).toBeVisible();
  await expect(lab.getByText(/Dependency Imaging Metadata Connector is suspended/)).toBeVisible();
});

test('the evidence download includes the simulated request and the export event', async ({ page }) => {
  const lab = await openLab(page);
  await lab.getByRole('combobox', { name: 'Input data', exact: true }).selectOption('Controlled');
  await lab.getByRole('button', { name: 'Run access simulation' }).click();
  await expect(lab.getByRole('heading', { name: 'Denied by demo policy' })).toBeVisible();
  await lab.getByRole('button', { name: 'Close lab' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export evidence', exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^steward-evidence-.*\.json$/);
  const downloadedPath = await download.path();
  expect(downloadedPath).not.toBeNull();
  const evidence = JSON.parse(await readFile(downloadedPath!, 'utf8'));
  expect(evidence).toMatchObject({ exportFormat: 'steward-demo-evidence-v1', simulationOnly: true, schemaVersion: 1 });
  expect(evidence.assets).toHaveLength(8);
  expect(evidence.audit).toEqual(expect.arrayContaining([
    expect.objectContaining({ action: 'Simulated access denied', assetId: 'mcp-imaging', category: 'access' }),
    expect.objectContaining({ action: 'Evidence bundle exported', category: 'system' }),
  ]));
});

test('a fictional MCP registration enters the queue and its server.json snapshot can be downloaded', async ({ page }) => {
  await page.getByRole('button', { name: 'Register MCP server', exact: true }).click();
  const registration = page.getByRole('dialog', { name: 'Register a demo asset' });
  await expect(registration.getByRole('combobox', { name: 'Asset type', exact: true })).toHaveValue('mcp');
  await expect(registration.getByRole('button', { name: 'Submit for review' })).toBeDisabled();
  await registration.getByLabel('Asset name', { exact: true }).fill('Synthetic Dataset Explorer');
  await registration.getByLabel('Accountable owner', { exact: true }).fill('Demo Research Steward');
  await registration.getByLabel('Intended use', { exact: true }).fill('Explore synthetic public dataset metadata for research planning.');
  await registration.getByRole('button', { name: 'Submit for review' }).click();
  await expect(page.getByRole('heading', { name: 'Synthetic Dataset Explorer', exact: true })).toBeVisible();
  await expect(page.getByText('Evidence pending review', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'View asset source and details' }).click();
  const record = page.getByRole('dialog', { name: 'Synthetic Dataset Explorer' });
  await expect(record.getByText('No active approval for this release', { exact: true })).toBeVisible();
  await record.getByRole('button', { name: 'Mock source' }).click();
  const downloadPromise = page.waitForEvent('download');
  await record.getByRole('button', { name: 'Download snapshot' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/-server\.json$/);
  const downloadedPath = await download.path();
  const source = await readFile(downloadedPath!, 'utf8');
  expect(JSON.parse(source)).toMatchObject({
    version: '0.1.0', simulationOnly: true,
    description: 'Explore synthetic public dataset metadata for research planning.',
  });
  await record.getByRole('button', { name: 'Close record' }).click();
  await page.getByRole('link', { name: 'Asset inventory', exact: true }).click();
  await page.getByRole('textbox', { name: 'Search assets', exact: true }).fill('Synthetic Dataset Explorer');
  const row = page.getByRole('row').filter({ hasText: 'Synthetic Dataset Explorer' });
  await expect(row.getByText(/MCP server/)).toBeVisible();
  await expect(row.getByText('In review', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: /Synthetic Dataset Explorer/ }).first()).toBeVisible();
});

test('mobile navigation and dialogs fit the viewport while wide inventory remains locally scrollable', async ({ page }, testInfo) => {
  await page.screenshot({ path: testInfo.outputPath('desktop-overview.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open navigation' })).toBeVisible();
  await expectNoPageOverflow(page);
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Asset inventory', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'MCP servers, accounted for.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close navigation', exact: true })).toHaveCount(0);
  await expect.poll(() => page.locator('.sidebar').evaluate((element) => element.getBoundingClientRect().right)).toBeLessThanOrEqual(1);
  await expectNoPageOverflow(page);
  const lab = await openLab(page);
  await expect(lab).toBeVisible();
  const bounds = await lab.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(391);
  await lab.getByRole('button', { name: 'Run access simulation' }).click();
  await expect(lab.getByRole('heading', { name: 'Allowed by demo policy' })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('mobile-simulation.png'), fullPage: true });
  await lab.getByRole('button', { name: 'Close lab' }).click();
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Overview', exact: true }).click();
  await expect.poll(() => page.locator('.sidebar').evaluate((element) => element.getBoundingClientRect().right)).toBeLessThanOrEqual(1);
  await expectNoPageOverflow(page);
  await page.screenshot({ path: testInfo.outputPath('mobile-overview.png'), fullPage: true });
});

async function expectNoPageOverflow(page: Page) {
  await expect.poll(
    () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
    { message: 'The page must fit its viewport after navigation transitions settle.' },
  ).toBe(true);
  const layout = await page.evaluate(() => ({
    width: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    overflow: [...document.querySelectorAll('main > *, .table-scroll, .inventory-tools, .table-toolbar')]
      .map((element) => ({ element: element.className, right: Math.round(element.getBoundingClientRect().right) }))
      .filter((element) => element.right > window.innerWidth + 1),
  }));
  expect(layout.scrollWidth, JSON.stringify(layout)).toBeLessThanOrEqual(layout.width + 1);
}
