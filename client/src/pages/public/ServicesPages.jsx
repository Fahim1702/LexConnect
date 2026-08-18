import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Search, UsersRound } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import api from '../../api/client.js';
import { EmptyState, ErrorAlert, Loading } from '../../components/Ui.jsx';
import { Breadcrumbs, PageHero, PersonAvatar, ResultSummary } from '../../components/public/PublicUi.jsx';
import useDebouncedValue from '../../hooks/useDebouncedValue.js';
import usePageTitle from '../../hooks/usePageTitle.js';

export function ServicesPage() {
  const [items, setItems] = useState([]);
  const [allServices, setAllServices] = useState([]);
  const [filters, setFilters] = useState({ q: '', category: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const debouncedQuery = useDebouncedValue(filters.q);
  usePageTitle('Legal services');

  useEffect(() => {
    api.get('/public/services', { params: { limit: 50 } })
      .then((response) => setAllServices(response.data.items))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    api.get('/public/services', { params: { q: debouncedQuery, category: filters.category }, signal: controller.signal })
      .then((response) => setItems(response.data.items))
      .catch((requestError) => requestError.name !== 'CanceledError' && setError(requestError.message))
      .finally(() => !controller.signal.aborted && setLoading(false));
    return () => controller.abort();
  }, [debouncedQuery, filters.category]);

  const categories = useMemo(() => [...new Set(allServices.map((item) => item.category))].sort(), [allServices]);
  const clearFilters = () => setFilters({ q: '', category: '' });
  const filtersActive = Boolean(filters.q || filters.category);

  return (
    <>
      <PageHero eyebrow="Practice areas" title="Legal services for life and business" description="Browse active practice areas, understand what each service covers, and find lawyers with relevant experience." />
      <section className="section-pad">
        <div className="container-page">
          <div className="filter-panel grid gap-4 md:grid-cols-[1fr_260px_auto] md:items-end" role="search">
            <label><span className="label">Search services</span><span className="relative block"><Search className="pointer-events-none absolute left-4 top-3.5 text-slate-400" size={20} aria-hidden="true" /><input className="input pl-11" value={filters.q} onChange={(event) => setFilters({ ...filters, q: event.target.value })} placeholder="Corporate, property, family…" /></span></label>
            <label><span className="label">Category</span><select className="input" value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })}><option value="">All categories</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
            <button className="btn-secondary !py-3" type="button" onClick={clearFilters} disabled={!filtersActive}>Clear</button>
          </div>
          <div className="mt-6 flex items-center justify-between"><ResultSummary count={items.length} singular="service" filtersActive={filtersActive} /></div>
          <div className="mt-6"><ErrorAlert message={error} />{loading ? <Loading label="Finding services…" /> : items.length ? <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{items.map((item) => <Link className="interactive-card group flex flex-col" key={item._id} to={`/services/${item.slug}`}><span className="text-xs font-bold uppercase tracking-wider text-gold">{item.category}</span><h2 className="mt-3 text-2xl font-bold group-hover:text-forest">{item.title}</h2><p className="mt-3 flex-1 leading-7 text-slate-600">{item.summary}</p><span className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-forest">View service <ArrowRight size={16} aria-hidden="true" /></span></Link>)}</div> : <EmptyState title="No services found" text="Try a different phrase or clear the category filter." />}</div>
        </div>
      </section>
    </>
  );
}

export function ServiceDetailPage() {
  const { identifier } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  usePageTitle(data?.service?.title || 'Service details');

  useEffect(() => {
    const controller = new AbortController();
    api.get(`/public/services/${identifier}`, { signal: controller.signal })
      .then((response) => setData(response.data))
      .catch((requestError) => requestError.name !== 'CanceledError' && setError(requestError.message));
    return () => controller.abort();
  }, [identifier]);

  if (error) return <div className="container-page section-pad"><ErrorAlert message={error} /><Link className="btn-secondary" to="/services"><ArrowLeft size={17} />Back to services</Link></div>;
  if (!data) return <Loading label="Loading service details…" />;

  const { service, lawyers, caseStudies } = data;
  return (
    <>
      <PageHero eyebrow={service.category} title={service.title} description={service.summary}>
        <Link className="btn-primary !bg-gold !text-ink hover:!bg-white" to={`/consultation?service=${service._id}`}>Request this service <ArrowRight size={18} /></Link>
      </PageHero>
      <section className="section-pad">
        <div className="container-page">
          <Breadcrumbs items={[{ label: 'Services', to: '/services' }, { label: service.title }]} />
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <article className="card"><h2 className="text-3xl font-bold">About this service</h2><p className="mt-5 whitespace-pre-line text-base leading-8 text-slate-700 sm:text-lg">{service.description}</p><div className="mt-8 rounded-2xl bg-sage p-5"><h3 className="font-sans text-sm font-bold uppercase tracking-wider text-forest">Not sure where to begin?</h3><p className="mt-2 leading-7 text-slate-700">Submit a short request. The administration team can review it before assigning a lawyer.</p><Link className="mt-4 inline-flex items-center gap-1 font-bold text-forest" to={`/consultation?service=${service._id}`}>Start a request <ArrowRight size={16} /></Link></div></article>
            <aside className="self-start"><div className="flex items-center gap-2"><UsersRound className="text-gold" aria-hidden="true" /><h2 className="text-2xl font-bold">Relevant lawyers</h2></div><div className="mt-5 grid gap-4">{lawyers.length ? lawyers.map((lawyer) => <Link className="interactive-card !p-4" key={lawyer._id} to={`/lawyers/${lawyer.slug}`}><div className="flex items-center gap-4"><PersonAvatar name={lawyer.user?.name} photoUrl={lawyer.photoUrl} /><div><p className="font-bold">{lawyer.user?.name}</p><p className="text-sm font-semibold text-gold">{lawyer.designation}</p><p className="mt-1 text-xs text-slate-500">{lawyer.experienceYears} years of experience</p></div></div></Link>) : <p className="rounded-xl border bg-white p-5 text-slate-500">No lawyer is assigned to this service yet.</p>}</div></aside>
          </div>
          {caseStudies.length > 0 && <section className="mt-14"><h2 className="text-3xl font-bold">Related case studies</h2><div className="mt-5 grid gap-5 md:grid-cols-2">{caseStudies.map((item) => <Link className="interactive-card" to={`/case-studies/${item.slug}`} key={item._id}><h3 className="text-xl font-bold">{item.title}</h3><p className="mt-3 leading-7 text-slate-600">{item.summary}</p><span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-forest">Read the case study <ArrowRight size={15} /></span></Link>)}</div></section>}
        </div>
      </section>
    </>
  );
}
