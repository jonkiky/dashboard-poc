import { useEffect, useState } from 'react';
import { ArrowDownToLine, ArrowUpRight, BookOpen, Check, ChevronRight, ClipboardCheck, FlaskConical, History, LayoutDashboard, Layers3, Menu, Plus, RotateCcw, Search, ShieldCheck, SlidersHorizontal, X } from 'lucide-react';
import { AssetDialog, ChangeDialog, GuideDialog, RegisterDialog, ResetDialog, SimulationDialog, type NewAssetInput } from './dialogs';
import { AuditTrail, Inventory, Overview, Policies, Reviews } from './views';
import { createSeedState } from './data/seed';
import { decideReview, emptyReview, POLICY_VERSION, runInvocation, saveReview, simulateChange } from './domain/engine';
import type { Asset, AssetType, GovernanceState, InvocationRequest, InvocationResult, ReviewDraft, View } from './domain/types';
import { downloadFile } from './components';
import { loadState, STORAGE_KEY } from './storage';

const ACTOR = 'Avery Morgan (demo governance owner)';
const pages: { id: View; label: string; title: string; description: string; Icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', title: 'MCP governance, at a glance.', description: 'MCP servers first. Clear ownership, scoped tools, and ongoing oversight.', Icon: LayoutDashboard },
  { id: 'inventory', label: 'Asset inventory', title: 'MCP servers, accounted for.', description: 'Govern server releases, tool permissions, and data boundaries. Agent skills are a secondary scope.', Icon: Layers3 },
  { id: 'reviews', label: 'Review workspace', title: 'MCP reviews, backed by evidence.', description: 'Start with server permissions and data access. Review dependent agent skills when needed.', Icon: ClipboardCheck },
  { id: 'policies', label: 'Policy library', title: 'From policy to practice.', description: 'See the illustrative rules behind each review and approval boundary.', Icon: ShieldCheck },
  { id: 'audit', label: 'Audit trail', title: 'A clear record of why.', description: 'Follow the decisions, changes, and evidence behind your oversight.', Icon: History },
];
function initialView(): View {
  const hash = window.location.hash.slice(1);
  return pages.some(p => p.id === hash) ? hash as View : 'overview';
}

