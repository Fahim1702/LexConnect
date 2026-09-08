import { useEffect, useMemo, useState } from 'react';
import api from '../../api/client.js';
import {
  CharacterCount,
  DashboardFilters,
  DashboardHeader,
  SummaryPills
} from '../../components/DashboardUi.jsx';
import {
  EmptyState,
  ErrorAlert,
  Loading,
  StatusBadge,
  SuccessAlert,
  formatDate
} from '../../components/Ui.jsx';

const consultationStatuses = ['pending', 'assigned', 'in-review', 'scheduled', 'resolved', 'cancelled'];
const includesQuery = (item, query) => !query || JSON.stringify(item).toLowerCase().includes(query.trim().toLowerCase());

function SelectFilter({ label, value, onChange, options }) {
  return (
    <label className="min-w-44">
      <span className="label">{label}</span>
      <select className="input" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}
      </select>
    </label>
  );
}

function AdminConsultationCard({ item, lawyers, busy, onSave, onCancel }) {
  const [form, setForm] = useState({
    assignedLawyer: item.assignedLawyer?._id || '',
    status: item.status,
    adminNote: item.adminNote || ''
  });
  const dirty = form.assignedLawyer !== (item.assignedLawyer?._id || '')
    || form.status !== item.status
    || form.adminNote !== (item.adminNote || '');
  const invalidAssignment = form.status === 'assigned' && !form.assignedLawyer && item.status !== 'assigned';
  const change = (name, value) => setForm((current) => ({ ...current, [name]: value }));

  const submit = (event) => {
    event.preventDefault();
    if (!dirty || invalidAssignment) return;
    const payload = {};
    if (form.assignedLawyer !== (item.assignedLawyer?._id || '')) payload.assignedLawyer = form.assignedLawyer;
    if (form.status !== item.status) payload.status = form.status;
    if (form.adminNote !== (item.adminNote || '')) payload.adminNote = form.adminNote;
    onSave(item._id, payload);
  };

  return (
    <article className="card">
      <div className="flex flex-wrap justify-between gap-4">
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
        {item.status !== 'cancelled' && (
          <button className="btn-danger self-start" disabled={busy} onClick={() => onCancel(item._id)}>
            Cancel request
          </button>
        )}
      </div>

      <div className="mt-5 grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-3">
        <div><span className="block text-xs font-bold uppercase tracking-wide text-slate-400">Preferred date</span>{formatDate(item.preferredDate)}</div>
        <div><span className="block text-xs font-bold uppercase tracking-wide text-slate-400">Preferred lawyer</span>{item.preferredLawyer?.user?.name || 'No preference'}</div>
        <div><span className="block text-xs font-bold uppercase tracking-wide text-slate-400">Assigned lawyer</span>{item.assignedLawyer?.user?.name || 'Unassigned'}</div>
      </div>

      <details className="mt-4 rounded-xl border border-slate-200 px-4 py-3">
        <summary className="cursor-pointer font-semibold text-forest">Case details and activity</summary>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">{item.details}</p>
        {item.statusHistory?.length > 0 && (
          <ol className="mt-5 space-y-2 border-l-2 border-slate-200 pl-4 text-sm">
            {item.statusHistory.map((entry, index) => (
              <li key={`${entry.changedAt || 'history'}-${index}`}>
                <span className="font-semibold capitalize">{entry.status}</span>
                <span className="text-slate-500"> · {formatDate(entry.changedAt)}</span>
                {entry.note && <p className="mt-1 text-slate-600">{entry.note}</p>}
              </li>
            ))}
          </ol>
        )}
      </details>

      <form className="mt-5 grid gap-4 lg:grid-cols-2" onSubmit={submit}>
        <label>
          <span className="label">Assigned lawyer</span>
          <select className="input" value={form.assignedLawyer} onChange={(event) => change('assignedLawyer', event.target.value)}>
            <option value="">Unassigned</option>
            {lawyers.map((lawyer) => <option value={lawyer._id} key={lawyer._id}>{lawyer.user?.name || lawyer.designation}</option>)}
          </select>
        </label>
        <label>
          <span className="label">Status</span>
          <select className="input" value={form.status} onChange={(event) => change('status', event.target.value)}>
            {consultationStatuses.map((status) => <option key={status}>{status}</option>)}
          </select>
        </label>
        <label className="lg:col-span-2">
          <span className="label">Private admin note</span>
          <textarea
            className="input min-h-24"
            maxLength={3000}
            value={form.adminNote}
            onChange={(event) => change('adminNote', event.target.value)}
            placeholder="Add handoff details visible only to administrators."
          />
          <CharacterCount value={form.adminNote} limit={3000} />
        </label>
        <div className="flex flex-wrap items-center justify-end gap-3 lg:col-span-2">
          {invalidAssignment && <p className="mr-auto text-sm text-red-600">Choose a lawyer before using the assigned status.</p>}
          <button className="btn-primary" disabled={busy || !dirty || invalidAssignment}>
            {busy ? 'Saving…' : dirty ? 'Save changes' : 'No changes'}
          </button>
        </div>
      </form>
    </article>
  );
}

