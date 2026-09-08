import { useEffect, useMemo, useState } from 'react';
import { Edit3, Plus, Search, Trash2, X } from 'lucide-react';
import api from '../api/client.js';
import { EmptyState, ErrorAlert, Loading } from './Ui.jsx';
import { formPayload, initialForm, itemId } from './adminForm.js';

const getPath = (object, path) => path.split('.').reduce((value, key) => value?.[key], object);

function Editor({ config, item, lookups, onClose, onSaved }) {
  const initial = useMemo(() => initialForm(config.fields, item), [config, item]);
  const [form, setForm] = useState(initial); const [status, setStatus] = useState({ saving: false, error: '' });
  const change = (field, value) => setForm((current) => ({ ...current, [field.name]: value }));
  const submit = async (e) => {
    e.preventDefault();
    if (status.saving) return;
    setStatus({ saving: true, error: '' });
    const payload = formPayload(config.fields, form, Boolean(item));
    try {
      const { data } = item ? await api.patch(`${config.endpoint}/${item._id}`, payload) : await api.post(config.endpoint, payload);
      onSaved(data.item); onClose();
    } catch (error) { setStatus({ saving: false, error: error.message }); }
  };
  return <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/60 p-4 py-10 backdrop-blur-sm"><div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b p-5"><div><p className="text-xs font-bold uppercase tracking-wide text-gold">{item ? 'Edit record' : 'Create record'}</p><h2 className="text-2xl font-bold">{item ? `Edit ${config.singular}` : `Add ${config.singular}`}</h2></div><button disabled={status.saving} aria-label="Close editor" onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100"><X /></button></div><form onSubmit={submit} className="p-5"><ErrorAlert message={status.error} /><fieldset disabled={status.saving} className="grid gap-5 sm:grid-cols-2">{config.fields.filter((field) => !(item && field.createOnly)).map((field) => <DynamicField key={field.name} field={field} value={form[field.name]} options={(lookups[field.lookup] || []).filter(option => (field.lookup !== 'users' || !lookups.linkedUsers?.includes(option.value)) && (field.lookup !== 'services' || config.singular !== 'lawyer' || option.isActive || initial.services?.includes(option.value)))} onChange={(value) => change(field, value)} isCreate={!item} />)}</fieldset><div className="mt-7 flex justify-end gap-3"><button type="button" className="btn-secondary" disabled={status.saving} onClick={onClose}>Cancel</button><button className="btn-primary" disabled={status.saving}>{status.saving ? 'Saving…' : 'Save record'}</button></div></form></div></div>;
}

function DynamicField({ field, value, options, onChange, isCreate }) {
  const required = field.required || (isCreate && field.requiredOnCreate);
  if (field.type === 'boolean') return <label className="flex items-center gap-3 rounded-xl border p-4 sm:self-end"><input type="checkbox" className="h-5 w-5 accent-forest" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} /><span className="font-semibold">{field.label}</span></label>;
  if (field.type === 'textarea') return <label className="sm:col-span-2"><span className="label">{field.label}</span><textarea className="input min-h-28" required={required} value={value} onChange={(e) => onChange(e.target.value)} /></label>;
  if (field.type === 'select') return <label><span className="label">{field.label}</span><select className="input" required={required} value={itemId(value) || ''} onChange={(e) => onChange(e.target.value)}><option value="">Choose…</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
  if (field.type === 'multiselect') return <label className="sm:col-span-2"><span className="label">{field.label}</span><select className="input min-h-32" multiple value={value || []} onChange={(e) => onChange(Array.from(e.target.selectedOptions, (option) => option.value))}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><span className="mt-1 block text-xs text-slate-500">Hold Ctrl/Cmd to select more than one.</span></label>;
  return <label><span className="label">{field.label}</span><input className="input" type={field.type === 'array' ? 'text' : (field.type || 'text')} min={field.min} max={field.max} step={field.step} required={required} value={value} onChange={(e) => onChange(e.target.value)} /></label>;
}

export default function AdminCrud({ config }) {
  const [items, setItems] = useState(null); const [lookups, setLookups] = useState({}); const [editing, setEditing] = useState(undefined); const [query, setQuery] = useState(''); const [error, setError] = useState(''); const [archiving, setArchiving] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setItems(null); setError('');
    Promise.all([api.get(config.endpoint), api.get('/admin/content/services'), api.get('/admin/lawyers'), config.fields.some(field => field.lookup === 'users') ? api.get('/admin/lawyer-candidates') : Promise.resolve({ data: { items: [] } })])
      .then(([records, services, lawyers, users]) => { if (cancelled) return; setItems(records.data.items); setLookups({ users: users.data.items.map(item => ({ value: item._id, label: `${item.name} (${item.email})` })), services: services.data.items.map((item) => ({ value: item._id, label: item.title + (item.isActive ? '' : ' (archived)'), isActive: item.isActive })), lawyers: lawyers.data.items.map((item) => ({ value: item._id, label: item.user?.name || item.designation })) }); })
      .catch((err) => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [config]);
  const visible = useMemo(() => (items || []).filter((item) => JSON.stringify(item).toLowerCase().includes(query.toLowerCase())), [items, query]);
  const remove = async (item) => {
    if (archiving || !window.confirm(`Archive this ${config.singular}?`)) return;
    setArchiving(true); setError('');
    try {
      await api.delete(`${config.endpoint}/${item._id}`);
      setItems((current) => current.map((record) => record._id === item._id ? { ...record, isActive: false, isPublished: false } : record));
    } catch (err) { setError(err.message); }
    finally { setArchiving(false); }
  };
  const save = (saved) => {
    if (saved.user?._id) setLookups(current => ({ ...current, linkedUsers: [...(current.linkedUsers || []), saved.user._id] }));
    setItems((current) => (current || []).some((item) => item._id === saved._id) ? current.map((item) => item._id === saved._id ? saved : item) : [saved, ...(current || [])]);
  };
  return <section><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Admin content management</p><h1 className="text-4xl font-bold">{config.title}</h1></div><button className="btn-primary" disabled={items === null || archiving} onClick={() => setEditing(null)}><Plus size={18} />Add {config.singular}</button></div>{config.description && <p className="mt-4 text-slate-600">{config.description}</p>}<div className="relative mt-7 max-w-md"><Search className="absolute left-4 top-3.5 text-slate-400" size={19} /><input className="input pl-11" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${config.title.toLowerCase()}…`} /></div><div className="mt-6"><ErrorAlert message={error} />{items === null && !error ? <Loading /> : visible.length ? <div className="table-wrap"><table className="data-table"><thead><tr>{config.columns.map(([label]) => <th key={label}>{label}</th>)}<th className="w-28">Actions</th></tr></thead><tbody>{visible.map((item) => <tr key={item._id}>{config.columns.map(([label, path]) => { const value = getPath(item, path); return <td key={label}>{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : (value ?? '—')}</td>; })}<td><div className="flex gap-2"><button className="rounded-lg border p-2 text-forest hover:bg-sage" disabled={archiving} onClick={() => setEditing(item)} title="Edit"><Edit3 size={16} /></button><button className="rounded-lg border p-2 text-red-600 hover:bg-red-50" disabled={archiving} onClick={() => remove(item)} title="Archive"><Trash2 size={16} /></button></div></td></tr>)}</tbody></table></div> : <EmptyState title={`No ${config.title.toLowerCase()} found`} />}</div>{editing !== undefined && <Editor config={config} item={editing} lookups={lookups} onClose={() => setEditing(undefined)} onSaved={save} />}</section>;
}