export default function App() {
  const [initial] = useState(loadState);
  const [state, setState] = useState<GovernanceState>(initial.state);
  const [view, setView] = useState<View>(initialView);
  const [search, setSearch] = useState('');
  const [reviewId, setReviewId] = useState('mcp-labfiles');
  const [inventoryType, setInventoryType] = useState<AssetType | 'all'>('mcp');
  const [assetId, setAssetId] = useState<string | null>(null);
  const [modal, setModal] = useState<'register' | 'change' | 'simulation' | 'guide' | 'reset' | null>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(initial.warning ? { text: initial.warning, error: true } : null);
  const [storageWarning, setStorageWarning] = useState(false);
  const page = pages.find(p => p.id === view)!;
  const selectedAsset = state.assets.find(a => a.id === assetId);
  const queueCount = state.assets.filter(a => a.type === 'mcp' && (a.status === 'in-review' || a.status === 'suspended')).length;

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); setStorageWarning(false); }
    catch { setStorageWarning(true); }
  }, [state]);
  useEffect(() => {
    const onHash = () => setView(initialView());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  useEffect(() => { document.title = `${page.label} · Steward`; }, [page.label]);
  useEffect(() => { if (toast) { const timer = setTimeout(() => setToast(null), 5500); return () => clearTimeout(timer); } }, [toast]);

  function navigate(next: View) { setView(next); window.location.hash = next; setMobileNav(false); }
  function openInventory(type: AssetType | 'all') { setInventoryType(type); setSearch(''); navigate('inventory'); }
  function notify(text: string, error = false) { setToast({ text, error }); }
  function commit(transform: (current: GovernanceState) => GovernanceState, message?: string) {
    try { setState(transform(state)); if (message) notify(message); }
    catch (error) { notify(error instanceof Error ? error.message : 'The demo action could not be completed.', true); }
  }
  function openReview(id: string) { setAssetId(null); setModal(null); setReviewId(id); navigate('reviews'); }
  function saveDraft(id: string, draft: ReviewDraft) { commit(current => saveReview(current, id, draft)); }
  function recordDecision(id: string, decision: 'approve' | 'reject', comment: string) {
    commit(current => decideReview(current, id, decision, comment, ACTOR), decision === 'approve' ? 'Scoped approval recorded. The asset and audit trail are updated.' : 'Rejection recorded with your rationale.');
  }
  function accessSimulation(request: InvocationRequest): InvocationResult {
    const result = runInvocation(state, request, ACTOR);
    setState(result.state);
    return result.result;
  }
  function applyChange() {
    commit(current => simulateChange(current, ACTOR), 'Change detected. Affected approvals are invalidated and review tasks are ready.');
    setModal(null); navigate('overview');
  }
  function exportEvidence() {
    const timestamp = new Date().toISOString();
    const next: GovernanceState = { ...state, audit: [{ id: crypto.randomUUID(), timestamp, actor: ACTOR, action: 'Evidence bundle exported', detail: 'Exported the fictional portfolio, approval records, review drafts, incidents, and event trail as JSON.', category: 'system' }, ...state.audit] };
    const bundle = { exportFormat: 'steward-demo-evidence-v1', simulationOnly: true, exportedAt: timestamp, policyVersion: POLICY_VERSION, notice: 'Synthetic browser-local demonstration. This is not an official NIH/NCI authorization or tamper-evident audit record.', ...next };
    downloadFile(`steward-evidence-${timestamp.slice(0, 10)}.json`, JSON.stringify(bundle, null, 2));
    setState(next); notify('Evidence bundle downloaded as JSON.');
  }
  function registerAsset(input: NewAssetInput) {
    const id = `demo-${input.type}-${crypto.randomUUID().slice(0, 8)}`;
    const destination = input.dataClass === 'Public' ? 'https://demo-service.example.invalid/mcp' : 'https://demo-research.internal';
    const asset: Asset = {
      ...input, id, subtitle: 'Fictional submission · awaiting evidence', description: input.useCase,
      version: '0.1.0', status: 'in-review', risk: input.dataClass === 'Controlled' ? 'high' : input.dataClass === 'Internal' ? 'moderate' : 'low',
      submittedAt: new Date().toISOString(), reviewDue: new Date(Date.now() + 7 * 86400000).toISOString(),
      destinations: [destination], dependencies: [], conditions: ['Use only synthetic data during this demonstration.'], findings: ['New submission: review evidence has not been independently verified.'],
      evidence: [{ id: `${id}-evidence`, title: 'Evidence pending review', detail: 'The registration form creates a synthetic record. A reviewer must inspect its scope and record their attestations.', result: 'attention' }],
      sourcePath: '',
      source: input.type === 'skill' ? `---\nname: ${id}\ndescription: ${JSON.stringify(input.useCase)}\n---\n\n# ${input.name}\n\nFictional demonstration skill. No executable script is included.\n\n## Intended use\n${input.useCase}\n\n## Boundary\n${input.dataClass} synthetic data only. Actions: ${input.permissions.join(', ')}.\n` : JSON.stringify({ name: `invalid.example.demo/${id}`, version: '0.1.0', description: input.useCase, remotes: [{ type: 'streamable-http', url: destination }], simulationOnly: true }, null, 2),
    };
    commit(current => ({ ...current, assets: [asset, ...current.assets], reviews: { ...current.reviews, [id]: emptyReview() }, audit: [{ id: crypto.randomUUID(), timestamp: new Date().toISOString(), actor: ACTOR, action: 'Asset submitted for review', detail: `${asset.name} ${asset.version} registered for ${asset.dataClass} data in ${asset.environment}. Evidence is pending review.`, assetId: id, category: 'review' }, ...current.audit] }), 'Fictional asset registered and added to the review queue.');
    openReview(id);
  }

  return <div className="app-shell">
    <a className="skip-link" href="#main-content" onClick={event => { event.preventDefault(); document.getElementById('main-content')?.focus(); }}>Skip to main content</a>
    {mobileNav && <button className="nav-scrim" aria-label="Close navigation" onClick={() => setMobileNav(false)} />}
    <aside className={`sidebar ${mobileNav ? 'mobile-open' : ''}`}>
      <a className="brand" href="#overview" onClick={() => navigate('overview')}><span className="brand-mark"><ShieldCheck size={27} strokeWidth={1.55} /></span><div><strong>steward<span>.</span></strong><small>MCP GOVERNANCE</small></div></a>
      <div className="workspace-selector"><span className="workspace-initials">N</span><div><strong>NCI research workspace</strong><small>Illustrative organization</small></div><SlidersHorizontal size={15} /></div>
      <span className="nav-label">MCP GOVERNANCE · PRIMARY</span>
      <nav aria-label="Main navigation">{pages.map(({ id, label, Icon }) => <a key={id} href={`#${id}`} className={view === id ? 'active' : ''} aria-current={view === id ? 'page' : undefined} onClick={() => id === 'inventory' ? openInventory('mcp') : navigate(id)}><Icon size={19} strokeWidth={1.7} /><span>{label}</span>{id === 'reviews' && queueCount > 0 && <span className="nav-count" title="MCP servers awaiting review">{queueCount}</span>}{view === id && id !== 'reviews' && <span className="nav-active-dot" />}</a>)}</nav>
      <div className="sidebar-bottom"><div className="demo-card"><span className="demo-card-icon"><FlaskConical size={22} strokeWidth={1.5} /></span><span className="demo-card-label">A WORKING PROOF OF CONCEPT</span><h3>Explore the value<br />of good governance.</h3><p>Fictional assets. Real workflows.<br />Your own space to explore.</p><button onClick={() => setModal('guide')}>Take the guided tour<ArrowUpRight size={15} /></button></div><button className="sidebar-reset" onClick={() => setModal('reset')}><RotateCcw size={15} />Reset demo workspace</button><div className="sidebar-footnote"><span className="live-dot" />Synthetic data only<span>v1.0</span></div></div>
    </aside>
    <div className="main-shell"><header className="topbar"><div className="breadcrumb"><button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setMobileNav(true)}><Menu size={21} /></button><span>Workspace</span><ChevronRight size={13} /><strong>{page.label}</strong></div>
      <div className="topbar-actions"><label className="global-search"><Search size={16} /><input aria-label="Search portfolio" placeholder="Find a server or skill…" value={search} onChange={e => { setSearch(e.target.value); setInventoryType('all'); navigate('inventory'); }} /></label><span className="demo-tag"><span />DEMO</span><div className="profile"><span>AM</span><div><strong>Avery Morgan</strong><small>Demo governance owner</small></div></div></div></header>
      <main id="main-content" tabIndex={-1}><div className="page-heading"><div><div className="page-eyebrow"><span className="live-dot" />NCI / NIH · MCP GOVERNANCE PROOF OF CONCEPT</div><h1>{page.title}</h1><p>{page.description}</p></div><div className="page-actions"><button className="button" onClick={() => setModal('simulation')}><FlaskConical size={16} />Simulation lab</button><button className="button primary" onClick={() => setModal('register')}><Plus size={16} />Register MCP server</button></div></div>
        {storageWarning && <div className="notice-box storage-warning" role="alert">Browser storage is unavailable. You can explore and export this session; changes will not survive a reload.</div>}
        {view === 'overview' && <Overview state={state} onNavigate={navigate} onAsset={setAssetId} onReview={openReview} onChange={() => setModal('change')} onOpenSkills={() => openInventory('skill')} />}
        {view === 'inventory' && <Inventory state={state} search={search} setSearch={setSearch} type={inventoryType} setType={setInventoryType} onAsset={setAssetId} onRegister={() => setModal('register')} />}
        {view === 'reviews' && <Reviews state={state} selectedId={reviewId} setSelectedId={setReviewId} onSave={saveDraft} onDecision={recordDecision} onAsset={setAssetId} />}
        {view === 'policies' && <Policies />}
        {view === 'audit' && <AuditTrail state={state} onExport={exportEvidence} onAsset={setAssetId} />}
        <footer className="main-footer"><span><ShieldCheck size={14} />Steward · Governance demonstration</span><p>Fictional NCI / NIH scenario. No official affiliation, authorization, or compliance claim.</p><button onClick={exportEvidence}><ArrowDownToLine size={14} />Export evidence</button></footer>
      </main>
    </div>
    {selectedAsset && <AssetDialog key={selectedAsset.id} asset={selectedAsset} state={state} onClose={() => setAssetId(null)} onReview={openReview} onAsset={setAssetId} />}
    {modal === 'register' && <RegisterDialog onClose={() => setModal(null)} onRegister={registerAsset} />}
    {modal === 'change' && <ChangeDialog state={state} onClose={() => setModal(null)} onRun={applyChange} />}
    {modal === 'simulation' && <SimulationDialog state={state} onClose={() => setModal(null)} onRun={accessSimulation} />}
    {modal === 'guide' && <GuideDialog onClose={() => setModal(null)} onReview={() => openReview('mcp-labfiles')} onSimulate={() => setModal('simulation')} onChange={() => setModal('change')} />}
    {modal === 'reset' && <ResetDialog onClose={() => setModal(null)} onConfirm={() => { setState(createSeedState()); setReviewId('mcp-labfiles'); setInventoryType('mcp'); setSearch(''); setModal(null); setAssetId(null); navigate('overview'); notify('The original synthetic workspace has been restored.'); }} />}
    {toast && <div className={`toast ${toast.error ? 'error' : ''}`} role={toast.error ? 'alert' : 'status'}>{toast.error ? <InfoIcon /> : <Check size={18} />}<span>{toast.text}</span><button aria-label="Dismiss notification" onClick={() => setToast(null)}><X size={15} /></button></div>}
  </div>;
}

function InfoIcon() { return <BookOpen size={18} />; }
