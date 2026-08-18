import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Search } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import api from '../../api/client.js';
import { EmptyState, ErrorAlert, Loading, formatDate } from '../../components/Ui.jsx';
import { Breadcrumbs, PageHero, ResultSummary } from '../../components/public/PublicUi.jsx';
import useDebouncedValue from '../../hooks/useDebouncedValue.js';
import usePageTitle from '../../hooks/usePageTitle.js';

export function CaseStudiesPage() {
  const [items, setItems] = useState(null);
  const [services, setServices] = useState([]);
  const [service, setService] = useState('');
  const [error, setError] = useState('');
  usePageTitle('Case studies');

  useEffect(() => {
    api.get('/public/services', { params: { limit: 50 } }).then((response) => setServices(response.data.items)).catch(() => {});
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setItems(null);
    setError('');
    api.get('/public/case-studies', { params: { service }, signal: controller.signal })
      .then((response) => setItems(response.data.items))
      .catch((requestError) => requestError.name !== 'CanceledError' && setError(requestError.message));
    return () => controller.abort();
  }, [service]);

  return <><PageHero eyebrow="Selected work" title="Case studies" description="Anonymized examples explain the legal challenge, the approach taken, and the resulting outcome." /><section className="section-pad"><div className="container-page"><div className="filter-panel max-w-lg"><label><span className="label">Filter by legal service</span><select className="input" value={service} onChange={(event) => setService(event.target.value)}><option value="">All services</option>{services.map((item) => <option key={item._id} value={item._id}>{item.title}</option>)}</select></label></div>{items && <div className="mt-6"><ResultSummary count={items.length} singular="case study" filtersActive={Boolean(service)} /></div>}<div className="mt-6"><ErrorAlert message={error} />{!items ? <Loading label="Loading case studies…" /> : items.length ? <div className="grid gap-5 md:grid-cols-2">{items.map((item) => <Link className="interactive-card group flex flex-col" key={item._id} to={`/case-studies/${item.slug}`}><span className="text-xs font-bold uppercase tracking-wider text-gold">{item.service?.title}</span><h2 className="mt-3 text-2xl font-bold group-hover:text-forest">{item.title}</h2><p className="mt-3 flex-1 leading-7 text-slate-600">{item.summary}</p><span className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-forest">Read case study <ArrowRight size={16} /></span></Link>)}</div> : <EmptyState title="No case studies found" text="Choose another service or view all case studies." />}</div></div></section></>;
}

export function CaseStudyDetailPage() {
  const { identifier } = useParams();
  const [item, setItem] = useState(null);
  const [error, setError] = useState('');
  usePageTitle(item?.title || 'Case study');

  useEffect(() => {
    const controller = new AbortController();
    api.get(`/public/case-studies/${identifier}`, { signal: controller.signal }).then((response) => setItem(response.data.item)).catch((requestError) => requestError.name !== 'CanceledError' && setError(requestError.message));
    return () => controller.abort();
  }, [identifier]);

  if (error) return <div className="container-page section-pad"><ErrorAlert message={error} /><Link className="btn-secondary" to="/case-studies"><ArrowLeft size={17} />Back to case studies</Link></div>;
  if (!item) return <Loading label="Loading case study…" />;
  return <><PageHero eyebrow={item.service?.title || 'Case study'} title={item.title} description={item.summary} /><article className="section-pad"><div className="container-page max-w-4xl"><Breadcrumbs items={[{ label: 'Case Studies', to: '/case-studies' }, { label: item.title }]} /><div className="grid gap-5"><section className="card"><p className="eyebrow">01 · Context</p><h2 className="text-3xl font-bold">The challenge</h2><p className="mt-4 whitespace-pre-line leading-8 text-slate-700">{item.challenge}</p></section><section className="card"><p className="eyebrow">02 · Strategy</p><h2 className="text-3xl font-bold">Our approach</h2><p className="mt-4 whitespace-pre-line leading-8 text-slate-700">{item.approach}</p></section><section className="rounded-2xl bg-forest p-7 text-white shadow-soft"><p className="eyebrow">03 · Result</p><h2 className="text-3xl font-bold">The outcome</h2><p className="mt-4 whitespace-pre-line leading-8 text-white/80">{item.outcome}</p></section></div><div className="mt-8 flex flex-wrap gap-3"><Link className="btn-primary" to={`/consultation?service=${item.service?._id || ''}`}>Discuss a similar matter</Link><Link className="btn-secondary" to="/case-studies">More case studies</Link></div></div></article></>;
}

export function BlogPage() {
  const [items, setItems] = useState(null);
  const [allPosts, setAllPosts] = useState([]);
  const [filters, setFilters] = useState({ q: '', category: '' });
  const [error, setError] = useState('');
  const debouncedQuery = useDebouncedValue(filters.q);
  usePageTitle('Legal blog');

  useEffect(() => {
    api.get('/public/blog', { params: { limit: 50 } }).then((response) => setAllPosts(response.data.items)).catch(() => {});
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setItems(null);
    setError('');
    api.get('/public/blog', { params: { q: debouncedQuery, category: filters.category, limit: 50 }, signal: controller.signal }).then((response) => setItems(response.data.items)).catch((requestError) => requestError.name !== 'CanceledError' && setError(requestError.message));
    return () => controller.abort();
  }, [debouncedQuery, filters.category]);

  const categories = useMemo(() => [...new Set(allPosts.map((item) => item.category))].sort(), [allPosts]);
  const filtersActive = Boolean(filters.q || filters.category);
  return <><PageHero eyebrow="Legal insights" title="Guides and perspectives from our team" description="Read general legal information written by lawyers and administrators. Articles are educational and are not a substitute for advice on a specific matter." /><section className="section-pad"><div className="container-page"><div className="filter-panel grid gap-4 md:grid-cols-[1fr_260px_auto] md:items-end" role="search"><label><span className="label">Search articles</span><span className="relative block"><Search className="pointer-events-none absolute left-4 top-3.5 text-slate-400" size={20} /><input className="input pl-11" value={filters.q} onChange={(event) => setFilters({ ...filters, q: event.target.value })} placeholder="Search by title or topic…" /></span></label><label><span className="label">Category</span><select className="input" value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })}><option value="">All categories</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></label><button className="btn-secondary !py-3" type="button" disabled={!filtersActive} onClick={() => setFilters({ q: '', category: '' })}>Clear</button></div>{items && <div className="mt-6"><ResultSummary count={items.length} singular="article" filtersActive={filtersActive} /></div>}<div className="mt-6"><ErrorAlert message={error} />{!items ? <Loading label="Loading articles…" /> : items.length ? <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{items.map((item) => <Link className="interactive-card group flex flex-col" key={item._id} to={`/blog/${item.slug}`}><span className="text-xs font-bold uppercase tracking-wider text-gold">{item.category}</span><h2 className="mt-3 text-2xl font-bold group-hover:text-forest">{item.title}</h2><p className="mt-3 flex-1 leading-7 text-slate-600">{item.excerpt}</p><div className="mt-5 border-t pt-4 text-xs text-slate-500"><span className="font-semibold text-slate-700">{item.author?.name}</span> · {formatDate(item.publishedAt)}</div></Link>)}</div> : <EmptyState title="No articles found" text="Try a different search or category." />}</div></div></section></>;
}

