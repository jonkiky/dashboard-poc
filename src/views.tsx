import { useState } from 'react';
import { ArrowDownToLine, ArrowRight, ArrowUpRight, Check, CheckCircle2, ChevronRight, ClipboardCheck, Clock3, FileCheck2, FileCode2, GitBranch, History, Info, Layers3, ListFilter, LockKeyhole, Search, Server, ShieldAlert, ShieldCheck, TriangleAlert, Users, XCircle } from 'lucide-react';
import { AssetIcon, EmptyState, RiskBadge, StatusBadge, formatDate } from './components';
import { REVIEW_CHECKS, emptyReview, getPolicyChecks, POLICY_VERSION } from './domain/engine';
import type { AssetType, GovernanceState, ReviewDraft, View } from './domain/types';

type Navigate = (view: View) => void;
export function Overview({ state, onNavigate, onAsset, onReview, onChange, onOpenSkills }: {
  state: GovernanceState; onNavigate: Navigate; onAsset: (id: string) => void; onReview: (id: string) => void; onChange: () => void; onOpenSkills: () => void;
}) {
  const servers = state.assets.filter(a => a.type === 'mcp');
  const skills = state.assets.filter(a => a.type === 'skill');
  const approved = servers.filter(a => a.status === 'approved' && state.approvals.some(p => p.assetId === a.id && p.version === a.version && p.status === 'active' && new Date(p.expiresAt) > new Date())).length;
  const pending = servers.filter(a => a.status === 'in-review' || a.status === 'suspended');
  const attention = servers.filter(a => a.status === 'suspended' || getPolicyChecks(a).some(p => p.status === 'fail'));
  const riskCounts = { low: servers.filter(a => a.risk === 'low').length, moderate: servers.filter(a => a.risk === 'moderate').length, high: servers.filter(a => a.risk === 'high').length };
  const total = servers.length;
  const lowEnd = total ? riskCounts.low / total * 100 : 0;
  const moderateEnd = total ? (riskCounts.low + riskCounts.moderate) / total * 100 : 0;
  return <>
    <section className="welcome-banner">
      <div className="welcome-copy"><span className="eyebrow">MCP GOVERNANCE · FIRST PRIORITY</span><h2>Trusted MCP servers.<br />Tools with clear boundaries.</h2>
        <p>Review server releases, govern tool permissions,<br className="desktop-break" /> and see the impact when a capability changes.</p>
        <button className="text-button" onClick={onChange}>{state.simulationUsed ? 'Inspect the change scenario' : 'Explore the change scenario'}<ArrowRight size={16} /></button></div>
      <div className="governance-visual" aria-label="Governance lifecycle: register, assess, approve, monitor">
        <div className="visual-orbit orbit-one" /><div className="visual-orbit orbit-two" />
        <div className="visual-center"><ShieldCheck size={38} strokeWidth={1.3} /><span>GOVERNED<br />BY DESIGN</span></div>
        <div className="visual-node node-register"><Layers3 size={17} /><span>Register</span><Check size={13} /></div>
        <div className="visual-node node-assess"><ClipboardCheck size={17} /><span>Assess</span><Check size={13} /></div>
        <div className="visual-node node-approve"><FileCheck2 size={17} /><span>Approve</span><Check size={13} /></div>
        <div className="visual-node node-monitor"><GitBranch size={17} /><span>Monitor</span><span className="live-dot" /></div>
      </div>
    </section>
    <section className="metric-grid" aria-label="MCP governance metrics">
      {[
        { label: 'MCP servers', value: total, sub: 'Primary governance scope', Icon: Server, color: 'sage' },
        { label: 'Approved MCP servers', value: approved, sub: 'Current release, defined conditions', Icon: ShieldCheck, color: 'green' },
        { label: 'MCP reviews', value: pending.length, sub: 'Servers awaiting a scoped decision', Icon: ClipboardCheck, color: 'blue' },
        { label: 'MCP attention', value: attention.length, sub: state.simulationUsed ? 'Includes the changed server' : 'Data boundary requires review', Icon: ShieldAlert, color: 'amber' },
      ].map(({ label, value, sub, Icon, color }) => <div className="metric-card" key={label}><div className="metric-label">{label}<span className={`metric-icon ${color}`}><Icon size={17} /></span></div><strong>{value.toString().padStart(2, '0')}</strong><p>{sub}</p></div>)}
    </section>
    <section className="secondary-scope" aria-label="Secondary scope: agent skills"><AssetIcon type="skill" /><div><strong>Agent skills <span className="priority-label">Secondary</span></strong><p>{skills.length} skills remain available for review and MCP dependency oversight.</p></div><button className="text-button" onClick={onOpenSkills}>View agent skills<ArrowRight size={14} /></button></section>
    {state.incidents.filter(i => i.status === 'open').map(i => <div className="incident-banner" key={i.id}><TriangleAlert size={21} /><div><strong>{i.title}</strong><p>{i.detail}</p></div><button className="button small" onClick={() => onReview(i.assetIds[0])}>Review impact<ArrowRight size={14} /></button></div>)}
    <div className="dashboard-grid">
      <section className="panel review-panel"><div className="panel-heading"><div><h2>MCP review queue <span className="count-pill">{pending.length}</span></h2><p>Server releases and tool permissions needing a decision.</p></div><button className="text-button muted" onClick={() => onNavigate('reviews')}>View reviews<ArrowUpRight size={15} /></button></div>
        {pending.length ? <div className="queue-list">{pending.slice(0, 3).map(a => <button className="queue-item" key={a.id} onClick={() => onReview(a.id)}><AssetIcon type={a.type} /><div className="queue-info"><strong>{a.name}</strong><span>{a.team} <span className="separator">·</span> MCP server</span></div><div className="queue-meta"><RiskBadge risk={a.risk} /><span>{a.status === 'suspended' ? 'Change review' : 'Ready for assessment'}</span></div><ChevronRight size={16} /></button>)}</div> : <EmptyState title="MCP reviews complete">Every submitted MCP server has a recorded decision.</EmptyState>}
        <div className="panel-footer"><span className="live-dot" />Decisions include purpose, data, and deployment scope.</div>
      </section>
      <section className="panel risk-panel"><div className="panel-heading"><div><h2>MCP server risk</h2><p>Inherent risk across registered MCP servers.</p></div><span className="subtle-icon"><ShieldCheck size={18} /></span></div>
        <div className="risk-chart-wrap"><div className="risk-donut" role="img" aria-label={`${riskCounts.low} low, ${riskCounts.moderate} moderate, ${riskCounts.high} high risk MCP servers`} style={{ background: `conic-gradient(#598873 0% ${lowEnd}%, #e2b765 ${lowEnd}% ${moderateEnd}%, #c67e70 ${moderateEnd}% 100%)` }}><div><strong>{total}</strong><span>MCP servers</span></div></div>
          <div className="risk-legend">{(['low', 'moderate', 'high'] as const).map(r => <div key={r}><span className={`legend-dot ${r}`} /><span>{r[0].toUpperCase() + r.slice(1)}</span><strong>{riskCounts[r]}</strong></div>)}</div></div>
        <div className="risk-note"><Info size={15} /><span>Risk informs review depth. Approval is specific to use.</span></div>
      </section>
    </div>
    <section className="panel activity-panel"><div className="panel-heading"><div><h2>Recent MCP governance activity</h2><p>Server decisions and changes, with evidence close at hand.</p></div><button className="text-button muted" onClick={() => onNavigate('audit')}>Open audit trail<ArrowUpRight size={15} /></button></div>
      <div className="activity-list">{state.audit.filter(event => !event.assetId || servers.some(a => a.id === event.assetId)).slice(0, 4).map(event => <div className="activity-row" key={event.id}><span className={`activity-symbol ${event.category}`}><History size={15} /></span><div><strong>{event.action}</strong><p>{event.detail}</p></div><div className="activity-right">{event.assetId && <button className="inline-link" onClick={() => onAsset(event.assetId!)}>View asset</button>}<time>{formatDate(event.timestamp, true)}</time></div></div>)}</div>
    </section>
    <div className="value-strip"><span><Users size={17} />Accountable owners</span><span><FileCheck2 size={17} />Evidence-backed decisions</span><span><GitBranch size={17} />Visibility into change</span><span className="value-label">Built for the system owner</span></div>
  </>;
}

