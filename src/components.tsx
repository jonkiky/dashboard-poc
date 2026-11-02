import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Check, Circle, Server, Sparkles, X } from 'lucide-react';
import type { Asset, AssetStatus, Risk } from './domain/types';

export const statusLabels: Record<AssetStatus, string> = {
  approved: 'Approved', 'in-review': 'In review', draft: 'Draft', suspended: 'Suspended', rejected: 'Rejected',
};
export function StatusBadge({ status }: { status: AssetStatus }) {
  return <span className={`badge status-${status}`}><span className="status-dot" />{statusLabels[status]}</span>;
}
export function RiskBadge({ risk }: { risk: Risk }) {
  return <span className={`risk risk-${risk}`}><Circle size={7} fill="currentColor" />{risk[0].toUpperCase() + risk.slice(1)}</span>;
}
export function AssetIcon({ type, large = false }: { type: Asset['type']; large?: boolean }) {
  const Icon = type === 'mcp' ? Server : Sparkles;
  return <span className={`asset-icon ${type} ${large ? 'large' : ''}`}><Icon size={large ? 25 : 18} strokeWidth={1.7} /></span>;
}
export function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return <div className="empty-state"><span className="empty-icon"><Check size={22} /></span><h3>{title}</h3><p>{children}</p></div>;
}
export function Dialog({ title, subtitle, children, onClose, wide = false }: {
  title: string; subtitle?: string; children: ReactNode; onClose: () => void; wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => { if (dialog?.open) dialog.close(); };
  }, []);
  return createPortal(<dialog ref={ref} className={`dialog ${wide ? 'wide' : ''}`} aria-labelledby="dialog-title"
    onCancel={onClose} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="dialog-content">
      <div className="dialog-heading"><div><span className="eyebrow">DEMO WORKSPACE</span><h2 id="dialog-title">{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
        <button className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={20} /></button></div>
      {children}
    </div>
  </dialog>, document.body);
}
export function formatDate(value: string, time = false) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', ...(time ? { hour: 'numeric', minute: '2-digit' } : { year: 'numeric' }),
    timeZone: 'America/New_York',
  }).format(date);
}
export function downloadFile(name: string, content: string, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url; link.download = name; document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
