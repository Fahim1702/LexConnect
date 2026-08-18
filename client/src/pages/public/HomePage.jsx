import { useEffect, useState } from 'react';
import {
  ArrowRight, BadgeCheck, BriefcaseBusiness, Building2, FileCheck2, HeartHandshake,
  Landmark, MessageSquareText, ReceiptText, Scale, SearchCheck, ShieldCheck, Star
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import { EmptyState, ErrorAlert, Loading } from '../../components/Ui.jsx';
import { PersonAvatar, SectionHeading } from '../../components/public/PublicUi.jsx';
import usePageTitle from '../../hooks/usePageTitle.js';

const icons = { Building2, HeartHandshake, Landmark, ShieldCheck, ReceiptText, BriefcaseBusiness, Scale };
const steps = [
  { icon: SearchCheck, title: 'Explore your options', text: 'Browse services and lawyer profiles to understand the support available.' },
  { icon: MessageSquareText, title: 'Describe your matter', text: 'Send a short consultation request as a guest or registered client.' },
  { icon: FileCheck2, title: 'Track the next steps', text: 'Registered clients can follow assignment and progress from their dashboard.' }
];

export default function HomePage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  usePageTitle('Legal services and lawyer directory');

  useEffect(() => {
    const controller = new AbortController();
    api.get('/public/home', { signal: controller.signal })
      .then((response) => setData(response.data.data))
      .catch((requestError) => requestError.name !== 'CanceledError' && setError(requestError.message));
    return () => controller.abort();
  }, []);

  return (
    <>
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_70%_20%,#c89b52_0,transparent_28%),radial-gradient(circle_at_20%_80%,#3e8069_0,transparent_32%)]" />
        <div className="container-page relative grid min-h-[620px] items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <p className="eyebrow">Legal help, made clearer</p>
            <h1 className="max-w-3xl font-display text-5xl font-bold leading-[1.08] sm:text-6xl">Trusted legal support for life and business.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/70">Explore services, meet experienced lawyers, and submit a consultation request through one clear platform.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link className="btn-primary !bg-gold !text-ink hover:!bg-white" to="/consultation">Request consultation <ArrowRight size={18} aria-hidden="true" /></Link>
              <Link className="btn-secondary !border-white/40 !text-white hover:!bg-white/10" to="/lawyers">Find a lawyer</Link>
            </div>
            <div className="mt-9 flex flex-col gap-3 text-sm text-white/70 sm:flex-row sm:gap-6">
              <span className="flex gap-2"><BadgeCheck className="text-gold" size={19} aria-hidden="true" />Verified role-based profiles</span>
              <span className="flex gap-2"><BadgeCheck className="text-gold" size={19} aria-hidden="true" />Trackable consultation requests</span>
            </div>
          </div>
          <div className="relative hidden lg:block" aria-hidden="true">
            <div className="mx-auto aspect-square max-w-md rounded-[3rem] border border-white/10 bg-white/5 p-10 shadow-2xl backdrop-blur"><Scale className="h-full w-full text-gold/70" strokeWidth={0.7} /></div>
            <div className="absolute -bottom-5 -left-4 rounded-2xl bg-white p-5 text-ink shadow-soft"><p className="text-3xl font-bold text-forest">{data?.stats?.lawyerCount ?? '—'}+</p><p className="text-sm text-slate-500">Active lawyers</p></div>
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="container-page">
          <SectionHeading eyebrow="Practice areas" title="Legal services for the moments that matter" description="Start with the area closest to your concern. Each service connects to relevant lawyers and case studies." linkTo="/services" linkLabel="View all services" />
          {error && <div className="mt-8"><ErrorAlert message={error} /></div>}
          {!data && !error ? <Loading /> : data?.services?.length ? (
            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {data.services.map((service) => {
                const Icon = icons[service.icon] || Scale;
                return <Link className="interactive-card group" key={service._id} to={`/services/${service.slug}`}><span className="inline-flex rounded-xl bg-sage p-3 text-forest"><Icon aria-hidden="true" /></span><h3 className="mt-5 text-xl font-bold group-hover:text-forest">{service.title}</h3><p className="mt-3 leading-7 text-slate-600">{service.summary}</p><span className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-forest">Learn more <ArrowRight size={15} aria-hidden="true" /></span></Link>;
              })}
            </div>
          ) : data && <div className="mt-8"><EmptyState title="Services are being prepared" text="Please check again soon." /></div>}
        </div>
      </section>

      <section className="section-pad bg-white">
        <div className="container-page">
          <SectionHeading eyebrow="Simple process" title="From question to consultation" description="The platform keeps the first steps structured without pretending that every legal matter is the same." />
          <div className="mt-10 grid gap-5 md:grid-cols-3">{steps.map((step, index) => <article className="rounded-2xl bg-cream p-6" key={step.title}><div className="flex items-center justify-between"><span className="rounded-xl bg-sage p-3 text-forest"><step.icon aria-hidden="true" /></span><span className="font-display text-3xl font-bold text-gold/60">0{index + 1}</span></div><h3 className="mt-5 text-xl font-bold">{step.title}</h3><p className="mt-3 leading-7 text-slate-600">{step.text}</p></article>)}</div>
        </div>
      </section>

      <section className="section-pad">
        <div className="container-page">
          <SectionHeading eyebrow="Our professionals" title="Meet the legal team" description="Review experience, practice areas, education, and consultation information before making a request." linkTo="/lawyers" linkLabel="Browse all lawyers" />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{data?.lawyers?.map((lawyer) => <Link className="interactive-card group" key={lawyer._id} to={`/lawyers/${lawyer.slug}`}><PersonAvatar name={lawyer.user?.name} photoUrl={lawyer.photoUrl} /><h3 className="mt-5 text-xl font-bold group-hover:text-forest">{lawyer.user?.name}</h3><p className="text-sm font-semibold text-gold">{lawyer.designation}</p><p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{lawyer.bio}</p><p className="mt-4 text-sm font-bold text-forest">{lawyer.experienceYears} years of experience</p></Link>)}</div>
        </div>
      </section>

      {data?.caseStudies?.length > 0 && <section className="section-pad bg-ink text-white"><div className="container-page"><SectionHeading eyebrow="Selected work" title="How legal strategy creates clarity" description="Anonymized examples explain the challenge, approach, and outcome." linkTo="/case-studies" linkLabel="View case studies" dark /><div className="mt-10 grid gap-5 lg:grid-cols-3">{data.caseStudies.map((item) => <Link className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-gold/60 hover:bg-white/10" key={item._id} to={`/case-studies/${item.slug}`}><span className="text-xs font-bold uppercase tracking-wider text-gold">{item.service?.title}</span><h3 className="mt-3 text-2xl font-bold">{item.title}</h3><p className="mt-3 leading-7 text-white/65">{item.summary}</p></Link>)}</div></div></section>}

      <section className="section-pad bg-sage">
        <div className="container-page grid gap-10 lg:grid-cols-2"><div><p className="eyebrow">Client feedback</p><h2 className="page-title">A clearer path forward</h2><p className="mt-5 max-w-lg leading-7 text-slate-600">Testimonials appear only after a resolved consultation and administrator approval.</p></div><div className="grid gap-4">{data?.testimonials?.length ? data.testimonials.map((item) => <blockquote className="card" key={item._id}><div className="flex gap-1 text-gold" aria-label={`${item.rating} out of 5 stars`}>{Array.from({ length: item.rating }, (_, index) => <Star key={index} size={17} fill="currentColor" aria-hidden="true" />)}</div><p className="mt-4 leading-7 text-slate-700">“{item.comment}”</p><footer className="mt-4 text-sm font-bold">{item.client?.name}</footer></blockquote>) : <p className="rounded-2xl bg-white/60 p-6 text-slate-600">Approved client feedback will appear here.</p>}</div></div>
      </section>
    </>
  );
}