export function AdminConsultationsPage() {
  const [items, setItems] = useState(null);
  const [lawyers, setLawyers] = useState([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [busyId, setBusyId] = useState('');
  const [notice, setNotice] = useState({ error: '', success: '' });

  const load = async () => {
    const [requests, lawyerResponse] = await Promise.all([
      api.get('/admin/consultations'),
      api.get('/admin/lawyers', { params: { eligible: true } })
    ]);
    setItems(requests.data.items);
    setLawyers(lawyerResponse.data.items);
  };

  useEffect(() => {
    load().catch((error) => setNotice({ error: error.message, success: '' }));
  }, []);

  const visible = useMemo(() => (items || []).filter((item) => (
    (statusFilter === 'all' || item.status === statusFilter) && includesQuery(item, query)
  )), [items, query, statusFilter]);

  const save = async (id, payload) => {
    setBusyId(id); setNotice({ error: '', success: '' });
    try {
      await api.patch(`/admin/consultations/${id}`, payload);
      await load();
      setNotice({ error: '', success: 'Consultation updated and added to its activity history.' });
    } catch (error) {
      setNotice({ error: error.message, success: '' });
    } finally {
      setBusyId('');
    }
  };

  const cancel = async (id) => {
    if (!window.confirm('Cancel this consultation request? The record and its history will be retained.')) return;
    setBusyId(id); setNotice({ error: '', success: '' });
    try {
      await api.delete(`/admin/consultations/${id}`);
      await load();
      setNotice({ error: '', success: 'Consultation cancelled. Its history has been retained.' });
    } catch (error) {
      setNotice({ error: error.message, success: '' });
    } finally {
      setBusyId('');
    }
  };

  const summaries = consultationStatuses.map((status) => [status, (items || []).filter((item) => item.status === status).length]);

  return (
    <section>
      <DashboardHeader
        eyebrow="FR-20"
        title="Consultation management"
        description="Review each request, assign an eligible lawyer, and save related changes as one consistent update."
      />
      <SummaryPills items={summaries} />
      <DashboardFilters query={query} onQueryChange={setQuery} placeholder="Search reference, client, service, or subject…">
        <SelectFilter
          label="Status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[['all', 'All statuses'], ...consultationStatuses.map((status) => [status, status])]}
        />
      </DashboardFilters>
      <div className="mt-6">
        <ErrorAlert message={notice.error} />
        <SuccessAlert message={notice.success} />
        {items === null ? (!notice.error && <Loading label="Loading consultations…" />) : visible.length ? (
          <div className="grid gap-5">
            {visible.map((item) => (
              <AdminConsultationCard
                key={`${item._id}:${item.updatedAt}`}
                item={item}
                lawyers={lawyers}
                busy={busyId === item._id}
                onSave={save}
                onCancel={cancel}
              />
            ))}
          </div>
        ) : <EmptyState title="No matching consultation requests" text="Change the search or status filter to see more records." />}
      </div>
    </section>
  );
}

export function AdminUsersPage() {
  const [items, setItems] = useState(null);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [busyId, setBusyId] = useState('');
  const [notice, setNotice] = useState({ error: '', success: '' });

  useEffect(() => {
    api.get('/admin/users')
      .then((response) => setItems(response.data.items))
      .catch((error) => setNotice({ error: error.message, success: '' }));
  }, []);

  const visible = useMemo(() => (items || []).filter((item) => (
    (roleFilter === 'all' || item.role === roleFilter) && includesQuery(item, query)
  )), [items, query, roleFilter]);

  const toggle = async (item) => {
    if (item.isActive && !window.confirm(`Deactivate ${item.name}? They will lose access until reactivated.`)) return;
    setBusyId(item._id); setNotice({ error: '', success: '' });
    try {
      const { data } = await api.patch(`/admin/users/${item._id}`, { isActive: !item.isActive });
      setItems((current) => current.map((record) => record._id === item._id ? data.item : record));
      setNotice({ error: '', success: `${item.name} is now ${data.item.isActive ? 'active' : 'inactive'}.` });
    } catch (error) {
      setNotice({ error: error.message, success: '' });
    } finally {
      setBusyId('');
    }
  };

  return (
    <section>
      <DashboardHeader eyebrow="FR-21" title="User accounts" description="Review registered accounts and control access without changing trusted administrator roles." />
      <SummaryPills items={[
        ['accounts', items?.length || 0],
        ['active', (items || []).filter((item) => item.isActive).length],
        ['lawyers', (items || []).filter((item) => item.role === 'lawyer').length]
      ]} />
      <DashboardFilters query={query} onQueryChange={setQuery} placeholder="Search name or email…">
        <SelectFilter label="Role" value={roleFilter} onChange={setRoleFilter} options={[["all", "All roles"], ["client", "Clients"], ["lawyer", "Lawyers"], ["admin", "Administrators"]]} />
      </DashboardFilters>
      <div className="mt-6">
        <ErrorAlert message={notice.error} />
        <SuccessAlert message={notice.success} />
        {items === null ? (!notice.error && <Loading label="Loading accounts…" />) : visible.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>{visible.map((item) => (
                <tr key={item._id}>
                  <td className="font-semibold">{item.name}</td><td>{item.email}</td><td className="capitalize">{item.role}</td>
                  <td>{formatDate(item.createdAt)}</td><td><StatusBadge value={item.isActive ? 'active' : 'inactive'} /></td>
                  <td><button disabled={item.role === 'admin' || busyId === item._id} title={item.role === 'admin' ? 'Administrator accounts are managed by a maintainer' : undefined} className={item.isActive ? 'btn-danger' : 'btn-primary !px-3 !py-2 !text-sm'} onClick={() => toggle(item)}>{busyId === item._id ? 'Saving…' : item.isActive ? 'Deactivate' : 'Activate'}</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <EmptyState title="No matching accounts" text="Change the search or role filter to see more accounts." />}
      </div>
    </section>
  );
}

export function AdminTestimonialsPage() {
  const [items, setItems] = useState(null);
  const [query, setQuery] = useState('');
  const [reviewFilter, setReviewFilter] = useState('pending');
  const [busyId, setBusyId] = useState('');
  const [notice, setNotice] = useState({ error: '', success: '' });

  useEffect(() => {
    api.get('/admin/testimonials')
      .then((response) => setItems(response.data.items))
      .catch((error) => setNotice({ error: error.message, success: '' }));
  }, []);

  const visible = useMemo(() => (items || []).filter((item) => {
    const matchesReview = reviewFilter === 'all' || (reviewFilter === 'approved' ? item.isApproved : !item.isApproved);
    return matchesReview && includesQuery(item, query);
  }), [items, query, reviewFilter]);

  const review = async (item, isApproved) => {
    setBusyId(item._id); setNotice({ error: '', success: '' });
    try {
      const { data } = await api.patch(`/admin/testimonials/${item._id}`, { isApproved });
      setItems((current) => current.map((record) => record._id === item._id ? {
        ...record,
        isApproved: data.item.isApproved,
        approvedAt: data.item.approvedAt
      } : record));
      setNotice({ error: '', success: isApproved ? 'Testimonial approved for public display.' : 'Testimonial hidden from public display.' });
    } catch (error) {
      setNotice({ error: error.message, success: '' });
    } finally {
      setBusyId('');
    }
  };

  return (
    <section>
      <DashboardHeader eyebrow="Moderation" title="Testimonials" description="Approve client feedback before it appears on the public website." />
      <SummaryPills items={[
        ['awaiting review', (items || []).filter((item) => !item.isApproved).length],
        ['approved', (items || []).filter((item) => item.isApproved).length]
      ]} />
      <DashboardFilters query={query} onQueryChange={setQuery} placeholder="Search client, consultation, or comment…">
        <SelectFilter label="Visibility" value={reviewFilter} onChange={setReviewFilter} options={[["pending", "Awaiting review"], ["approved", "Approved"], ["all", "All testimonials"]]} />
      </DashboardFilters>
      <div className="mt-6">
        <ErrorAlert message={notice.error} /><SuccessAlert message={notice.success} />
        {items === null ? (!notice.error && <Loading label="Loading testimonials…" />) : visible.length ? (
          <div className="grid gap-4">{visible.map((item) => (
            <article className="card" key={item._id}>
              <div className="flex flex-wrap justify-between gap-4">
                <div><p className="font-bold">{item.client?.name || 'Client'}</p><p className="text-xs text-slate-500">{item.consultation?.reference} · {'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)} · {formatDate(item.createdAt)}</p></div>
                <StatusBadge value={item.isApproved ? 'approved' : 'review'} />
              </div>
              <p className="mt-4 whitespace-pre-wrap leading-7 text-slate-700">“{item.comment}”</p>
              <div className="mt-5 flex gap-3">
                {!item.isApproved && <button disabled={busyId === item._id} className="btn-primary !px-4 !py-2 !text-sm" onClick={() => review(item, true)}>Approve</button>}
                {item.isApproved && <button disabled={busyId === item._id} className="btn-secondary !px-4 !py-2 !text-sm" onClick={() => review(item, false)}>Hide</button>}
              </div>
            </article>
          ))}</div>
        ) : <EmptyState title="No matching testimonials" text="There is nothing in this review queue." />}
      </div>
    </section>
  );
}

export function AdminMessagesPage() {
  const [items, setItems] = useState(null);
  const [query, setQuery] = useState('');
  const [messageFilter, setMessageFilter] = useState('all');
  const [busyId, setBusyId] = useState('');
  const [notice, setNotice] = useState({ error: '', success: '' });

  useEffect(() => {
    api.get('/admin/messages')
      .then(({ data }) => setItems(data.items))
      .catch((error) => setNotice({ error: error.message, success: '' }));
  }, []);

  const visible = useMemo(() => (items || []).filter((item) => (
    (messageFilter === 'all' || item.status === messageFilter) && includesQuery(item, query)
  )), [items, messageFilter, query]);

  const update = async (id, status) => {
    setBusyId(id); setNotice({ error: '', success: '' });
    try {
      const { data } = await api.patch(`/admin/messages/${id}`, { status });
      setItems((current) => current.map((item) => item._id === id ? data.item : item));
      setNotice({ error: '', success: 'Message status updated.' });
    } catch (error) {
      setNotice({ error: error.message, success: '' });
    } finally {
      setBusyId('');
    }
  };

  return (
    <section>
      <DashboardHeader eyebrow="Inbox" title="Contact messages" description="Review website inquiries and track follow-up. Status changes do not send email." />
      <SummaryPills items={[
        ['new', (items || []).filter((item) => item.status === 'new').length],
        ['open', (items || []).filter((item) => ['new', 'read'].includes(item.status)).length],
        ['replied', (items || []).filter((item) => item.status === 'replied').length]
      ]} />
      <DashboardFilters query={query} onQueryChange={setQuery} placeholder="Search sender, subject, or message…">
        <SelectFilter label="Status" value={messageFilter} onChange={setMessageFilter} options={[["all", "All messages"], ["new", "New"], ["read", "Read"], ["replied", "Replied"], ["archived", "Archived"]]} />
      </DashboardFilters>
      <div className="mt-6">
        <ErrorAlert message={notice.error} /><SuccessAlert message={notice.success} />
        {items === null ? (!notice.error && <Loading label="Loading messages…" />) : visible.length ? (
          <div className="grid gap-5">{visible.map((item) => (
            <article className="card" key={item._id}>
              <div className="flex flex-wrap justify-between gap-4">
                <div className="min-w-0"><h2 className="text-xl font-bold">{item.subject}</h2><p className="mt-2 break-words text-sm text-slate-600">{item.name} · {item.email}{item.phone ? ` · ${item.phone}` : ''} · {formatDate(item.createdAt)}</p></div>
                <label className="min-w-40"><span className="label">Status</span><select disabled={busyId === item._id} className="input" value={item.status} onChange={(event) => update(item._id, event.target.value)}>{['new', 'read', 'replied', 'archived'].map((status) => <option key={status}>{status}</option>)}</select></label>
              </div>
              <p className="mt-4 whitespace-pre-wrap leading-7 text-slate-700">{item.message}</p>
            </article>
          ))}</div>
        ) : <EmptyState title="No matching messages" text="Change the search or status filter to see more messages." />}
      </div>
    </section>
  );
}
