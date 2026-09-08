import { Search } from 'lucide-react';

export function DashboardHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-3xl">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="text-4xl font-bold">{title}</h1>
        {description && <p className="mt-3 leading-7 text-slate-600">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}

export function DashboardFilters({ query, onQueryChange, placeholder = 'Search records…', children }) {
  return (
    <div className="mt-7 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <label className="min-w-64 flex-1">
        <span className="sr-only">Search</span>
        <span className="relative block">
          <Search className="pointer-events-none absolute left-4 top-3.5 text-slate-400" size={19} />
          <input
            className="input pl-11"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={placeholder}
          />
        </span>
      </label>
      {children}
    </div>
  );
}

export function SummaryPills({ items }) {
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      {items.map(([label, value]) => (
        <span key={label} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600">
          <strong className="text-ink">{value}</strong> {label}
        </span>
      ))}
    </div>
  );
}

export function CharacterCount({ value = '', limit }) {
  return <span className="mt-1 block text-right text-xs text-slate-400">{value.length}/{limit}</span>;
}
