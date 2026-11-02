import { describe, expect, it } from 'vitest';
import { createSeedState } from './data/seed';
import { decideReview, simulateChange } from './domain/engine';
import type { Asset, GovernanceState } from './domain/types';
import { migrateSeedPresentation, SEED_PRESENTATION_REVISION } from './storage';

const NOW = new Date('2026-11-02T16:00:00.000Z');
const ASSET_ID = 'mcp-labfiles';

/** The original persisted draft, before the MCP-first presentation update. */
function legacyState(): GovernanceState {
  const state = createSeedState();
  const prepared = state.assets.find((asset) => asset.id === ASSET_ID)!;
  const source = JSON.parse(prepared.source) as { description: string };
  source.description = 'Draft local file-metadata listing scenario. Synthetic demonstration package; no real service is deployed.';
  const legacy: Asset = {
    ...prepared,
    subtitle: 'Workspace metadata · MCP server',
    description: 'An early draft connector for listing metadata of synthetic files in a local laboratory workspace.',
    status: 'draft',
    evidence: [
      { id: 'labfiles-ownership', title: 'Intake not submitted', detail: 'The illustrative owner is still preparing the permission and maintenance statements.', result: 'attention' },
      { id: 'labfiles-validation', title: 'Validation not supplied', detail: 'No simulated connector contract evaluation has been attached yet.', result: 'attention' },
    ],
    source: `${JSON.stringify(source, null, 2)}\n`,
    useCase: 'Explore synthetic local workspace file metadata during product discovery.',
    conditions: ['Draft asset is unavailable for approved use.', 'File contents and unrestricted paths are outside this scenario.'],
    findings: ['Complete metadata, evidence, and ownership statements before submitting for review.'],
  };
  state.assets = state.assets.map((asset) => asset.id === ASSET_ID ? legacy : asset);
  state.audit = state.audit.filter((event) => event.id !== 'audit-seed-labfiles-submitted');
  return state;
}

describe('additive seed presentation migration', () => {
  it('prepares the untouched legacy MCP draft once without granting approval', () => {
    const original = legacyState();
    const snapshot = structuredClone(original);
    const migrated = migrateSeedPresentation(original, NOW);
    const expected = createSeedState().assets.find((asset) => asset.id === ASSET_ID);

    expect(migrated.schemaVersion).toBe(1);
    expect(migrated.assets.find((asset) => asset.id === ASSET_ID)).toEqual(expected);
    expect(migrated.approvals.filter((approval) => approval.assetId === ASSET_ID)).toEqual([]);
    expect(migrated.audit[0]).toMatchObject({
      id: `seed-presentation-${SEED_PRESENTATION_REVISION}`,
      assetId: ASSET_ID,
      timestamp: NOW.toISOString(),
      category: 'system',
    });
    expect(migrateSeedPresentation(migrated, NOW)).toBe(migrated);
    expect(original).toEqual(snapshot);
  });

  it('preserves other user decisions, asset edits, incidents, reviews, and audit history', () => {
    let original = simulateChange(legacyState(), 'User security reviewer', NOW);
    original.assets.find((asset) => asset.id === 'skill-protocol')!.owner = 'User-selected owner';
    original.reviews['skill-literature'] = {
      checks: { security: true, privacy: true, validation: true, ownership: true },
      notes: 'User review notes to retain.',
    };
    original = decideReview(original, 'skill-literature', 'approve', 'User approved the public literature scope.', 'User reviewer', NOW);
    const snapshot = structuredClone(original);
    const migrated = migrateSeedPresentation(original, NOW);

    expect(migrated.assets.filter((asset) => asset.id !== ASSET_ID)).toEqual(snapshot.assets.filter((asset) => asset.id !== ASSET_ID));
    expect(migrated.approvals).toEqual(snapshot.approvals);
    expect(migrated.reviews).toEqual(snapshot.reviews);
    expect(migrated.incidents).toEqual(snapshot.incidents);
    expect(migrated.simulationUsed).toBe(snapshot.simulationUsed);
    expect(migrated.audit.slice(1)).toEqual(snapshot.audit);
    expect(original).toEqual(snapshot);
  });

  it('leaves a modified draft untouched, including package or scope edits', () => {
    const changes: Partial<Asset>[] = [
      { owner: 'User-selected owner' },
      { permissions: ['read:file-metadata', 'read:contents'] },
      { source: '{"userEdited":true}' },
      { dataClass: 'Controlled' },
    ];
    for (const change of changes) {
      const original = legacyState();
      Object.assign(original.assets.find((asset) => asset.id === ASSET_ID)!, change);
      const snapshot = structuredClone(original);
      expect(migrateSeedPresentation(original, NOW)).toBe(original);
      expect(original).toEqual(snapshot);
    }
  });

  it('does not replace a draft with a saved attestation or reviewer notes', () => {
    const withCheck = legacyState();
    withCheck.reviews[ASSET_ID].checks.security = true;
    expect(migrateSeedPresentation(withCheck, NOW)).toBe(withCheck);

    const withNotes = legacyState();
    withNotes.reviews[ASSET_ID].notes = 'User started reviewing this specific draft.';
    expect(migrateSeedPresentation(withNotes, NOW)).toBe(withNotes);
  });

  it('does not replace a draft that already has an active approval record', () => {
    const original = legacyState();
    const labfiles = original.assets.find((asset) => asset.id === ASSET_ID)!;
    original.approvals.push({
      ...original.approvals[0],
      id: 'user-labfiles-approval',
      assetId: ASSET_ID,
      version: labfiles.version,
      purpose: labfiles.useCase,
      dataClass: labfiles.dataClass,
      environment: labfiles.environment,
      allowedActions: [...labfiles.permissions],
      reviewedBy: 'User reviewer',
      status: 'active',
    });
    const snapshot = structuredClone(original);
    expect(migrateSeedPresentation(original, NOW)).toBe(original);
    expect(original).toEqual(snapshot);
  });
});
