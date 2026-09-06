import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, BadgeCheck, Languages, MapPin, Search, WalletCards } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import api from '../../api/client.js';
import { EmptyState, ErrorAlert, Loading } from '../../components/Ui.jsx';
import { Breadcrumbs, PageHero, PersonAvatar, ResultSummary } from '../../components/public/PublicUi.jsx';
import useDebouncedValue from '../../hooks/useDebouncedValue.js';
import usePageTitle from '../../hooks/usePageTitle.js';

export function LawyersPage() {
  const [items, setItems] = useState([]);
  const [services, setServices] = useState([]);
  const [filters, setFilters] = useState({ q: '', service: '', minExperience: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const debouncedQuery = useDebouncedValue(filters.q);
  usePageTitle('Lawyer directory');

  useEffect(() => {
    api.get('/public/services', { params: { limit: 50 } })
      .then((response) => setServices(response.data.items))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    api.get('/public/lawyers', { params: { ...filters, q: debouncedQuery, limit: 50 }, signal: controller.signal })
      .then((response) => setItems(response.data.items))
      .catch((requestError) => requestError.name !== 'CanceledError' && setError(requestError.message))
      .finally(() => !controller.signal.aborted && setLoading(false));
    return () => controller.abort();
  }, [debouncedQuery, filters.service, filters.minExperience]);

  const clearFilters = () => setFilters({ q: '', service: '', minExperience: '' });
  const filtersActive = Boolean(filters.q || filters.service || filters.minExperience);

  return (
    <>
      <PageHero eyebrow="Lawyer directory" title="Find the right legal professional" description="Compare active lawyer profiles by practice area and experience before sending a consultation request." />
      <section className="section-pad">
        <div className="container-page">
          <div className="filter-panel grid gap-4 lg:grid-cols-[1fr_260px_210px_auto] lg:items-end" role="search">
            <label><span className="label">Search lawyers</span><span className="relative block"><Search className="pointer-events-none absolute left-4 top-3.5 text-slate-400" size={20} aria-hidden="true" /><input className="input pl-11" placeholder="Name, designation, or expertise…" value={filters.q} onChange={(event) => setFilters({ ...filters, q: event.target.value })} /></span></label>
            <label><span className="label">Practice area</span><select className="input" value={filters.service} onChange={(event) => setFilters({ ...filters, service: event.target.value })}><option value="">All services</option>{services.map((item) => <option key={item._id} value={item._id}>{item.title}</option>)}</select></label>
            <label><span className="label">Minimum experience</span><select className="input" value={filters.minExperience} onChange={(event) => setFilters({ ...filters, minExperience: event.target.value })}><option value="">Any experience</option><option value="5">5+ years</option><option value="10">10+ years</option><option value="15">15+ years</option></select></label>
            <button className="btn-secondary !py-3" type="button" onClick={clearFilters} disabled={!filtersActive}>Clear</button>
          </div>
          <div className="mt-6"><ResultSummary count={items.length} singular="lawyer" filtersActive={filtersActive} /></div>
          <div className="mt-6"><ErrorAlert message={error} />{loading ? <Loading label="Finding lawyers…" /> : items.length ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{items.map((lawyer) => <Link className="interactive-card group flex flex-col" key={lawyer._id} to={`/lawyers/${lawyer.slug}`}><PersonAvatar name={lawyer.user?.name} photoUrl={lawyer.photoUrl} /><div className="mt-5 flex items-center gap-2"><h2 className="text-xl font-bold group-hover:text-forest">{lawyer.user?.name}</h2><BadgeCheck className="shrink-0 text-gold" size={18} aria-label="Active lawyer profile" /></div><p className="text-sm font-semibold text-gold">{lawyer.designation}</p><p className="mt-3 line-clamp-3 flex-1 text-sm leading-6 text-slate-600">{lawyer.bio}</p><div className="mt-4 flex flex-wrap gap-2">{lawyer.services?.slice(0, 3).map((service) => <span key={service._id} className="rounded-full bg-sage px-2.5 py-1 text-xs font-semibold text-forest">{service.title}</span>)}</div><div className="mt-5 flex items-center justify-between border-t pt-4 text-sm"><span className="font-bold text-forest">{lawyer.experienceYears} years</span><span className="inline-flex items-center gap-1 font-bold text-forest">View profile <ArrowRight size={15} /></span></div></Link>)}</div> : <EmptyState title="No lawyers found" text="Try clearing one or more filters." />}</div>
        </div>
      </section>
    </>
  );
}

export function LawyerDetailPage() {
  const { identifier } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  usePageTitle(data?.lawyer?.user?.name || 'Lawyer profile');

  useEffect(() => {
    const controller = new AbortController();
    api.get(`/public/lawyers/${identifier}`, { signal: controller.signal })
      .then((response) => setData(response.data))
      .catch((requestError) => requestError.name !== 'CanceledError' && setError(requestError.message));
    return () => controller.abort();
  }, [identifier]);

  if (error) return <div className="container-page section-pad"><ErrorAlert message={error} /><Link className="btn-secondary" to="/lawyers"><ArrowLeft size={17} />Back to directory</Link></div>;
  if (!data) return <Loading label="Loading lawyer profile…" />;

  const { lawyer, caseStudies } = data;
  const name = lawyer.user?.name;
  return (
    <>
      <PageHero eyebrow={lawyer.designation} title={name} description={`${lawyer.experienceYears} years of experience · ${lawyer.services?.map((service) => service.title).join(' · ') || 'Legal professional'}`}>
        <Link className="btn-primary !bg-gold !text-ink hover:!bg-white" to={`/consultation?lawyer=${lawyer._id}`}>Request consultation <ArrowRight size={18} /></Link>
      </PageHero>
      <section className="section-pad">
        <div className="container-page">
          <Breadcrumbs items={[{ label: 'Lawyers', to: '/lawyers' }, { label: name }]} />
          <div className="grid gap-8 lg:grid-cols-[350px_1fr]">
            <aside className="card self-start lg:sticky lg:top-24"><PersonAvatar name={name} photoUrl={lawyer.photoUrl} size="xl" /><div className="mt-6 flex items-center gap-2"><h2 className="text-2xl font-bold">{name}</h2><BadgeCheck className="shrink-0 text-gold" size={20} aria-label="Active lawyer profile" /></div><p className="font-semibold text-gold">{lawyer.designation}</p><div className="mt-6 grid gap-4 border-t pt-5 text-sm"><p className="flex gap-3 text-slate-600"><MapPin className="shrink-0 text-gold" size={19} aria-hidden="true" />{lawyer.chamberAddress || 'Dhaka, Bangladesh'}</p><p className="flex gap-3 text-slate-600"><Languages className="shrink-0 text-gold" size={19} aria-hidden="true" />{lawyer.languages?.join(', ') || 'Bangla, English'}</p><p className="flex gap-3 text-slate-600"><WalletCards className="shrink-0 text-gold" size={19} aria-hidden="true" />Consultation fee: {lawyer.consultationFee ? `৳${lawyer.consultationFee.toLocaleString()}` : 'Contact for details'}</p></div><Link className="btn-primary mt-6 w-full" to={`/consultation?lawyer=${lawyer._id}`}>Request consultation</Link></aside>
            <main className="space-y-6"><section className="card"><h2 className="text-3xl font-bold">Professional profile</h2><p className="mt-4 whitespace-pre-line leading-8 text-slate-700">{lawyer.bio}</p><dl className="mt-7 grid gap-5 border-t pt-6 sm:grid-cols-2"><div><dt className="text-sm text-slate-500">Experience</dt><dd className="font-bold">{lawyer.experienceYears} years</dd></div><div><dt className="text-sm text-slate-500">Bar Council number</dt><dd className="font-bold">{lawyer.barCouncilNumber}</dd></div><div className="sm:col-span-2"><dt className="text-sm text-slate-500">Education</dt><dd className="mt-1 font-bold">{lawyer.education?.join(' · ') || 'Not specified'}</dd></div></dl></section><section className="card"><h2 className="text-2xl font-bold">Practice areas</h2><div className="mt-5 grid gap-3 sm:grid-cols-2">{lawyer.services?.length ? lawyer.services.map((service) => <Link className="rounded-xl bg-sage p-4 font-bold text-forest transition hover:bg-forest hover:text-white" key={service._id} to={`/services/${service.slug}`}>{service.title}</Link>) : <p className="text-slate-500">Practice areas have not been added yet.</p>}</div></section>{caseStudies.length > 0 && <section className="card"><h2 className="text-2xl font-bold">Related case studies</h2><div className="mt-2 divide-y">{caseStudies.map((item) => <Link className="group block py-5 first:pt-3" key={item._id} to={`/case-studies/${item.slug}`}><h3 className="font-bold text-forest group-hover:text-ink">{item.title}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{item.summary}</p></Link>)}</div></section>}</main>
          </div>
        </div>
      </section>
    </>
  );
}
