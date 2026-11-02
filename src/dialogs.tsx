import { useState } from 'react';
import { ArrowDownToLine, ArrowRight, CheckCircle2, ChevronRight, FileCode2, GitBranch, Info, LockKeyhole, Play, ShieldCheck, TriangleAlert, XCircle } from 'lucide-react';
import { AssetIcon, Dialog, RiskBadge, StatusBadge, downloadFile, formatDate } from './components';
import type { Asset, DataClass, GovernanceState, InvocationRequest, InvocationResult } from './domain/types';
import { POLICY_VERSION } from './domain/engine';

export function AssetDialog({ asset, state, onClose, onReview, onAsset }: { asset: Asset; state: GovernanceState; onClose: () => void; onReview: (id: string) => void; onAsset: (id: string) => void }) {
  const [tab, setTab] = useState<'record' | 'source'>('record');
  const approval = state.approvals.find(a => a.assetId === asset.id && a.version === asset.version && a.status === 'active' && new Date(a.expiresAt) > new Date());
  const dependents = state.assets.filter(a => a.dependencies.includes(asset.id));
  const download = () => downloadFile(`${asset.id}-${asset.type === 'mcp' ? 'server.json' : 'SKILL.md'}`, asset.source, 'text/plain');
  return <Dialog title={asset.name} subtitle={asset.subtitle} onClose={onClose} wide>
    <div className="asset-dialog-summary"><AssetIcon type={asset.type} large /><StatusBadge status={asset.status} /><RiskBadge risk={asset.risk} /><span className="mono muted-text">v{asset.version}</span></div>
    <div className="tabs dialog-tabs"><button className={tab === 'record' ? 'active' : ''} onClick={() => setTab('record')}>Governance record</button><button className={tab === 'source' ? 'active' : ''} onClick={() => setTab('source')}><FileCode2 size={15} />Mock source</button></div>
    {tab === 'record' ? <div className="asset-record"><p className="record-description">{asset.description}</p><div className="scope-grid"><div><span>Accountable owner</span><strong>{asset.owner}</strong><small>{asset.team}</small></div><div><span>Data classification</span><strong>{asset.dataClass}</strong></div><div><span>Approved environment</span><strong>{asset.environment}</strong></div><div><span>Policy pack</span><strong>{POLICY_VERSION}</strong></div></div>
      <div className="record-section"><h3>Intended purpose</h3><p>{asset.useCase}</p><div className="permission-line">{asset.permissions.map(p => <code key={p}>{p}</code>)}</div></div>
      <div className="record-section"><h3>Declared destinations</h3>{asset.destinations.map(d => <code className="destination-code" key={d}>{d}</code>)}</div>
      <div className={`approval-card ${approval ? '' : 'missing'}`}><ShieldCheck size={23} /><div><strong>{approval ? 'Scoped approval on record' : 'No active approval for this release'}</strong>{approval ? <><p>{approval.reviewedBy} · {formatDate(approval.reviewedAt)}</p><p>Expires {formatDate(approval.expiresAt)} · {approval.id}</p></> : <p>Use needs a current decision covering its release and requested scope.</p>}</div></div>
      {asset.conditions.length > 0 && <div className="record-section"><h3>Conditions of use</h3><ul>{asset.conditions.map(c => <li key={c}>{c}</li>)}</ul></div>}
      {asset.findings.length > 0 && <div className="conditions-box warning"><strong>Findings requiring attention</strong><ul>{asset.findings.map(f => <li key={f}>{f}</li>)}</ul></div>}
      <div className="record-section"><h3>Dependencies & impact</h3><div className="dependency-list">{asset.dependencies.map(id => { const dep = state.assets.find(a => a.id === id); return <button key={id} onClick={() => onAsset(id)}><GitBranch size={15} /><span>{dep?.name ?? id}</span>{dep && <StatusBadge status={dep.status} />}<ChevronRight size={14} /></button>; })}{!asset.dependencies.length && <p className="muted-text">No registered dependencies.</p>}</div>{dependents.length > 0 && <p className="dependency-note">{dependents.length} asset{dependents.length === 1 ? '' : 's'} depend on this release: {dependents.map(a => a.name).join(', ')}.</p>}</div>
    </div> : <div className="source-panel"><div className="source-toolbar"><span>{asset.type === 'mcp' ? 'server.json' : 'SKILL.md'}</span><button className="text-button" onClick={download}><ArrowDownToLine size={14} />Download snapshot</button></div>{state.simulationUsed && asset.id === 'mcp-imaging' && <div className="notice-box compact"><Info size={17} /><p>This is the bundled 1.2.0 source snapshot. The change scenario updates governance metadata to 1.3.0; it does not deploy or modify a real package.</p></div>}<pre><code>{asset.source}</code></pre><p className="source-note">Synthetic package. All external hosts use .invalid. No source is executed.</p></div>}
    <div className="dialog-actions"><button className="button" onClick={onClose}>Close record</button>{asset.status !== 'approved' && asset.status !== 'rejected' && <button className="button primary" onClick={() => onReview(asset.id)}>Open review<ArrowRight size={15} /></button>}</div>
  </Dialog>;
}