export function Inventory({ state, search, setSearch, type, setType, onAsset, onRegister }: {
  state: GovernanceState; search: string; setSearch: (value: string) => void; type: AssetType | 'all'; setType: (value: AssetType | 'all') => void; onAsset: (id: string) => void; onRegister: () => void;
}) {
  const [status, setStatus] = useState('all');
  const assets = state.assets.filter(a => (type === 'all' || a.type === type) && (status === 'all' || a.status === status)
    && `${a.name} ${a.owner} ${a.team} ${a.useCase}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => Number(b.type === 'mcp') - Number(a.type === 'mcp'));
  return <section className="panel inventory-panel"><div className="inventory-tools"><div className="tabs" aria-label="Asset type filter">{([['mcp', 'MCP servers'], ['skill', 'Agent skills'], ['all', 'All assets']] as const).map(([value, label]) => <button key={value} aria-pressed={type === value} className={type === value ? 'active' : ''} onClick={() => setType(value)}>{label}<span>{value === 'all' ? state.assets.length : state.assets.filter(a => a.type === value).length}</span>{value === 'skill' && <small className="tab-secondary-label">Secondary</small>}</button>)}</div><button className="text-button" onClick={onRegister}>Register MCP server<ArrowRight size={15} /></button></div>
    {type === 'skill' && <div className="inventory-scope-note"><Info size={15} />Secondary scope: skills share the review workflow and retain their MCP dependency checks.</div>}
    <div className="table-toolbar"><label className="search-input"><Search size={17} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, owner, or purpose…" aria-label="Search assets" /></label><label className="select-label"><ListFilter size={16} /><select aria-label="Filter by status" value={status} onChange={e => setStatus(e.target.value)}><option value="all">All statuses</option><option value="approved">Approved</option><option value="in-review">In review</option><option value="suspended">Suspended</option><option value="draft">Draft</option><option value="rejected">Rejected</option></select></label><span className="result-count">{assets.length} assets</span></div>
    <div className="table-scroll"><table className="asset-table"><thead><tr><th>Asset / release</th><th>Accountable owner</th><th>Data boundary</th><th>Risk</th><th>Status</th><th><span className="sr-only">Details</span></th></tr></thead><tbody>{assets.map(a => <tr key={a.id}><td><button className="asset-name" onClick={() => onAsset(a.id)}><AssetIcon type={a.type} /><span><strong>{a.name}</strong><small>{a.type === 'mcp' ? 'MCP server' : 'Agent skill'} <span className="separator">·</span> v{a.version}</small></span></button></td><td><span className="table-owner">{a.owner}</span><small>{a.team}</small></td><td><span className={`data-label ${a.dataClass.toLowerCase()}`}><LockKeyhole size={12} />{a.dataClass}</span></td><td><RiskBadge risk={a.risk} /></td><td><StatusBadge status={a.status} /></td><td><button className="icon-button" aria-label={`View ${a.name}`} onClick={() => onAsset(a.id)}><ChevronRight size={17} /></button></td></tr>)}</tbody></table></div>
    {!assets.length && <EmptyState title="No matching assets">Try another search or status filter.</EmptyState>}
    <div className="panel-footer"><Info size={14} />Inventory visibility is separate from permission to execute or access data.</div>
  </section>;
}

export function Reviews({ state, selectedId, setSelectedId, onSave, onDecision, onAsset }: {
  state: GovernanceState; selectedId: string; setSelectedId: (id: string) => void;
  onSave: (id: string, draft: ReviewDraft) => void; onDecision: (id: string, decision: 'approve' | 'reject', comment: string) => void; onAsset: (id: string) => void;
}) {
  const queue = state.assets.filter(a => ['in-review', 'suspended', 'draft'].includes(a.status)).sort((a, b) => Number(b.type === 'mcp') - Number(a.type === 'mcp'));
  const asset = state.assets.find(a => a.id === selectedId) ?? queue[0];
  const draft = asset ? state.reviews[asset.id] ?? emptyReview() : emptyReview();
  const policies = asset ? getPolicyChecks(asset) : [];
  const blocked = policies.some(p => p.status === 'fail');
  const completed = REVIEW_CHECKS.filter(c => draft.checks[c.id]).length;
  const decided = asset?.status === 'approved' || asset?.status === 'rejected';
  return <div className="review-layout"><aside className="panel review-sidebar"><div className="panel-heading"><div><h2>Decisions to make</h2><p>{queue.filter(a => a.type === 'mcp').length} MCP reviews · {queue.filter(a => a.type === 'skill').length} secondary skills</p></div></div>
    <div className="review-sidebar-list">{queue.map(a => <button key={a.id} className={asset?.id === a.id ? 'selected' : ''} onClick={() => setSelectedId(a.id)}><div className="review-queue-top"><AssetIcon type={a.type} /><RiskBadge risk={a.risk} /></div><small className={`review-scope-label ${a.type}`}>{a.type === 'mcp' ? 'MCP · PRIMARY' : 'AGENT SKILL · SECONDARY'}</small><strong>{a.name}</strong><span>{a.team}</span><div className="review-queue-bottom"><StatusBadge status={a.status} /><span>v{a.version}</span></div></button>)}</div>
    {!queue.length && <EmptyState title="Queue complete">New submissions and material changes will appear here.</EmptyState>}
  </aside>
    {asset ? <div className="review-main"><section className="panel review-detail"><div className="review-title"><AssetIcon type={asset.type} large /><div><span className="eyebrow">{asset.type === 'mcp' ? 'MCP SERVER' : 'AGENT SKILL'} · RELEASE {asset.version}</span><h2>{asset.name}</h2><p>{asset.description}</p></div><button className="icon-button" aria-label="View asset source and details" onClick={() => onAsset(asset.id)}><FileCode2 size={19} /></button></div>
      <div className="scope-grid"><div><span>Requested purpose</span><strong>{asset.useCase}</strong></div><div><span>Data boundary</span><strong>{asset.dataClass} data</strong></div><div><span>Deployment</span><strong>{asset.environment}</strong></div><div><span>Accountable owner</span><strong>{asset.owner}</strong></div></div>
      <div className="permission-line"><span>Requested actions</span>{asset.permissions.map(p => <code key={p}>{p}</code>)}</div>
    </section>
    <section className="panel"><div className="panel-heading"><div><h2>Policy assessment</h2><p>Deterministic, illustrative checks · {POLICY_VERSION}</p></div><span className={`badge ${blocked ? 'status-suspended' : 'status-approved'}`}>{blocked ? 'Action required' : 'No blocking findings'}</span></div>
      <div className="policy-checks">{policies.map(p => <div className={`policy-check ${p.status}`} key={p.id}>{p.status === 'pass' ? <CheckCircle2 size={18} /> : p.status === 'fail' ? <XCircle size={18} /> : <TriangleAlert size={18} />}<div><strong>{p.label}</strong><p>{p.description}</p></div><span>{p.status === 'pass' ? 'Pass' : p.status === 'fail' ? 'Blocked' : 'Review'}</span></div>)}</div>
    </section>
    <section className="panel"><div className="panel-heading"><div><h2>Review evidence</h2><p>Synthetic artifacts supplied with this submission.</p></div><span className="count-pill">{asset.evidence.length}</span></div><div className="evidence-list">{asset.evidence.map(e => <div key={e.id}><span className={`evidence-icon ${e.result}`}>{e.result === 'passed' ? <FileCheck2 size={18} /> : <ShieldAlert size={18} />}</span><div><strong>{e.title}</strong><p>{e.detail}</p></div><span className={`evidence-result ${e.result}`}>{e.result === 'passed' ? 'Provided' : e.result === 'failed' ? 'Failed' : 'Review needed'}</span></div>)}</div></section>
    <section className="panel decision-panel"><div className="panel-heading"><div><h2>Record a decision</h2><p>Demo reviewer: Avery Morgan · Governance owner</p></div><span className="review-progress">{completed} / {REVIEW_CHECKS.length} checks</span></div>
      {decided ? <div className="decision-recorded"><ShieldCheck size={24} /><div><strong>Decision recorded: {asset.status}</strong><p>Find the rationale and release scope in the audit trail and asset record.</p></div></div> : <>
      <div className="review-checklist">{REVIEW_CHECKS.map(c => <label key={c.id}><input type="checkbox" checked={draft.checks[c.id]} onChange={e => onSave(asset.id, { ...draft, checks: { ...draft.checks, [c.id]: e.target.checked } })} /><span><strong>{c.label}</strong><small>{c.description}</small></span></label>)}</div>
      {asset.conditions.length > 0 && <div className="conditions-box"><strong>Conditions carried into approval</strong><ul>{asset.conditions.map(c => <li key={c}>{c}</li>)}</ul></div>}
      <label className="form-label decision-notes">Decision rationale<textarea value={draft.notes} onChange={e => onSave(asset.id, { ...draft, notes: e.target.value })} placeholder="Explain the decision and any review considerations (minimum 8 characters)…" rows={3} /></label>
      {blocked && <p className="blocking-note"><ShieldAlert size={15} />Blocking findings must be resolved before approval. A rejection can still be recorded.</p>}
      <div className="decision-actions"><span><LockKeyhole size={14} />Illustrative review · no official authorization</span><button className="button danger-quiet" disabled={draft.notes.trim().length < 8} onClick={() => onDecision(asset.id, 'reject', draft.notes)}>Reject submission</button><button className="button primary" disabled={blocked || completed < REVIEW_CHECKS.length || draft.notes.trim().length < 8} onClick={() => onDecision(asset.id, 'approve', draft.notes)}><Check size={16} />Approve scoped use</button></div>
      </>}
    </section></div> : <section className="panel"><EmptyState title="No review selected">Select an asset from the queue to inspect its scope and evidence.</EmptyState></section>}
  </div>;
}

const policyCards = [
  { id: 'GOV-01', title: 'Ownership & accountability', description: 'Every asset needs a named owner, intended purpose, and identifiable release.', category: 'Inventory', controls: ['Owner and steward', 'Release identity', 'Intended use'], icon: Users },
  { id: 'GOV-02', title: 'Data & destination boundary', description: 'The demo blocks Controlled data when the declared destination is external.', category: 'Data protection', controls: ['Data classification', 'Permitted destinations', 'Source-data authorization'], icon: LockKeyhole },
  { id: 'GOV-03', title: 'Evidence before a decision', description: 'Complete four review attestations and provide a rationale. Failed evidence blocks approval.', category: 'Review', controls: ['Security', 'Privacy', 'Validation', 'Ownership'], icon: ClipboardCheck },
  { id: 'GOV-04', title: 'Scoped, time-bound approval', description: 'A decision covers a release, purpose, data ceiling, environment, and allowed actions. New decisions expire in 90 days.', category: 'Authorization record', controls: ['Exact release', 'Permitted actions', 'Environment', 'Expiration'], icon: ShieldCheck },
  { id: 'GOV-05', title: 'Change & dependency oversight', description: 'A material upstream change suspends affected assets and invalidates their approval records.', category: 'Ongoing oversight', controls: ['Dependency impact', 'Reassessment', 'Incident record'], icon: GitBranch },
  { id: 'GOV-06', title: 'Decision traceability', description: 'Reviews, simulations, changes, and exports produce an inspectable browser-local event trail.', category: 'Evidence', controls: ['Actor and timestamp', 'Decision rationale', 'Evidence export'], icon: History },
];
export function Policies() {
  const [open, setOpen] = useState<string | null>(null);
  return <><div className="notice-box"><Info size={20} /><div><strong>A demonstration policy pack</strong><p>These rules show how policy can become a repeatable workflow. They are illustrative product logic, not adopted NIH policy, legal advice, or a compliance certification.</p></div></div>
    <div className="policy-library">{policyCards.map(p => <section className="panel policy-card" key={p.id}><div className="policy-card-top"><span className="policy-library-icon"><p.icon size={22} strokeWidth={1.6} /></span><span className="policy-id">{p.id}</span></div><span className="eyebrow">{p.category}</span><h2>{p.title}</h2><p>{p.description}</p><button className="text-button" aria-expanded={open === p.id} onClick={() => setOpen(open === p.id ? null : p.id)}>{open === p.id ? 'Hide control mapping' : 'View control mapping'}<ChevronRight size={15} /></button>{open === p.id && <div className="policy-control-list">{p.controls.map(c => <span key={c}><Check size={13} />{c}</span>)}<small>Policy pack {POLICY_VERSION} · implementation in src/domain/engine.ts</small></div>}</section>)}</div>
    <section className="panel authority-note"><ShieldCheck size={26} /><div><h2>Keep the decision authorities distinct.</h2><p>Asset review, use-case approval, permission to access source data, and information-system authorization are separate decisions. A production service would connect their evidence to NIH’s designated authorities.</p></div></section></>;
}

export function AuditTrail({ state, onExport, onAsset }: { state: GovernanceState; onExport: () => void; onAsset: (id: string) => void }) {
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const events = state.audit.filter(e => (category === 'all' || e.category === category) && `${e.action} ${e.detail} ${e.actor}`.toLowerCase().includes(search.toLowerCase()));
  return <><div className="notice-box compact"><History size={19} /><p>This browser-local trail demonstrates traceability. It can be changed or cleared by the browser user; production needs a protected server-side audit service.</p></div>
    <section className="panel"><div className="table-toolbar"><label className="search-input"><Search size={16} /><input aria-label="Search audit events" placeholder="Search decisions, actors, or evidence…" value={search} onChange={e => setSearch(e.target.value)} /></label><label className="select-label"><ListFilter size={16} /><select aria-label="Filter audit category" value={category} onChange={e => setCategory(e.target.value)}><option value="all">All events</option><option value="review">Reviews</option><option value="change">Changes</option><option value="access">Access simulations</option><option value="system">System</option></select></label><button className="button small" onClick={onExport}><ArrowDownToLine size={15} />Export evidence</button></div>
    <div className="audit-timeline">{events.map(e => <article className="audit-event" key={e.id}><span className={`activity-symbol ${e.category}`}>{e.category === 'change' ? <GitBranch size={16} /> : e.category === 'access' ? <LockKeyhole size={16} /> : <ClipboardCheck size={16} />}</span><div className="audit-event-body"><div><h3>{e.action}</h3><time>{formatDate(e.timestamp, true)}</time></div><p>{e.detail}</p><footer><span>{e.actor}</span><span className="audit-category">{e.category}</span>{e.assetId && <button className="inline-link" onClick={() => onAsset(e.assetId!)}>Inspect asset<ArrowUpRight size={12} /></button>}</footer></div></article>)}</div>
    {!events.length && <EmptyState title="No matching events">Change the filters or complete a demo action.</EmptyState>}
    <div className="panel-footer"><Clock3 size={14} />Timestamps displayed in America/New_York. All people and events are illustrative.</div></section></>;
}
