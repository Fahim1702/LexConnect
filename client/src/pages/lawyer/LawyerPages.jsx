import { useEffect, useMemo, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import {
  CharacterCount,
  DashboardFilters,
  DashboardHeader,
  SummaryPills
} from '../../components/DashboardUi.jsx';
import LawyerAvatar from '../../components/LawyerAvatar.jsx';
import {
  EmptyState,
  ErrorAlert,
  Loading,
  StatusBadge,
  SuccessAlert,
  formatDate
} from '../../components/Ui.jsx';

const lawyerStatuses = ['in-review', 'scheduled', 'resolved'];
const includesQuery = (item, query) => !query || JSON.stringify(item).toLowerCase().includes(query.trim().toLowerCase());

function LawyerRequest({ item, busy, onUpdate }) {
  const [status, setStatus] = useState(lawyerStatuses.includes(item.status) ? item.status : 'in-review');
  const [note, setNote] = useState(item.lawyerNote || '');
  const closed = ['resolved', 'cancelled'].includes(item.status);
  const dirty = status !== item.status || note !== (item.lawyerNote || '');

  const submit = (event) => {
    event.preventDefault();
    if (!closed && dirty) onUpdate(item._id, { status, lawyerNote: note });
  };

  return (
    <article className="card">
      <div className="flex flex-wrap justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-xs text-slate-500">{item.reference}</span>
            <StatusBadge value={item.status} />
          </div>
          <h2 className="mt-2 text-xl font-bold">{item.subject}</h2>
          <p className="mt-1 break-words text-sm text-slate-500">
            {item.guestName} · {item.guestEmail} · {item.guestPhone}
          </p>
          <p className="mt-1 text-sm font-semibold text-forest">
            {item.service?.title || 'Archived service'} · Received {formatDate(item.createdAt)}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm">
          <span className="block text-xs font-bold uppercase tracking-wide text-slate-400">Preferred date</span>
          {formatDate(item.preferredDate)}
        </div>
      </div>

      <details className="mt-4 rounded-xl border border-slate-200 px-4 py-3">
        <summary className="cursor-pointer font-semibold text-forest">View case details</summary>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">{item.details}</p>
      </details>

      {closed ? (
        item.lawyerNote && <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm"><span className="font-semibold">Private note:</span> {item.lawyerNote}</div>
      ) : (
        <form className="mt-5 grid gap-4 lg:grid-cols-[220px_1fr_auto]" onSubmit={submit}>
          <label>
            <span className="label">New status</span>
            <select className="input" value={status} onChange={(event) => setStatus(event.target.value)}>
              {lawyerStatuses.map((value) => <option key={value}>{value}</option>)}
            </select>
          </label>
          <label>
            <span className="label">Private lawyer note</span>
            <textarea className="input min-h-24" maxLength={3000} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Record the next step or outcome." />
            <CharacterCount value={note} limit={3000} />
          </label>
          <button className="btn-primary self-end" disabled={busy || !dirty}>{busy ? 'Saving…' : dirty ? 'Update request' : 'No changes'}</button>
        </form>
      )}
    </article>
  );
}

export function LawyerDashboardPage() {
  const [items, setItems] = useState(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('open');
  const [busyId, setBusyId] = useState('');
  const [notice, setNotice] = useState({ error: '', success: '' });

  const load = () => api.get('/lawyer/consultations').then((response) => setItems(response.data.items));
  useEffect(() => { load().catch((error) => setNotice({ error: error.message, success: '' })); }, []);

  const visible = useMemo(() => (items || []).filter((item) => {
    const matchesStatus = statusFilter === 'all'
      || (statusFilter === 'open' ? !['resolved', 'cancelled'].includes(item.status) : item.status === statusFilter);
    return matchesStatus && includesQuery(item, query);
  }), [items, query, statusFilter]);

  const update = async (id, payload) => {
    setBusyId(id); setNotice({ error: '', success: '' });
    try {
      await api.patch(`/lawyer/consultations/${id}`, payload);
      await load();
      setNotice({ error: '', success: 'The request status and private note were updated.' });
    } catch (error) {
      setNotice({ error: error.message, success: '' });
    } finally {
      setBusyId('');
    }
  };

  return (
    <section>
      <DashboardHeader eyebrow="Lawyer dashboard" title="Assigned requests" description="Manage only the consultations assigned to your active lawyer profile." />
      <SummaryPills items={[
        ['open', (items || []).filter((item) => !['resolved', 'cancelled'].includes(item.status)).length],
        ['scheduled', (items || []).filter((item) => item.status === 'scheduled').length],
        ['resolved', (items || []).filter((item) => item.status === 'resolved').length]
      ]} />
      <DashboardFilters query={query} onQueryChange={setQuery} placeholder="Search reference, client, service, or subject…">
        <label className="min-w-44"><span className="label">Status</span><select className="input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="open">Open requests</option><option value="scheduled">Scheduled</option><option value="resolved">Resolved</option><option value="cancelled">Cancelled</option><option value="all">All requests</option></select></label>
      </DashboardFilters>
      <div className="mt-6">
        <ErrorAlert message={notice.error} /><SuccessAlert message={notice.success} />
        {items === null ? (!notice.error && <Loading label="Loading assigned requests…" />) : visible.length ? (
          <div className="grid gap-5">{visible.map((item) => <LawyerRequest key={`${item._id}:${item.updatedAt}`} item={item} busy={busyId === item._id} onUpdate={update} />)}</div>
        ) : <EmptyState title="No matching assigned requests" text="New assignments will appear here after an administrator assigns them to you." />}
      </div>
    </section>
  );
}

const toProfileForm = (profile) => ({
  designation: profile.designation || '',
  experienceYears: profile.experienceYears ?? '',
  consultationFee: profile.consultationFee ?? '',
  chamberAddress: profile.chamberAddress || '',
  education: (profile.education || []).join(', '),
  languages: (profile.languages || []).join(', '),
  services: (profile.services || []).map((service) => service._id || service),
  bio: profile.bio || '',
  photoUrl: profile.photoUrl || ''
});

export function LawyerProfilePage() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(null);
  const [initial, setInitial] = useState(null);
  const [services, setServices] = useState([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState({ error: '', success: '' });

  useEffect(() => {
    Promise.all([api.get('/lawyer/profile'), api.get('/public/service-options')])
      .then(([profileResponse, serviceResponse]) => {
        const item = profileResponse.data.profile;
        const editable = toProfileForm(item);
        setProfile(item); setForm(editable); setInitial(editable); setServices(serviceResponse.data.items);
      })
      .catch((error) => setNotice({ error: error.message, success: '' }));
  }, []);

  if (!form) return <><ErrorAlert message={notice.error} />{!notice.error && <Loading label="Loading your lawyer profile…" />}</>;

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setNotice({ error: '', success: '' });
    const payload = {
      ...form,
      experienceYears: Number(form.experienceYears || 0),
      consultationFee: Number(form.consultationFee || 0),
      education: form.education.split(',').map((value) => value.trim()).filter(Boolean),
      languages: form.languages.split(',').map((value) => value.trim()).filter(Boolean)
    };
    try {
      const { data } = await api.patch('/lawyer/profile', payload);
      const editable = toProfileForm(data.profile);
      setProfile(data.profile); setForm(editable); setInitial(editable);
      setNotice({ error: '', success: 'Your public lawyer profile was updated.' });
    } catch (error) {
      setNotice({ error: error.message, success: '' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section>
      <DashboardHeader eyebrow="Professional profile" title="My lawyer profile" description="Keep the information clients see in the lawyer directory accurate and current." />
      <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <form className="card" onSubmit={submit}>
          <ErrorAlert message={notice.error} /><SuccessAlert message={notice.success} />
          <div className="grid gap-5 sm:grid-cols-2">
            <label><span className="label">Designation</span><input className="input" required maxLength={120} value={form.designation} onChange={(event) => update('designation', event.target.value)} /></label>
            <label><span className="label">Years of experience</span><input className="input" type="number" min="0" max="70" required value={form.experienceYears} onChange={(event) => update('experienceYears', event.target.value)} /></label>
            <label><span className="label">Consultation fee (BDT)</span><input className="input" type="number" min="0" required value={form.consultationFee} onChange={(event) => update('consultationFee', event.target.value)} /></label>
            <label><span className="label">Chamber address</span><input className="input" maxLength={300} value={form.chamberAddress} onChange={(event) => update('chamberAddress', event.target.value)} /></label>
            <label><span className="label">Education (comma separated)</span><input className="input" value={form.education} onChange={(event) => update('education', event.target.value)} /></label>
            <label><span className="label">Languages (comma separated)</span><input className="input" value={form.languages} onChange={(event) => update('languages', event.target.value)} /></label>
            <label className="sm:col-span-2"><span className="label">Photo URL or /path</span><input className="input" value={form.photoUrl} onChange={(event) => update('photoUrl', event.target.value)} /></label>
            <label className="sm:col-span-2"><span className="label">Services</span><select className="input min-h-32" multiple value={form.services} onChange={(event) => update('services', Array.from(event.target.selectedOptions, (option) => option.value))}>{services.map((service) => <option key={service._id} value={service._id}>{service.title}</option>)}</select><span className="mt-1 block text-xs text-slate-500">Hold Ctrl/Cmd to select more than one service.</span></label>
            <label className="sm:col-span-2"><span className="label">Biography</span><textarea className="input min-h-40" required maxLength={3000} value={form.bio} onChange={(event) => update('bio', event.target.value)} /><CharacterCount value={form.bio} limit={3000} /></label>
          </div>
          <div className="mt-6 flex flex-wrap justify-end gap-3"><button type="button" className="btn-secondary" disabled={!dirty || busy} onClick={() => setForm(initial)}>Discard changes</button><button className="btn-primary" disabled={!dirty || busy}>{busy ? 'Saving…' : dirty ? 'Save profile' : 'Profile saved'}</button></div>
        </form>

        <aside className="card h-fit xl:sticky xl:top-8">
          <p className="eyebrow">Directory preview</p>
          <div className="flex items-center gap-4"><LawyerAvatar lawyer={{ ...profile, photoUrl: form.photoUrl }} className="h-20 w-20" /><div><h2 className="text-xl font-bold">{profile.user?.name}</h2><p className="text-sm text-slate-500">{form.designation || 'Designation'}</p></div></div>
          <dl className="mt-5 grid gap-3 text-sm"><div><dt className="font-semibold">Experience</dt><dd className="text-slate-600">{form.experienceYears || 0} years</dd></div><div><dt className="font-semibold">Fee</dt><dd className="text-slate-600">BDT {Number(form.consultationFee || 0).toLocaleString()}</dd></div><div><dt className="font-semibold">Languages</dt><dd className="text-slate-600">{form.languages || 'Not supplied'}</dd></div></dl>
        </aside>
      </div>
    </section>
  );
}

export function LawyerBlogPage() {
  const blank = { title: '', category: '', excerpt: '', content: '', coverUrl: '', isPublished: false };
  const [items, setItems] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [query, setQuery] = useState('');
  const [publicationFilter, setPublicationFilter] = useState('all');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState({ error: '', success: '' });

  const load = () => api.get('/lawyer/blog').then(({ data }) => setItems(data.items));
  useEffect(() => { load().catch((error) => setNotice({ error: error.message, success: '' })); }, []);
  const reset = () => { setEditing(null); setForm(blank); };
  const edit = (item) => {
    setEditing(item._id);
    setForm(Object.fromEntries(Object.keys(blank).map((key) => [key, item[key] ?? blank[key]])));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const visible = useMemo(() => (items || []).filter((item) => {
    const matchesPublication = publicationFilter === 'all' || (publicationFilter === 'published' ? item.isPublished : !item.isPublished);
    return matchesPublication && includesQuery(item, query);
  }), [items, publicationFilter, query]);

  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setNotice({ error: '', success: '' });
    const wasEditing = Boolean(editing);
    try {
      if (editing) await api.patch(`/lawyer/blog/${editing}`, form);
      else await api.post('/lawyer/blog', form);
      reset(); await load();
      setNotice({ error: '', success: wasEditing ? 'Post updated.' : 'Draft saved. Open it when you are ready to publish.' });
    } catch (error) {
      setNotice({ error: error.message, success: '' });
    } finally {
      setBusy(false);
    }
  };

  const hide = async (item) => {
    if (!window.confirm('Hide this post from the public blog? The draft will be retained.')) return;
    setBusy(true); setNotice({ error: '', success: '' });
    try {
      await api.delete(`/lawyer/blog/${item._id}`);
      if (editing === item._id) reset();
      await load(); setNotice({ error: '', success: 'Post hidden from the public blog.' });
    } catch (error) {
      setNotice({ error: error.message, success: '' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section>
      <DashboardHeader eyebrow="FR-18" title="My blog posts" description="Create, edit, publish, and hide articles authored by your account." />
      <form className="card mt-7" onSubmit={submit}>
        <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-gold">{editing ? 'Editing article' : 'New article'}</p><h2 className="text-2xl font-bold">{editing ? form.title || 'Untitled post' : 'Create a draft'}</h2></div>{editing && <button type="button" className="btn-secondary !px-4 !py-2 !text-sm" onClick={reset}>Close editor</button>}</div>
        <div className="mt-5"><ErrorAlert message={notice.error} /><SuccessAlert message={notice.success} /></div>
        <div className="grid gap-5 sm:grid-cols-2">
          <label><span className="label">Title</span><input className="input" required maxLength={180} value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} /><CharacterCount value={form.title} limit={180} /></label>
          <label><span className="label">Category</span><input className="input" required maxLength={100} value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} /></label>
          <label className="sm:col-span-2"><span className="label">Cover image URL or /path</span><input className="input" value={form.coverUrl} onChange={(event) => setForm((current) => ({ ...current, coverUrl: event.target.value }))} /></label>
          <label className="sm:col-span-2"><span className="label">Excerpt</span><textarea className="input min-h-24" required maxLength={300} value={form.excerpt} onChange={(event) => setForm((current) => ({ ...current, excerpt: event.target.value }))} /><CharacterCount value={form.excerpt} limit={300} /></label>
          <label className="sm:col-span-2"><span className="label">Article content</span><textarea className="input min-h-64" required maxLength={30000} value={form.content} onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))} /><CharacterCount value={form.content} limit={30000} /></label>
          {editing && <label className="flex items-center gap-3 rounded-xl border p-4 sm:col-span-2"><input type="checkbox" className="h-5 w-5 accent-forest" checked={form.isPublished} onChange={(event) => setForm((current) => ({ ...current, isPublished: event.target.checked }))} /><span><span className="block font-semibold">Published</span><span className="text-sm text-slate-500">Visible on the public website</span></span></label>}
        </div>
        <button className="btn-primary mt-6" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save post' : 'Save draft'}</button>
      </form>

      <SummaryPills items={[
        ['posts', items?.length || 0],
        ['published', (items || []).filter((item) => item.isPublished).length],
        ['drafts', (items || []).filter((item) => !item.isPublished).length]
      ]} />
      <DashboardFilters query={query} onQueryChange={setQuery} placeholder="Search title, category, or excerpt…">
        <label className="min-w-44"><span className="label">Visibility</span><select className="input" value={publicationFilter} onChange={(event) => setPublicationFilter(event.target.value)}><option value="all">All posts</option><option value="published">Published</option><option value="draft">Drafts</option></select></label>
      </DashboardFilters>
      <div className="mt-6">
        {items === null ? (!notice.error && <Loading label="Loading your posts…" />) : visible.length ? (
          <div className="table-wrap"><table className="data-table"><thead><tr><th>Title</th><th>Category</th><th>Updated</th><th>Status</th><th>Actions</th></tr></thead><tbody>{visible.map((item) => (
            <tr key={item._id}>
              <td className="font-semibold">{item.title}</td><td>{item.category}</td><td>{formatDate(item.updatedAt)}</td><td><StatusBadge value={item.isPublished ? 'published' : 'draft'} /></td>
              <td><div className="flex gap-2"><button disabled={busy} className="btn-secondary !px-4 !py-2 !text-sm" onClick={() => edit(item)}>Edit</button>{item.isPublished && <><Link className="btn-secondary !px-4 !py-2 !text-sm" to={`/blog/${item.slug || item._id}`}><ExternalLink size={16} />View</Link><button disabled={busy} className="btn-danger" onClick={() => hide(item)}>Hide</button></>}</div></td>
            </tr>
          ))}</tbody></table></div>
        ) : <EmptyState title="No matching posts" text="Change the filters or create a new draft." />}
      </div>
    </section>
  );
}