export function ChangeDialog({ state, onClose, onRun }: { state: GovernanceState; onClose: () => void; onRun: () => void }) {
  return <Dialog title="When an approved asset changes" subtitle="See how one upstream change becomes a visible governance decision." onClose={onClose}>
    <div className="scenario-callout"><span className="scenario-icon"><GitBranch size={29} strokeWidth={1.5} /></span><div><span className="eyebrow">GUIDED SCENARIO · ABOUT 30 SECONDS</span><h3>A connector adds a write permission.</h3><p>Imaging Metadata Connector moves from v1.2.0 to v1.3.0 and adds <code>write:cohort</code>. Public Imaging Cohort Planner depends on this connector.</p></div></div>
    <div className="scenario-steps">{[
      ['Detect the scope change', 'The new action falls outside the reviewed release.'],
      ['Identify the downstream impact', 'Both the connector and dependent skill need reassessment.'],
      ['Invalidate existing approvals', 'Simulated access is denied until the affected chain is reviewed.'],
      ['Keep a decision trail', 'An incident and audit event explain what changed and why.'],
    ].map(([title, detail], i) => <div key={title}><span>{state.simulationUsed ? <CheckCircle2 size={17} /> : i + 1}</span><div><strong>{title}</strong><p>{detail}</p></div></div>)}</div>
    <div className="notice-box compact"><Info size={17} /><p>This changes synthetic browser data only. No server, endpoint, or real permission is modified.</p></div>
    <div className="dialog-actions"><button className="button" onClick={onClose}>{state.simulationUsed ? 'Close scenario' : 'Cancel'}</button><button className="button primary" disabled={state.simulationUsed} onClick={onRun}>{state.simulationUsed ? <CheckCircle2 size={16} /> : <Play size={15} />}{state.simulationUsed ? 'Scenario completed' : 'Simulate upstream change'}</button></div>
  </Dialog>;
}

export function SimulationDialog({ state, onClose, onRun }: { state: GovernanceState; onClose: () => void; onRun: (request: InvocationRequest) => InvocationResult }) {
  const initial = state.assets.find(a => a.id === 'mcp-imaging') ?? state.assets.find(a => a.type === 'mcp') ?? state.assets[0];
  const [assetId, setAssetId] = useState(initial.id);
  const asset = state.assets.find(a => a.id === assetId)!;
  const [dataClass, setDataClass] = useState<DataClass>('Public');
  const [action, setAction] = useState(initial.permissions[0]);
  const [environment, setEnvironment] = useState(initial.environment);
  const [result, setResult] = useState<InvocationResult | null>(null);
  const options = [...new Set([...asset.permissions, 'write:unapproved'])];
  return <Dialog title="Test an approval boundary" subtitle="Try an action against the governance records. No MCP tool or skill actually runs." onClose={onClose}>
    <form onSubmit={e => { e.preventDefault(); setResult(onRun({ assetId, dataClass, action, environment })); }}>
      <label className="form-label">Asset<select value={assetId} onChange={e => { const next = state.assets.find(a => a.id === e.target.value)!; setAssetId(next.id); setAction(next.permissions[0]); setEnvironment(next.environment); setResult(null); }}>{(['mcp', 'skill'] as const).map(type => <optgroup key={type} label={type === 'mcp' ? 'MCP servers · Primary' : 'Agent skills · Secondary'}>{state.assets.filter(a => a.type === type).map(a => <option key={a.id} value={a.id}>{a.name} · {a.status}</option>)}</optgroup>)}</select></label>
      <div className="form-grid"><label className="form-label">Input data<select value={dataClass} onChange={e => { setDataClass(e.target.value as DataClass); setResult(null); }}><option>Public</option><option>Internal</option><option>Controlled</option></select></label><label className="form-label">Requested action<select value={action} onChange={e => { setAction(e.target.value); setResult(null); }}>{options.map(p => <option key={p}>{p}</option>)}</select></label></div>
      <label className="form-label">Execution environment<select value={environment} onChange={e => { setEnvironment(e.target.value); setResult(null); }}>{[...new Set([asset.environment, 'Unmanaged workstation'])].map(v => <option key={v}>{v}</option>)}</select></label>
      <div className="simulation-context"><GitBranch size={16} /><span>{asset.dependencies.length ? `Also checks ${asset.dependencies.length} declared dependency and its approval chain.` : 'Checks this release and its declared approval conditions.'}</span></div>
      {result && <div role="status" className={`simulation-result ${result.allowed ? 'allowed' : 'denied'}`}>{result.allowed ? <CheckCircle2 size={24} /> : <XCircle size={24} />}<div><h3>{result.allowed ? 'Allowed by demo policy' : 'Denied by demo policy'}</h3><ul>{result.reasons.map(reason => <li key={reason}>{reason}</li>)}</ul>{result.approvalId && <small>Approval reference: {result.approvalId}</small>}</div></div>}
      <div className="dialog-actions"><button type="button" className="button" onClick={onClose}>Close lab</button><button className="button primary" type="submit"><Play size={15} />Run access simulation</button></div>
    </form>
  </Dialog>;
}

