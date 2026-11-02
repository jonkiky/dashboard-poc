import { describe, expect, it } from 'vitest';
import { createSeedState } from '../data/seed';
import {
  POLICY_VERSION,
  decideReview,
  emptyReview,
  evaluateInvocation,
  getPolicyChecks,
  runInvocation,
  saveReview,
  simulateChange,
} from './engine';
import type { Approval, Asset, GovernanceState, InvocationRequest, ReviewDraft } from './types';

const NOW = new Date('2026-11-02T14:00:00.000Z');
const checkedReview = (): ReviewDraft => ({ checks: { security: true, privacy: true, validation: true, ownership: true }, notes: 'Evidence reviewed.' });

function asset(overrides: Partial<Asset> = {}): Asset {
  return {
    id: 'mcp-imaging', name: 'Imaging service', subtitle: 'Research discovery', description: 'A simulated imaging connector.',
    type: 'mcp', owner: 'Research steward', team: 'NCI imaging', version: '1.2.0', status: 'in-review', risk: 'moderate',
    submittedAt: NOW.toISOString(), reviewDue: '2027-01-01', dataClass: 'Internal', environment: 'NCI research enclave',
    permissions: ['read:imaging'], destinations: ['NCI internal storage'], dependencies: [],
    evidence: [{ id: 'scan', title: 'Package review', detail: 'Review fixture', result: 'passed' }],
    source: 'Internal repository', sourcePath: '/fixtures/imaging', useCase: 'Discover research images',
    conditions: ['Research use only'], findings: [], ...overrides,
  };
}

function approval(value: Asset, overrides: Partial<Approval> = {}): Approval {
  return {
    id: `approval-${value.id}`, assetId: value.id, version: value.version, purpose: value.useCase,
    dataClass: value.dataClass, environment: value.environment, allowedActions: [...value.permissions],
    conditions: [...value.conditions], reviewedBy: 'Reviewer', reviewedAt: NOW.toISOString(),
    expiresAt: '2027-06-01T00:00:00.000Z', policyVersion: POLICY_VERSION, status: 'active', ...overrides,
  };
}

function state(values: Asset[] = [asset()]): GovernanceState {
  return {
    schemaVersion: 1, assets: values,
    approvals: values.filter((value) => value.status === 'approved').map((value) => approval(value)),
    audit: [], reviews: Object.fromEntries(values.map((value) => [value.id, checkedReview()])),
    incidents: [], simulationUsed: false,
  };
}

const request = (overrides: Partial<InvocationRequest> = {}): InvocationRequest => ({
  assetId: 'mcp-imaging', action: 'read:imaging', dataClass: 'Internal', environment: 'NCI research enclave', ...overrides,
});

describe('policy and approval gates', () => {
  it('requires all reviewer checks before granting approval', () => {
    const original = state();
    original.reviews['mcp-imaging'] = emptyReview();
    expect(() => decideReview(original, 'mcp-imaging', 'approve', 'Reviewed all evidence.', 'Reviewer', NOW)).toThrow(/required review checks/);
    expect(original.approvals).toEqual([]);
  });

  it('requires a useful decision rationale and accountable actor', () => {
    expect(() => decideReview(state(), 'mcp-imaging', 'approve', 'OK', 'Reviewer', NOW)).toThrow(/at least 8/);
    expect(() => decideReview(state(), 'mcp-imaging', 'approve', 'Evidence reviewed.', ' ', NOW)).toThrow(/named reviewer/);
  });

  it('fails controlled data with an external destination even after a complete checklist', () => {
    const original = state([asset({ dataClass: 'Controlled', destinations: ['https://partner.example/internal'] })]);
    expect(getPolicyChecks(original.assets[0]).find((check) => check.id === 'data-boundary')?.status).toBe('fail');
    expect(() => decideReview(original, 'mcp-imaging', 'approve', 'Checklist completed.', 'Reviewer', NOW)).toThrow(/Controlled data/);
  });

  it('blocks failed evidence and incomplete ownership', () => {
    const badEvidence = asset({ evidence: [{ id: 'failed', title: 'Exfiltration evaluation', detail: 'Data was disclosed.', result: 'failed' }] });
    expect(() => decideReview(state([badEvidence]), badEvidence.id, 'approve', 'Checklist completed.', 'Reviewer', NOW)).toThrow(/Failed evidence/);
    expect(() => decideReview(state([asset({ owner: '' })]), 'mcp-imaging', 'approve', 'Checklist completed.', 'Reviewer', NOW)).toThrow(/accountable owner/);
  });

  it('keeps write privileges as a review warning rather than silently treating them as read-only', () => {
    const value = asset({ permissions: ['read:imaging', 'write:cohort'] });
    expect(getPolicyChecks(value).find((check) => check.id === 'least-privilege')?.status).toBe('warning');
    const updated = decideReview(state([value]), value.id, 'approve', 'Write scope validated.', 'Reviewer', NOW);
    expect(updated.approvals[0].allowedActions).toContain('write:cohort');
  });

  it.each(['draft', 'in-review', 'suspended'] as const)('can approve a %s asset after complete review', (status) => {
    const original = state([asset({ status })]);
    const snapshot = structuredClone(original);
    const updated = decideReview(original, 'mcp-imaging', 'approve', 'Evidence and scope reviewed.', 'Named reviewer', NOW);
    expect(updated.assets[0].status).toBe('approved');
    expect(updated.approvals[0]).toMatchObject({ assetId: 'mcp-imaging', version: '1.2.0', reviewedBy: 'Named reviewer', policyVersion: POLICY_VERSION, status: 'active' });
    expect(Date.parse(updated.approvals[0].expiresAt)).toBeGreaterThan(NOW.getTime());
    expect(updated.audit).toHaveLength(1);
    expect(original).toEqual(snapshot);
  });

  it('replaces an old active approval and permits rejection without passing unsafe content', () => {
    const value = asset({ status: 'approved', dataClass: 'Controlled', destinations: ['External vendor'] });
    const original = state([value]);
    original.reviews[value.id] = emptyReview();
    const updated = decideReview(original, value.id, 'reject', 'Unsafe controlled-data route.', 'Reviewer', NOW);
    expect(updated.assets[0].status).toBe('rejected');
    expect(updated.approvals[0].status).toBe('invalidated');
    expect(original.approvals[0].status).toBe('active');
  });

  it('saves an independent checklist copy without granting approval', () => {
    const original = state();
    const draft = checkedReview();
    const updated = saveReview(original, 'mcp-imaging', draft);
    draft.checks.security = false;
    expect(updated.reviews['mcp-imaging'].checks.security).toBe(true);
    expect(updated.approvals).toEqual([]);
    expect(updated.audit).toEqual([]);
    expect(original.audit).toEqual([]);
  });
});

