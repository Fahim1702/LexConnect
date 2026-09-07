import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import { EmptyState, ErrorAlert, Loading, StatusBadge, formatDate } from '../../components/Ui.jsx';

export function AdminConsultationsPage() {
  const [items, setItems] = useState(null); const [lawyers, setLawyers] = useState([]); const [error, setError] = useState('');
  const load = () => Promise.all([api.get('/admin/consultations'), api.get('/admin/lawyers', { params: { eligible: true } })]).then(([requests, lawyerRes]) => { setItems(requests.data.items); setLawyers(lawyerRes.data.items.filter((item) => item.isActive)); }).catch((err) => setError(err.message));
  useEffect(() => { load(); }, []);
  const update = async (id, payload) => { try { await api.patch(`/admin/consultations/${id}`, payload); await load(); } catch (err) { setError(err.message); } };
  const archive = async (id) => { if (!window.confirm('Cancel this consultation request?')) return; try { await api.delete(`/admin/consultations/${id}`); await load(); } catch (err) { setError(err.message); } };
  return <section><p className="eyebrow">FR-20</p><h1 className="text-4xl font-bold">Consultation management</h1><p className="mt-3 text-slate-600">Review, assign, update, or cancel every incoming request.</p><div className="mt-7"><ErrorAlert message={error} />{!items ? <Loading /> : items.length ? <div className="grid gap-5">{items.map((item) => <article className="card" key={item._id}><div className="flex flex-wrap justify-between gap-4"><div><div className="flex items-center gap-3"><span className="font-mono text-xs text-slate-500">{item.reference}</span><StatusBadge value={item.status} /></div><h2 className="mt-2 text-xl font-bold">{item.subject}</h2><p className="mt-1 text-sm text-slate-500">{item.guestName} · {item.guestEmail} · {item.guestPhone}</p><p className="mt-1 text-sm font-semibold text-forest">{item.service?.title} · {formatDate(item.createdAt)}</p></div><button className="btn-danger self-start" onClick={() => archive(item._id)}>Cancel request</button></div><p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">{item.details}</p><div className="mt-5 grid gap-4 lg:grid-cols-3"><label><span className="label">Assigned lawyer</span><select className="input" value={item.assignedLawyer?._id || ''} onChange={(e) => update(item._id, { assignedLawyer: e.target.value })}><option value="">Unassigned</option>{lawyers.map((lawyer) => <option value={lawyer._id} key={lawyer._id}>{lawyer.user?.name}</option>)}</select></label><label><span className="label">Status</span><select className="input" value={item.status} onChange={(e) => update(item._id, { status: e.target.value })}>{['pending', 'assigned', 'in-review', 'scheduled', 'resolved', 'cancelled'].map((status) => <option key={status}>{status}</option>)}</select></label><label><span className="label">Admin note</span><input className="input" defaultValue={item.adminNote || ''} onBlur={(e) => e.target.value !== (item.adminNote || '') && update(item._id, { adminNote: e.target.value })} /></label></div></article>)}</div> : <EmptyState title="No consultation requests" />}</div></section>;
}

export function AdminUsersPage() {
  const [items, setItems] = useState(null); const [error, setError] = useState('');
  const load = () => api.get('/admin/users').then((res) => setItems(res.data.items)).catch((err) => setError(err.message));
  useEffect(() => { load(); }, []);
  const toggle = async (item) => { try { await api.patch(`/admin/users/${item._id}`, { isActive: !item.isActive }); await load(); } catch (err) { setError(err.message); } };
  return <section><p className="eyebrow">FR-21</p><h1 className="text-4xl font-bold">User accounts</h1><div className="mt-7"><ErrorAlert message={error} />{!items ? <Loading /> : <div className="table-wrap"><table className="data-table"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Status</th><th>Action</th></tr></thead><tbody>{items.map((item) => <tr key={item._id}><td className="font-semibold">{item.name}</td><td>{item.email}</td><td className="capitalize">{item.role}</td><td>{formatDate(item.createdAt)}</td><td><StatusBadge value={item.isActive ? 'active' : 'inactive'} /></td><td><button disabled={item.role === 'admin'} title={item.role === 'admin' ? 'Administrator accounts are managed by a maintainer' : undefined} className={item.isActive ? 'btn-danger' : 'btn-primary !px-3 !py-2 !text-sm'} onClick={() => toggle(item)}>{item.isActive ? 'Deactivate' : 'Activate'}</button></td></tr>)}</tbody></table></div>}</div></section>;
}

export function AdminTestimonialsPage() {
  const [items, setItems] = useState(null); const [error, setError] = useState('');
  const load = () => api.get('/admin/testimonials').then((res) => setItems(res.data.items)).catch((err) => setError(err.message));
  useEffect(() => { load(); }, []);
  const review = async (id, isApproved) => { try { await api.patch(`/admin/testimonials/${id}`, { isApproved }); await load(); } catch (err) { setError(err.message); } };
  return <section><p className="eyebrow">Moderation</p><h1 className="text-4xl font-bold">Testimonials</h1><div className="mt-7"><ErrorAlert message={error} />{!items ? <Loading /> : items.length ? <div className="grid gap-4">{items.map((item) => <article className="card" key={item._id}><div className="flex flex-wrap justify-between gap-4"><div><p className="font-bold">{item.client?.name}</p><p className="text-xs text-slate-500">{item.consultation?.reference} · {item.rating}/5 stars · {formatDate(item.createdAt)}</p></div><StatusBadge value={item.isApproved ? 'approved' : 'review'} /></div><p className="mt-4 leading-7 text-slate-700">“{item.comment}”</p><div className="mt-5 flex gap-3"><button className="btn-primary !px-4 !py-2 !text-sm" onClick={() => review(item._id, true)}>Approve</button><button className="btn-secondary !px-4 !py-2 !text-sm" onClick={() => review(item._id, false)}>Hide</button></div></article>)}</div> : <EmptyState title="No testimonials" />}</div></section>;
}

export function AdminMessagesPage() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api.get('/admin/messages').then(({ data }) => setItems(data.items)).catch(err => setError(err.message)); }, []);
  const update = async (id, status) => {
    setError('');
    try {
      const { data } = await api.patch(`/admin/messages/${id}`, { status });
      setItems(current => current.map(item => item._id === id ? data.item : item));
    } catch (err) { setError(err.message); }
  };
  return <section><p className="eyebrow">Inbox</p><h1 className="text-4xl font-bold">Contact messages</h1><p className="mt-3 text-slate-600">Review inquiries and track follow-up. Changing the status does not send an email.</p><ErrorAlert message={error} /><div className="mt-7 grid gap-5">{items === null ? (!error && <Loading />) : items.length ? items.map(item => <article className="card" key={item._id}><div className="flex flex-wrap justify-between gap-4"><div><h2 className="text-xl font-bold">{item.subject}</h2><p className="mt-2 text-sm text-slate-600">{item.name} ? {item.email} ? {item.phone} ? {formatDate(item.createdAt)}</p></div><label><span className="label">Status</span><select className="input" value={item.status} onChange={e => update(item._id, e.target.value)}>{['new', 'read', 'replied', 'archived'].map(status => <option key={status}>{status}</option>)}</select></label></div><p className="mt-4 whitespace-pre-wrap">{item.message}</p></article>) : <EmptyState title="No contact messages" />}</div></section>;
}
