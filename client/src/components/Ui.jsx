import { LoaderCircle } from 'lucide-react';

export function Loading({ label = 'Loading…' }) {
  return <div className="flex min-h-48 items-center justify-center gap-2 text-slate-500"><LoaderCircle className="animate-spin" size={20} />{label}</div>;
}

export function ErrorAlert({ message }) {
  if (!message) return null;
  return <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div>;
}

export function SuccessAlert({ message }) {
  if (!message) return null;
  return <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>;
}

export function EmptyState({ title = 'Nothing here yet', text = 'New records will appear here.' }) {
  return <div className="card py-14 text-center"><h3 className="text-xl font-bold">{title}</h3><p className="mt-2 text-slate-500">{text}</p></div>;
}

const statusColors = {
  pending: 'bg-amber-100 text-amber-800', assigned: 'bg-blue-100 text-blue-800',
  'in-review': 'bg-violet-100 text-violet-800', scheduled: 'bg-cyan-100 text-cyan-800',
  resolved: 'bg-emerald-100 text-emerald-800', cancelled: 'bg-red-100 text-red-800',
  active: 'bg-emerald-100 text-emerald-800', inactive: 'bg-slate-200 text-slate-700',
  published: 'bg-emerald-100 text-emerald-800', draft: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800', review: 'bg-amber-100 text-amber-800'
};
export function StatusBadge({ value }) {
  return <span className={`status ${statusColors[value] || 'bg-slate-100 text-slate-700'}`}>{value}</span>;
}

export const formatDate = (date) => date ? new Intl.DateTimeFormat('en-BD', { dateStyle: 'medium' }).format(new Date(date)) : '—';