export function BlogDetailPage() {
  const { identifier } = useParams();
  const [item, setItem] = useState(null);
  const [error, setError] = useState('');
  usePageTitle(item?.title || 'Blog article');

  useEffect(() => {
    const controller = new AbortController();
    api.get(`/public/blog/${identifier}`, { signal: controller.signal }).then((response) => setItem(response.data.item)).catch((requestError) => requestError.name !== 'CanceledError' && setError(requestError.message));
    return () => controller.abort();
  }, [identifier]);

  if (error) return <div className="container-page section-pad"><ErrorAlert message={error} /><Link className="btn-secondary" to="/blog"><ArrowLeft size={17} />Back to blog</Link></div>;
  if (!item) return <Loading label="Loading article…" />;
  return <article className="section-pad"><div className="container-page max-w-3xl"><Breadcrumbs items={[{ label: 'Blog', to: '/blog' }, { label: item.title }]} /><p className="eyebrow">{item.category}</p><h1 className="page-title">{item.title}</h1><p className="mt-5 text-sm text-slate-500">By <span className="font-semibold text-slate-700">{item.author?.name}</span> · {formatDate(item.publishedAt)}</p><p className="mt-8 border-y py-6 text-xl leading-8 text-slate-600">{item.excerpt}</p><div className="mt-8 whitespace-pre-line text-lg leading-9 text-slate-700">{item.content}</div><div className="mt-12 rounded-2xl bg-sage p-6"><h2 className="text-2xl font-bold">Need advice for your situation?</h2><p className="mt-2 leading-7 text-slate-600">Articles provide general information. A lawyer can consider the facts of your individual matter.</p><Link className="btn-primary mt-5" to="/consultation">Request consultation</Link></div></div></article>;
}