export interface NewAssetInput { name: string; type: Asset['type']; owner: string; team: string; useCase: string; dataClass: DataClass; environment: string; permissions: string[]; }
export function RegisterDialog({ onClose, onRegister }: { onClose: () => void; onRegister: (input: NewAssetInput) => void }) {
  const [name, setName] = useState(''); const [type, setType] = useState<Asset['type']>('mcp');
  const [owner, setOwner] = useState(''); const [team, setTeam] = useState('Demo research team');
  const [useCase, setUseCase] = useState(''); const [dataClass, setDataClass] = useState<DataClass>('Public');
  const [permissions, setPermissions] = useState('read:metadata');
  const valid = name.trim().length >= 3 && owner.trim().length >= 3 && team.trim().length >= 3 && useCase.trim().length >= 12 && permissions.split(',').some(p => p.trim());
  return <Dialog title="Register a demo asset" subtitle="Start with an MCP server. Agent skills remain available as a secondary asset type." onClose={onClose}>
    <form onSubmit={e => { e.preventDefault(); if (valid) onRegister({ name: name.trim(), type, owner: owner.trim(), team: team.trim(), useCase: useCase.trim(), dataClass, environment: 'Research sandbox', permissions: [...new Set(permissions.split(',').map(p => p.trim()).filter(Boolean))] }); }}>
      <div className="notice-box compact"><Info size={17} /><p>Use fictional information only. This demo stores submissions in your browser.</p></div>
      <div className="form-grid"><label className="form-label">Asset name<input required minLength={3} maxLength={100} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Public Dataset MCP Connector" /></label><label className="form-label">Asset type<select value={type} onChange={e => setType(e.target.value as Asset['type'])}><option value="mcp">MCP server · Primary</option><option value="skill">Agent skill · Secondary</option></select></label></div>
      <div className="form-grid"><label className="form-label">Accountable owner<input required minLength={3} maxLength={80} value={owner} onChange={e => setOwner(e.target.value)} placeholder="Fictional person" /></label><label className="form-label">Owning team<input required minLength={3} maxLength={100} value={team} onChange={e => setTeam(e.target.value)} /></label></div>
      <label className="form-label">Intended use<textarea required minLength={12} maxLength={500} rows={2} value={useCase} onChange={e => setUseCase(e.target.value)} placeholder="Describe the task and the data this asset will use…" /></label>
      <div className="form-grid"><label className="form-label">Data classification<select value={dataClass} onChange={e => setDataClass(e.target.value as DataClass)}><option>Public</option><option>Internal</option><option>Controlled</option></select></label><label className="form-label">Requested actions<input required maxLength={200} value={permissions} onChange={e => setPermissions(e.target.value)} placeholder="read:metadata, search:papers" /><small>Comma-separated action names.</small></label></div>
      <p className="form-footnote"><LockKeyhole size={14} />New submissions enter review with pending evidence and no approval.</p><div className="dialog-actions"><button className="button" type="button" onClick={onClose}>Cancel</button><button className="button primary" disabled={!valid} type="submit">Submit for review<ArrowRight size={15} /></button></div>
    </form>
  </Dialog>;
}

export function ResetDialog({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  return <Dialog title="Reset this demo workspace?" subtitle="Restore the eight original synthetic assets and their starting approval records." onClose={onClose}><div className="notice-box"><TriangleAlert size={22} /><p>Your local submissions, decisions, simulated incidents, and audit events will be replaced. Export evidence first if you want to keep this demo session.</p></div><div className="dialog-actions"><button className="button" onClick={onClose}>Keep my session</button><button className="button primary" onClick={onConfirm}>Reset demo data</button></div></Dialog>;
}

export function GuideDialog({ onClose, onReview, onSimulate, onChange }: { onClose: () => void; onReview: () => void; onSimulate: () => void; onChange: () => void }) {
  return <Dialog title="A three-minute MCP governance story" subtitle="Start with MCP servers, tool permissions, and data access. Every decision is fictional." onClose={onClose}>
    <div className="guide-cards"><button onClick={onReview}><span>01</span><div><h3>Approve a scoped MCP server</h3><p>Review Lab Workspace File Index, complete the checklist, and approve metadata-only access.</p></div><ArrowRight size={18} /></button><button onClick={onSimulate}><span>02</span><div><h3>Test MCP tool boundaries</h3><p>Allow public-data use of Imaging Metadata Connector, then try Controlled data and see the denial.</p></div><ArrowRight size={18} /></button><button onClick={onChange}><span>03</span><div><h3>Catch a server permission change</h3><p>Simulate a new MCP write permission and inspect the affected server and dependent skill.</p></div><ArrowRight size={18} /></button></div>
    <div className="guide-benefit"><ShieldCheck size={22} /><div><strong>The owner’s benefit</strong><p>One place to see accountability, decision evidence, permitted scope, and the work needed when something changes.</p></div></div><p className="source-note">No authentication, live policy enforcement, real MCP execution, or sensitive data. Your session stays in this browser.</p>
  </Dialog>;
}
