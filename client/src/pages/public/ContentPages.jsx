import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../api/client.js';
import { EmptyState, ErrorAlert, Loading, formatDate } from '../../components/Ui.jsx';

export function CaseStudiesPage() {
  const [items, setItems] = useState(null); const [error, setError] = useState('');
  useEffect(() => { api.get('/public/case-studies').then((res) => setItems(res.data.items)).catch((err) => setError(err.message)); }, []);
  return <div className="section-pad"><div className="container-page"><p className="eyebrow">Selected work</p><h1 className="page-title">Case studies</h1><p className="mt-4 max-w-2xl text-slate-600">Anonymized examples showing the challenge, legal approach, and outcome.</p><ErrorAlert message={error} />{!items ? <Loading /> : items.length ? <div className="mt-10 grid gap-5 md:grid-cols-2">{items.map((item) => <Link className="card group" key={item._id} to={`/case-studies/${item.slug}`}><span className="text-xs font-bold uppercase text-gold">{item.service?.title}</span><h2 className="mt-3 text-2xl font-bold group-hover:text-forest">{item.title}</h2><p className="mt-3 leading-7 text-slate-600">{item.summary}</p></Link>)}</div> : <EmptyState />}</div></div>;
}

export function CaseStudyDetailPage() {
  const { identifier } = useParams(); const [item, setItem] = useState(null); const [error, setError] = useState('');
  useEffect(() => { api.get(`/public/case-studies/${identifier}`).then((res) => setItem(res.data.item)).catch((err) => setError(err.message)); }, [identifier]);
  if (error) return <div className="container-page section-pad"><ErrorAlert message={error} /></div>; if (!item) return <Loading />;
  return <article className="section-pad"><div className="container-page max-w-4xl"><p className="eyebrow">{item.service?.title}</p><h1 className="page-title">{item.title}</h1><p className="mt-6 text-xl leading-8 text-slate-600">{item.summary}</p><div className="mt-10 grid gap-5"><section className="card"><h2 className="text-2xl font-bold">The challenge</h2><p className="mt-4 whitespace-pre-line leading-8 text-slate-700">{item.challenge}</p></section><section className="card"><h2 className="text-2xl font-bold">Our approach</h2><p className="mt-4 whitespace-pre-line leading-8 text-slate-700">{item.approach}</p></section><section className="rounded-2xl bg-forest p-7 text-white"><h2 className="text-2xl font-bold">The outcome</h2><p className="mt-4 whitespace-pre-line leading-8 text-white/80">{item.outcome}</p></section></div></div></article>;
}

export function BlogPage() {
  const [items, setItems] = useState(null); const [error, setError] = useState('');
  useEffect(() => { api.get('/public/blog').then((res) => setItems(res.data.items)).catch((err) => setError(err.message)); }, []);
  return <div className="section-pad"><div className="container-page"><p className="eyebrow">Legal insights</p><h1 className="page-title">From our blog</h1><ErrorAlert message={error} />{!items ? <Loading /> : items.length ? <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{items.map((item) => <Link className="card group" key={item._id} to={`/blog/${item.slug}`}><span className="text-xs font-bold uppercase text-gold">{item.category}</span><h2 className="mt-3 text-2xl font-bold group-hover:text-forest">{item.title}</h2><p className="mt-3 text-slate-600">{item.excerpt}</p><p className="mt-5 text-xs text-slate-500">{item.author?.name} · {formatDate(item.publishedAt)}</p></Link>)}</div> : <EmptyState />}</div></div>;
}

export function BlogDetailPage() {
  const { identifier } = useParams(); const [item, setItem] = useState(null); const [error, setError] = useState('');
  useEffect(() => { api.get(`/public/blog/${identifier}`).then((res) => setItem(res.data.item)).catch((err) => setError(err.message)); }, [identifier]);
  if (error) return <div className="container-page section-pad"><ErrorAlert message={error} /></div>; if (!item) return <Loading />;
  return <article className="section-pad"><div className="container-page max-w-3xl"><p className="eyebrow">{item.category}</p><h1 className="page-title">{item.title}</h1><p className="mt-5 text-sm text-slate-500">By {item.author?.name} · {formatDate(item.publishedAt)}</p><p className="mt-8 border-y py-6 text-xl leading-8 text-slate-600">{item.excerpt}</p><div className="mt-8 whitespace-pre-line text-lg leading-9 text-slate-700">{item.content}</div></div></article>;
}

export function FAQPage() {
  const [items, setItems] = useState(null); const [error, setError] = useState('');
  useEffect(() => { api.get('/public/faqs').then((res) => setItems(res.data.items)).catch((err) => setError(err.message)); }, []);
  const groups = useMemo(() => (items || []).reduce((result, item) => ({ ...result, [item.category]: [...(result[item.category] || []), item] }), {}), [items]);
  return <div className="section-pad"><div className="container-page max-w-4xl"><p className="eyebrow">Help center</p><h1 className="page-title">Frequently asked questions</h1><ErrorAlert message={error} />{!items ? <Loading /> : Object.entries(groups).map(([category, faqs]) => <section className="mt-10" key={category}><h2 className="text-2xl font-bold text-forest">{category}</h2><div className="mt-4 grid gap-3">{faqs.map((item) => <details className="card group !p-0" key={item._id}><summary className="cursor-pointer list-none p-5 font-bold">{item.question}<span className="float-right text-gold group-open:rotate-45">+</span></summary><p className="border-t px-5 py-4 leading-7 text-slate-600">{item.answer}</p></details>)}</div></section>)}</div></div>;
}
