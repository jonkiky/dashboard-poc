import type {
  Approval,
  Asset,
  AuditEvent,
  DataClass,
  GovernanceState,
  InvocationRequest,
  InvocationResult,
  PolicyCheck,
  ReviewCheckId,
  ReviewDraft,
} from './types';

export const POLICY_VERSION = 'NCI-POC-2026.11';

export const REVIEW_CHECKS: { id: ReviewCheckId; label: string; description: string }[] = [
  { id: 'security', label: 'Security review', description: 'Review the complete package, permissions, dependencies, and network destinations.' },
  { id: 'privacy', label: 'Data and privacy boundary', description: 'Confirm the permitted data, purpose, users, and destination boundary.' },
  { id: 'validation', label: 'Workflow validation', description: 'Confirm evaluation evidence for this version and its intended environment.' },
  { id: 'ownership', label: 'Accountable owner', description: 'Confirm a responsible owner, maintenance plan, and review conditions.' },
];

const DATA_LEVEL: Record<DataClass, number> = { Public: 0, Internal: 1, Controlled: 2 };
const meaningful = (value: string) => value.trim().length > 0;
const unique = (values: string[]) => [...new Set(values)];
const id = (prefix: string) => `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;

function getAsset(state: GovernanceState, assetId: string): Asset {
  const asset = state.assets.find((item) => item.id === assetId);
  if (!asset) throw new Error('This asset could not be found. Refresh the catalog and try again.');
  return asset;
}

// This is a deliberately conservative demo boundary, not real endpoint discovery.
function isExternalDestination(destination: string): boolean {
  const value = destination.trim().toLowerCase();
  if (/\b(external|public internet|third[- ]party|vendor)\b/.test(value)) return true;
  try {
    const hostname = new URL(value).hostname;
    return !(hostname === 'nih.gov' || hostname.endsWith('.nih.gov') || hostname.endsWith('.internal') || hostname === 'localhost');
  } catch {
    if (/\b(internal|enclave|localhost|loopback)\b/.test(value)) return false;
    // Unknown destinations are outside the demonstrated controlled-data boundary.
    return true;
  }
}

export function getPolicyChecks(asset: Asset): PolicyCheck[] {
  const ownerComplete = meaningful(asset.owner) && meaningful(asset.team);
  const scopeComplete = meaningful(asset.environment) && meaningful(asset.useCase)
    && asset.destinations.length > 0 && asset.destinations.every(meaningful);
  const external = asset.destinations.some(isExternalDestination);
  const controlledExternal = asset.dataClass === 'Controlled' && external;
  const writes = asset.permissions.filter((permission) => !/^(read|list|search|discover)(:|$)/i.test(permission));
  const failedEvidence = asset.evidence.filter((evidence) => evidence.result === 'failed');
  const pendingEvidence = asset.evidence.some((evidence) => evidence.result === 'attention') || asset.evidence.length === 0;
  return [
    { id: 'owner', label: 'Accountable ownership', status: ownerComplete ? 'pass' : 'fail', description: ownerComplete ? `${asset.owner} owns this asset for ${asset.team}.` : 'An accountable owner and owning team are required.' },
    { id: 'scope', label: 'Defined use and environment', status: scopeComplete ? 'pass' : 'fail', description: scopeComplete ? `Use is scoped to ${asset.environment} and declared destinations.` : 'Specify the use case, environment, and destination boundary.' },
    { id: 'data-boundary', label: 'Controlled-data boundary', status: controlledExternal ? 'fail' : 'pass', description: controlledExternal ? 'Controlled data cannot be sent to an external or unverified destination under this demonstration policy.' : 'No prohibited controlled-data destination is declared.' },
    { id: 'least-privilege', label: 'Least privilege', status: asset.permissions.length === 0 ? 'fail' : writes.length ? 'warning' : 'pass', description: asset.permissions.length === 0 ? 'Declare at least one permitted action.' : writes.length ? `Additional review is needed for actions beyond read-only access: ${writes.join(', ')}.` : 'Declared actions are limited to read-only access.' },
    { id: 'evidence', label: 'Review evidence', status: failedEvidence.length ? 'fail' : pendingEvidence ? 'warning' : 'pass', description: failedEvidence.length ? `Failed evidence must be resolved: ${failedEvidence.map((evidence) => evidence.title).join(', ')}.` : pendingEvidence ? 'Evidence needs reviewer attention; record any conditions in the decision.' : 'All supplied evidence checks passed.' },
  ];
}

export function emptyReview(): ReviewDraft {
  return { checks: { security: false, privacy: false, validation: false, ownership: false }, notes: '' };
}

function audit(actor: string, action: string, detail: string, category: AuditEvent['category'], assetId: string | undefined, now: Date): AuditEvent {
  return { id: id('audit'), timestamp: now.toISOString(), actor, action, detail, category, ...(assetId ? { assetId } : {}) };
}

export function saveReview(state: GovernanceState, assetId: string, draft: ReviewDraft): GovernanceState {
  getAsset(state, assetId);
  const saved: ReviewDraft = { checks: { ...draft.checks }, notes: draft.notes };
  return {
    ...state,
    reviews: { ...state.reviews, [assetId]: saved },
  };
}

export function decideReview(
  state: GovernanceState,
  assetId: string,
  decision: 'approve' | 'reject',
  comment: string,
  actor: string,
  now = new Date(),
): GovernanceState {
  const asset = getAsset(state, assetId);
  const rationale = comment.trim();
  if (rationale.length < 8) throw new Error('Add a decision rationale of at least 8 characters.');
  if (!meaningful(actor)) throw new Error('A named reviewer is required to record a decision.');
  if (decision === 'approve') {
    const review = state.reviews[assetId] ?? emptyReview();
    const incomplete = REVIEW_CHECKS.filter((check) => !review.checks[check.id]);
    if (incomplete.length) throw new Error(`Complete all required review checks before approval: ${incomplete.map((check) => check.label).join(', ')}.`);
    const failures = getPolicyChecks(asset).filter((check) => check.status === 'fail');
    if (failures.length) throw new Error(`Approval is blocked by policy: ${failures.map((check) => check.description).join(' ')}`);
  }
  const approvals = state.approvals.map((approval): Approval => approval.assetId === assetId && approval.status === 'active' ? { ...approval, status: 'invalidated' } : approval);
  if (decision === 'approve') {
    approvals.unshift({
      id: id('approval'), assetId, version: asset.version, purpose: asset.useCase,
      dataClass: asset.dataClass, environment: asset.environment,
      allowedActions: [...asset.permissions], conditions: [...asset.conditions],
      reviewedBy: actor.trim(), reviewedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      policyVersion: POLICY_VERSION, status: 'active',
    });
  }
  return {
    ...state,
    assets: state.assets.map((item) => item.id === assetId ? { ...item, status: decision === 'approve' ? 'approved' : 'rejected' } : item),
    approvals,
    reviews: { ...state.reviews, [assetId]: { checks: { ...(state.reviews[assetId] ?? emptyReview()).checks }, notes: rationale } },
    audit: [audit(actor.trim(), decision === 'approve' ? 'Scoped approval granted' : 'Asset rejected', `${asset.name} ${asset.version}: ${rationale}`, 'review', assetId, now), ...state.audit],
  };
}

export function evaluateInvocation(state: GovernanceState, request: InvocationRequest, now = new Date()): InvocationResult {
  const reasons: string[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();
  let rootApproval: Approval | undefined;

  function inspect(assetId: string, isRoot: boolean) {
    if (visiting.has(assetId)) { reasons.push(`Dependency cycle detected at ${assetId}.`); return; }
    if (visited.has(assetId)) return;
    visited.add(assetId);
    visiting.add(assetId);
    const asset = state.assets.find((item) => item.id === assetId);
    if (!asset) { reasons.push(`Required ${isRoot ? 'asset' : 'dependency'} ${assetId} is missing.`); visiting.delete(assetId); return; }
    const prefix = isRoot ? asset.name : `Dependency ${asset.name}`;
    if (asset.status !== 'approved') reasons.push(`${prefix} is ${asset.status}; an approved asset is required.`);
    const candidates = state.approvals.filter((approval) => approval.assetId === assetId && approval.status === 'active' && approval.version === asset.version);
    const approval = candidates.find((candidate) => Number.isFinite(Date.parse(candidate.expiresAt)) && Date.parse(candidate.expiresAt) > now.getTime());
    if (!approval) reasons.push(`${prefix} has no active, unexpired approval for version ${asset.version}.`);
    else {
      if (isRoot) rootApproval = approval;
      if (approval.policyVersion !== POLICY_VERSION) reasons.push(`${prefix} approval uses an outdated policy version.`);
      if (approval.purpose !== asset.useCase) reasons.push(`${prefix} intended use changed beyond its approval.`);
      if (DATA_LEVEL[request.dataClass] > DATA_LEVEL[approval.dataClass] || DATA_LEVEL[request.dataClass] > DATA_LEVEL[asset.dataClass]) reasons.push(`${prefix} does not permit ${request.dataClass} data.`);
      if (request.environment !== approval.environment || request.environment !== asset.environment) reasons.push(`${prefix} is not approved for the ${request.environment} environment.`);
      const unapproved = asset.permissions.filter((permission) => !approval.allowedActions.includes(permission));
      if (unapproved.length) reasons.push(`${prefix} permissions changed beyond its approval: ${unapproved.join(', ')}.`);
      if (isRoot && (!approval.allowedActions.includes(request.action) || !asset.permissions.includes(request.action))) reasons.push(`${prefix} is not approved for action ${request.action}.`);
    }
    const failures = getPolicyChecks(asset).filter((check) => check.status === 'fail');
    failures.forEach((check) => reasons.push(`${prefix}: ${check.description}`));
    asset.dependencies.forEach((dependency) => inspect(dependency, false));
    visiting.delete(assetId);
  }
  inspect(request.assetId, true);
  return reasons.length ? { allowed: false, reasons: unique(reasons) } : {
    allowed: true,
    reasons: ['The asset version, declared actions, data boundary, environment, and recursive dependency approvals satisfy the demonstration policy.'],
    ...(rootApproval ? { approvalId: rootApproval.id } : {}),
  };
}

export function runInvocation(state: GovernanceState, request: InvocationRequest, actor: string, now = new Date()): { state: GovernanceState; result: InvocationResult } {
  const result = evaluateInvocation(state, request, now);
  const entry = audit(actor.trim() || 'Current user', result.allowed ? 'Simulated access allowed' : 'Simulated access denied', `${request.action}; ${request.dataClass}; ${request.environment}. ${result.reasons.join(' ')}`, 'access', request.assetId, now);
  return { state: { ...state, audit: [entry, ...state.audit] }, result };
}

export function simulateChange(state: GovernanceState, actor: string, now = new Date()): GovernanceState {
  if (state.simulationUsed) return state;
  const target = getAsset(state, 'mcp-imaging');
  const downstream = new Set<string>([target.id]);
  let added = true;
  while (added) {
    added = false;
    state.assets.forEach((asset) => {
      if (!downstream.has(asset.id) && asset.dependencies.some((dependency) => downstream.has(dependency))) {
        downstream.add(asset.id);
        added = true;
      }
    });
  }
  const affected = state.assets.filter((asset) => asset.id === target.id || (downstream.has(asset.id) && asset.status === 'approved')).map((asset) => asset.id);
  const affectedSet = new Set(affected);
  const detail = `Simulated change: ${target.name} ${target.version} → 1.3.0 adds write:cohort. Existing approvals and ${affected.length - 1} approved dependent asset(s) are suspended pending reassessment. No live MCP service was changed.`;
  return {
    ...state,
    simulationUsed: true,
    assets: state.assets.map((asset) => affectedSet.has(asset.id) ? {
      ...asset,
      ...(asset.id === target.id ? {
        version: '1.3.0', permissions: unique([...asset.permissions, 'write:cohort']),
        evidence: [...asset.evidence, {
          id: 'changed-release-validation', title: 'New release validation missing',
          detail: 'The bundled review package covers version 1.2.0. Version 1.3.0 and its write permission require new validation evidence; checkbox attestations cannot replace it.',
          result: 'failed' as const,
        }],
      } : {}),
      status: 'suspended',
      findings: unique([...asset.findings, asset.id === target.id ? 'Version 1.3.0 adds write:cohort; reassessment is required.' : 'An approved dependency changed; reassessment is required.']),
    } : asset),
    approvals: state.approvals.map((approval): Approval => downstream.has(approval.assetId) && approval.status === 'active' ? { ...approval, status: 'invalidated' } : approval),
    reviews: { ...state.reviews, ...Object.fromEntries(affected.map((assetId) => [assetId, emptyReview()])) },
    incidents: [{ id: id('incident'), title: 'Permission change suspended dependent assets', detail, assetIds: affected, createdAt: now.toISOString(), severity: 'high', status: 'open' }, ...state.incidents],
    audit: [audit(actor.trim() || 'Current user', 'Dependency change contained', detail, 'change', target.id, now), ...state.audit],
  };
}
