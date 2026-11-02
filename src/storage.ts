import { createSeedState } from './data/seed';
import type { Asset, GovernanceState } from './domain/types';

export const STORAGE_KEY = 'steward-governance-demo-v1';
export const SEED_PRESENTATION_REVISION = 'mcp-review-ready-2026.11';

/** Add the revised synthetic MCP example only when its old seed is wholly untouched. */
export function migrateSeedPresentation(state: GovernanceState, now = new Date()): GovernanceState {
  const assetId = 'mcp-labfiles';
  const auditId = `seed-presentation-${SEED_PRESENTATION_REVISION}`;
  if (state.audit.some((event) => event.id === auditId)) return state;
  const current = state.assets.find((asset) => asset.id === assetId);
  if (!current || current.status !== 'draft' || current.version !== '0.1.0'
    || state.approvals.some((approval) => approval.assetId === assetId && approval.status === 'active')) return state;
  const review = state.reviews[assetId];
  if (review && (!review.checks || review.notes !== ''
    || Object.values(review.checks).some((checked) => checked !== false)
    || Object.keys(review.checks).sort().join(',') !== 'ownership,privacy,security,validation')) return state;

  const prepared = createSeedState().assets.find((asset) => asset.id === assetId)!;
  const oldSource = JSON.parse(prepared.source) as { description: string };
  oldSource.description = 'Draft local file-metadata listing scenario. Synthetic demonstration package; no real service is deployed.';
  const legacy: Asset = {
    ...prepared,
    subtitle: 'Workspace metadata · MCP server',
    description: 'An early draft connector for listing metadata of synthetic files in a local laboratory workspace.',
    status: 'draft',
    evidence: [
      { id: 'labfiles-ownership', title: 'Intake not submitted', detail: 'The illustrative owner is still preparing the permission and maintenance statements.', result: 'attention' },
      { id: 'labfiles-validation', title: 'Validation not supplied', detail: 'No simulated connector contract evaluation has been attached yet.', result: 'attention' },
    ],
    source: `${JSON.stringify(oldSource, null, 2)}\n`,
    useCase: 'Explore synthetic local workspace file metadata during product discovery.',
    conditions: ['Draft asset is unavailable for approved use.', 'File contents and unrestricted paths are outside this scenario.'],
    findings: ['Complete metadata, evidence, and ownership statements before submitting for review.'],
  };
  // Exact field comparison preserves edits to any part of the original package or scope.
  if (Object.keys(current).length !== Object.keys(legacy).length
    || (Object.keys(legacy) as (keyof Asset)[]).some((key) => JSON.stringify(current[key]) !== JSON.stringify(legacy[key]))) return state;

  return {
    ...state,
    assets: state.assets.map((asset) => asset.id === assetId ? prepared : asset),
    audit: [{
      id: auditId,
      timestamp: now.toISOString(),
      actor: 'Demo workspace',
      action: 'Synthetic MCP example prepared',
      assetId,
      detail: 'Updated the untouched Lab Workspace File Index seed to a review-ready, metadata-only MCP example. Existing decisions, other assets, and audit history were preserved. This is a synthetic presentation update, not an approval.',
      category: 'system',
    }, ...state.audit],
  };
}

export function loadState(): { state: GovernanceState; warning?: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { state: createSeedState() };
    const parsed = JSON.parse(raw) as GovernanceState;
    if (parsed.schemaVersion !== 1 || !Array.isArray(parsed.assets) || !Array.isArray(parsed.approvals)
      || !Array.isArray(parsed.audit) || !Array.isArray(parsed.incidents) || !parsed.reviews
      || typeof parsed.simulationUsed !== 'boolean'
      || parsed.assets.some(a => !a.id || !a.name || !Array.isArray(a.permissions) || !Array.isArray(a.evidence)
        || !Array.isArray(a.dependencies) || !Array.isArray(a.destinations) || !Array.isArray(a.conditions) || !Array.isArray(a.findings))) {
      throw new Error('Invalid demo snapshot');
    }
    return { state: migrateSeedPresentation(parsed) };
  } catch {
    return { state: createSeedState(), warning: 'Saved demo data could not be loaded. A fresh synthetic workspace is ready.' };
  }
}