describe('simulated invocation scope', () => {
  it('allows a matching approval and records the simulated access immutably', () => {
    const original = state([asset({ status: 'approved' })]);
    const snapshot = structuredClone(original);
    const { state: updated, result } = runInvocation(original, request(), 'Researcher', NOW);
    expect(result).toMatchObject({ allowed: true, approvalId: 'approval-mcp-imaging' });
    expect(updated.audit[0]).toMatchObject({ category: 'access', actor: 'Researcher', action: 'Simulated access allowed' });
    expect(original).toEqual(snapshot);
  });

  it.each([
    { dataClass: 'Controlled' as const },
    { environment: 'Personal laptop' },
    { action: 'write:cohort' },
  ])('denies a request outside approved scope: %j', (scope) => {
    const result = evaluateInvocation(state([asset({ status: 'approved' })]), request(scope), NOW);
    expect(result.allowed).toBe(false);
    expect(result.approvalId).toBeUndefined();
  });

  it('permits less sensitive data within the approved ceiling', () => {
    expect(evaluateInvocation(state([asset({ status: 'approved' })]), request({ dataClass: 'Public' }), NOW).allowed).toBe(true);
  });

  it.each([
    { status: 'invalidated' as const },
    { expiresAt: NOW.toISOString() },
    { version: '1.0.0' },
    { policyVersion: 'outdated-policy' },
  ])('denies stale or inactive approval: %j', (change) => {
    const original = state([asset({ status: 'approved' })]);
    original.approvals[0] = { ...original.approvals[0], ...change };
    expect(evaluateInvocation(original, request(), NOW).allowed).toBe(false);
  });

  it('does not allow a new permission to inherit an old approval', () => {
    const original = state([asset({ status: 'approved' })]);
    original.assets[0] = { ...original.assets[0], permissions: ['read:imaging', 'write:cohort'] };
    const result = evaluateInvocation(original, request(), NOW);
    expect(result.allowed).toBe(false);
    expect(result.reasons.join(' ')).toMatch(/permissions changed/);
  });

  it('denies missing dependencies, changed purpose, and dependency cycles', () => {
    const original = state([asset({ status: 'approved', dependencies: ['missing'] })]);
    expect(evaluateInvocation(original, request(), NOW).reasons.join(' ')).toMatch(/dependency missing is missing/);
    const changed = state([asset({ status: 'approved' })]);
    changed.assets[0] = { ...changed.assets[0], useCase: 'A different purpose' };
    expect(evaluateInvocation(changed, request(), NOW).reasons.join(' ')).toMatch(/intended use changed/);
    const circular = state([asset({ status: 'approved', dependencies: ['mcp-imaging'] })]);
    expect(evaluateInvocation(circular, request(), NOW).reasons.join(' ')).toMatch(/Dependency cycle/);
  });

  it('checks every recursive dependency and records denied attempts', () => {
    const leaf = asset({ id: 'leaf', status: 'approved' });
    const middle = asset({ id: 'middle', status: 'approved', dependencies: ['leaf'] });
    const root = asset({ status: 'approved', dependencies: ['middle'] });
    const original = state([root, middle, leaf]);
    original.approvals.find((value) => value.assetId === 'leaf')!.status = 'invalidated';
    const { result, state: updated } = runInvocation(original, request(), 'Researcher', NOW);
    expect(result.allowed).toBe(false);
    expect(result.reasons.join(' ')).toMatch(/Dependency.*no active/);
    expect(updated.audit[0].action).toBe('Simulated access denied');
  });
});