export function FAQPage() {
  const [items, setItems] = useState(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  usePageTitle('Frequently asked questions');

  useEffect(() => {
    const controller = new AbortController();
    api.get('/public/faqs', { signal: controller.signal }).then((response) => setItems(response.data.items)).catch((requestError) => requestError.name !== 'CanceledError' && setError(requestError.message));
    return () => controller.abort();
  }, []);

  const filtered = useMemo(() => (items || []).filter((item) => `${item.question} ${item.answer} ${item.category}`.toLowerCase().includes(query.toLowerCase())), [items, query]);
  const groups = useMemo(() => filtered.reduce((result, item) => ({ ...result, [item.category]: [...(result[item.category] || []), item] }), {}), [filtered]);
  return <><PageHero eyebrow="Help center" title="Frequently asked questions" description="Find quick answers about accounts, consultation requests, privacy, and using LexConnect BD." /><section className="section-pad"><div className="container-page max-w-4xl"><label className="block"><span className="label">Search questions</span><span className="relative block"><Search className="pointer-events-none absolute left-4 top-3.5 text-slate-400" size={20} /><input className="input pl-11" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="What would you like to know?" /></span></label><ErrorAlert message={error} />{!items ? <Loading label="Loading questions…" /> : Object.keys(groups).length ? Object.entries(groups).map(([category, faqs]) => <section className="mt-10" key={category}><h2 className="text-2xl font-bold text-forest">{category}</h2><div className="mt-4 grid gap-3">{faqs.map((item) => <details className="card group !p-0 open:border-gold/40" key={item._id}><summary className="cursor-pointer list-none p-5 font-bold">{item.question}<span className="float-right text-gold transition group-open:rotate-45" aria-hidden="true">+</span></summary><p className="border-t px-5 py-4 leading-7 text-slate-600">{item.answer}</p></details>)}</div></section>) : <div className="mt-8"><EmptyState title="No matching questions" text="Try a shorter search phrase or contact the team." /></div>}<div className="mt-12 rounded-2xl bg-forest p-7 text-white"><h2 className="text-2xl font-bold">Still have a question?</h2><p className="mt-2 text-white/70">Send a general message, or submit a consultation request for a legal matter.</p><div className="mt-5 flex flex-wrap gap-3"><Link className="btn-primary !bg-gold !text-ink" to="/contact">Contact us</Link><Link className="btn-secondary !border-white/40 !text-white hover:!bg-white/10" to="/consultation">Request consultation</Link></div></div></div></section></>;
}
