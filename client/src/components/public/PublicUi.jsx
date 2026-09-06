import { ArrowRight, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function PageHero({ eyebrow, title, description, children }) {
  return (
    <section className="public-hero">
      <div className="container-page relative py-14 sm:py-20">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="page-title max-w-4xl !text-white">{title}</h1>
        {description && <p className="mt-5 max-w-3xl text-base leading-7 text-white/70 sm:text-lg">{description}</p>}
        {children && <div className="mt-7">{children}</div>}
      </div>
    </section>
  );
}

export function Breadcrumbs({ items }) {
  return (
    <nav className="mb-7 flex flex-wrap items-center gap-1.5 text-sm text-slate-500" aria-label="Breadcrumb">
      <Link className="transition hover:text-forest" to="/">Home</Link>
      {items.map((item, index) => (
        <span className="flex items-center gap-1.5" key={`${item.label}-${index}`}>
          <ChevronRight size={14} aria-hidden="true" />
          {item.to ? <Link className="transition hover:text-forest" to={item.to}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
        </span>
      ))}
    </nav>
  );
}

export function SectionHeading({ eyebrow, title, description, linkTo, linkLabel, dark = false }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 className={`page-title max-w-3xl ${dark ? '!text-white' : ''}`}>{title}</h2>
        {description && <p className={`mt-4 max-w-2xl leading-7 ${dark ? 'text-white/65' : 'text-slate-600'}`}>{description}</p>}
      </div>
      {linkTo && (
        <Link className={`inline-flex shrink-0 items-center gap-1 font-bold ${dark ? 'text-gold hover:text-white' : 'text-forest hover:text-ink'}`} to={linkTo}>
          {linkLabel} <ArrowRight size={17} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

export function PersonAvatar({ name, photoUrl, size = 'lg' }) {
  const initials = (name || 'Lawyer').split(' ').filter(Boolean).slice(-2).map((word) => word[0]).join('').toUpperCase();
  const sizes = size === 'xl' ? 'h-32 w-32 text-4xl' : 'h-20 w-20 text-2xl';

  if (photoUrl) {
    return <img className={`${sizes} rounded-2xl object-cover ring-4 ring-white shadow-md`} src={photoUrl} alt={`Portrait of ${name}`} />;
  }

  return <div className={`${sizes} flex items-center justify-center rounded-2xl bg-forest font-display font-bold text-white shadow-md`} aria-hidden="true">{initials}</div>;
}

export function ResultSummary({ count, singular, filtersActive }) {
  return <p className="text-sm text-slate-500" aria-live="polite">{count} {count === 1 ? singular : `${singular}s`} found{filtersActive ? ' for the selected filters' : ''}.</p>;
}