describe('dependency change containment', () => {
  it('suspends all approved dependents, revokes approvals, and leaves the prior state intact', () => {
    const imaging = asset({ status: 'approved' });
    const skill = asset({ id: 'skill-cohort', type: 'skill', status: 'approved', dependencies: ['mcp-imaging'] });
    const workflow = asset({ id: 'workflow', type: 'skill', status: 'approved', dependencies: ['skill-cohort'] });
    const unaffected = asset({ id: 'unrelated', status: 'approved' });
    const original = state([imaging, skill, workflow, unaffected]);
    const snapshot = structuredClone(original);
    const updated = simulateChange(original, 'Security reviewer', NOW);
    expect(updated.assets.find((value) => value.id === 'mcp-imaging')).toMatchObject({ version: '1.3.0', status: 'suspended', permissions: ['read:imaging', 'write:cohort'] });
    expect(updated.assets.filter((value) => value.id !== 'unrelated').every((value) => value.status === 'suspended')).toBe(true);
    expect(updated.assets.find((value) => value.id === 'unrelated')?.status).toBe('approved');
    expect(updated.approvals.filter((value) => value.assetId !== 'unrelated').every((value) => value.status === 'invalidated')).toBe(true);
    expect(updated.incidents[0]).toMatchObject({ severity: 'high', status: 'open', assetIds: ['mcp-imaging', 'skill-cohort', 'workflow'] });
    expect(updated.reviews['skill-cohort']).toEqual(emptyReview());
    expect(evaluateInvocation(updated, request({ assetId: 'workflow' }), NOW).allowed).toBe(false);
    expect(original).toEqual(snapshot);
    expect(simulateChange(updated, 'Security reviewer', NOW)).toBe(updated);
  });
});

describe('actual catalog integration', () => {
  it('permits every declared action for the seeded approved endpoints and workflows', () => {
    const original = createSeedState();
    const approved = original.assets.filter((value) => value.status === 'approved');
    expect(approved.map((value) => value.id)).toContain('skill-cohort');
    expect(approved.filter((value) => value.type === 'mcp')).toHaveLength(2);
    for (const value of approved) {
      for (const action of value.permissions) {
        expect(evaluateInvocation(original, { assetId: value.id, action, dataClass: value.dataClass, environment: value.environment }, NOW).allowed).toBe(true);
      }
    }
  });

  it('enables the literature skill only after its complete review and scoped decision', () => {
    const original = createSeedState();
    const invocation: InvocationRequest = { assetId: 'skill-literature', action: 'read:literature', dataClass: 'Public', environment: 'Research sandbox' };
    expect(evaluateInvocation(original, invocation, NOW).allowed).toBe(false);
    const draftSaved = saveReview(original, 'skill-literature', checkedReview());
    expect(draftSaved.audit).toEqual(original.audit);
    const approved = decideReview(draftSaved, 'skill-literature', 'approve', 'Synthetic public literature review complete.', 'Demo review team', NOW);
    expect(evaluateInvocation(approved, invocation, NOW).allowed).toBe(true);
    expect(approved.audit).toHaveLength(original.audit.length + 1);
    expect(original.assets.find((value) => value.id === 'skill-literature')?.status).toBe('in-review');
  });

  it('does not let completed attestations override the seeded clinical export blocker', () => {
    const original = saveReview(createSeedState(), 'mcp-clinical', checkedReview());
    expect(() => decideReview(original, 'mcp-clinical', 'approve', 'All attestations completed.', 'Demo review team', NOW)).toThrow(/Controlled data/);
  });

  it('contains the actual imaging change without disrupting the unrelated literature workflow', () => {
    const updated = simulateChange(createSeedState(), 'Demo security team', NOW);
    expect(evaluateInvocation(updated, { assetId: 'skill-cohort', action: 'read:metadata', dataClass: 'Public', environment: 'Research sandbox' }, NOW).allowed).toBe(false);
    expect(evaluateInvocation(updated, { assetId: 'skill-reproducibility', action: 'read:literature', dataClass: 'Public', environment: 'Research sandbox' }, NOW).allowed).toBe(true);
    const checked = saveReview(updated, 'mcp-imaging', checkedReview());
    expect(() => decideReview(checked, 'mcp-imaging', 'approve', 'Existing checks are all completed.', 'Demo reviewer', NOW)).toThrow(/New release validation missing/);
  });
});
