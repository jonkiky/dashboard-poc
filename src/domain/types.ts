export type AssetType = 'mcp' | 'skill';
export type AssetStatus = 'approved' | 'in-review' | 'draft' | 'suspended' | 'rejected';
export type Risk = 'low' | 'moderate' | 'high';
export type DataClass = 'Public' | 'Internal' | 'Controlled';
export type ReviewCheckId = 'security' | 'privacy' | 'validation' | 'ownership';
export interface Evidence { id: string; title: string; detail: string; result: 'passed' | 'attention' | 'failed'; }
export interface Asset {
  id: string; name: string; subtitle: string; description: string; type: AssetType;
  owner: string; team: string; version: string; status: AssetStatus; risk: Risk;
  submittedAt: string; reviewDue: string; dataClass: DataClass; environment: string;
  permissions: string[]; destinations: string[]; dependencies: string[];
  evidence: Evidence[]; source: string; sourcePath: string; useCase: string;
  conditions: string[]; findings: string[];
}
export interface Approval {
  id: string; assetId: string; version: string; purpose: string; dataClass: DataClass;
  environment: string; allowedActions: string[]; conditions: string[];
  reviewedBy: string; reviewedAt: string; expiresAt: string; policyVersion: string;
  status: 'active' | 'invalidated';
}
export interface AuditEvent {
  id: string; timestamp: string; actor: string; action: string; assetId?: string;
  detail: string; category: 'review' | 'change' | 'access' | 'system';
}
export interface ReviewDraft { checks: Record<ReviewCheckId, boolean>; notes: string; }
export interface Incident {
  id: string; title: string; detail: string; assetIds: string[]; createdAt: string;
  severity: 'high' | 'moderate'; status: 'open' | 'resolved';
}
export interface GovernanceState {
  schemaVersion: 1; assets: Asset[]; approvals: Approval[]; audit: AuditEvent[];
  reviews: Record<string, ReviewDraft>; incidents: Incident[]; simulationUsed: boolean;
}
export interface PolicyCheck { id: string; label: string; description: string; status: 'pass' | 'warning' | 'fail'; }
export interface InvocationRequest { assetId: string; dataClass: DataClass; action: string; environment: string; }
export interface InvocationResult { allowed: boolean; reasons: string[]; approvalId?: string; }
export type View = 'overview' | 'inventory' | 'reviews' | 'policies' | 'audit';
