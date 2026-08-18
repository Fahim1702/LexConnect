import { useEffect, useMemo, useState } from 'react';
import { Edit3, Plus, Search, Trash2, X } from 'lucide-react';
import api from '../api/client.js';
import { EmptyState, ErrorAlert, Loading } from './Ui.jsx';

const getPath = (object, path) => path.split('.').reduce((value, key) => value?.[key], object);
const itemId = (value) => typeof value === 'object' && value ? value._id : value;

function Editor({ config, item, lookups, onClose, onSaved }) {
  const initial = useMemo(() => Object.fromEntries(config.fields.map((field) => {
    let value = field.from ? getPath(item, field.from) : item?.[field.name];
    if (field.type === 'multiselect') value = (value || []).map(itemId);
    if (field.type === 'array') value = (value || []).join(', ');
    if (field.type === 'boolean') value = value ?? (field.name.startsWith('isActive') ? true : false);
    return [field.name, value ?? ''];
  })), [config, item]);
  const [form, setForm] = useState(initial); const [status, setStatus] = useState({ saving: false, error: '' });
  const change = (field, value) => setForm((current) => ({ ...current, [field.name]: value }));
  const submit = async (e) => {
    e.preventDefault(); setStatus({ saving: true, error: '' });
    const payload = { ...form };
    config.fields.forEach((field) => {
      if (field.type === 'number' && payload[field.name] !== '') payload[field.name] = Number(payload[field.name]);
      if (field.type === 'array') payload[field.name] = payload[field.name].split(',').map((value) => value.trim()).filter(Boolean);
      if (field.createOnly && item) delete payload[field.name];
    });
    try {
      const { data } = item ? await api.patch(`${config.endpoint}/${item._id}`, payload) : await api.post(config.endpoint, payload);
      onSaved(data.item); onClose();
    } catch (error) { setStatus({ saving: false, error: error.message }); }
  };
  return <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/60 p-4 py-10 backdrop-blur-sm"><div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b p-5"><div><p className="text-xs font-bold uppercase tracking-wide text-gold">{item ? 'Edit record' : 'Create record'}</p><h2 className="text-2xl font-bold">{item ? `Edit ${config.singular}` : `Add ${config.singular}`}</h2></div><button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100"><X /></button></div><form onSubmit={submit} className="p-5"><ErrorAlert message={status.error} /><div className="grid gap-5 sm:grid-cols-2">{config.fields.filter((field) => !(item && field.createOnly)).map((field) => <DynamicField key={field.name} field={field} value={form[field.name]} options={lookups[field.lookup] || []} onChange={(value) => change(field, value)} isCreate={!item} />)}</div><div className="mt-7 flex justify-end gap-3"><button type="button" className="btn-secondary" onClick={onClose}>Cancel</button><button className="btn-primary" disabled={status.saving}>{status.saving ? 'Saving…' : 'Save record'}</button></div></form></div></div>;
}

function DynamicField({ field, value, options, onChange, isCreate }) {
  const required = field.required || (isCreate && field.requiredOnCreate);
  if (field.type === 'boolean') return <label className="flex items-center gap-3 rounded-xl border p-4 sm:self-end"><input type="checkbox" className="h-5 w-5 accent-forest" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} /><span className="font-semibold">{field.label}</span></label>;
  if (field.type === 'textarea') return <label className="sm:col-span-2"><span className="label">{field.label}</span><textarea className="input min-h-28" required={required} value={value} onChange={(e) => onChange(e.target.value)} /></label>;
  if (field.type === 'select') return <label><span className="label">{field.label}</span><select className="input" required={required} value={itemId(value) || ''} onChange={(e) => onChange(e.target.value)}><option value="">Choose…</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
  if (field.type === 'multiselect') return <label className="sm:col-span-2"><span className="label">{field.label}</span><select className="input min-h-32" multiple value={value || []} onChange={(e) => onChange(Array.from(e.target.selectedOptions, (option) => option.value))}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><span className="mt-1 block text-xs text-slate-500">Hold Ctrl/Cmd to select more than one.</span></label>;
  return <label><span className="label">{field.label}</span><input className="input" type={field.type || 'text'} required={required} value={value} onChange={(e) => onChange(e.target.value)} /></label>;
}

export default function AdminCrud({ config }) {
  const [items, setItems] = useState(null); const [lookups, setLookups] = useState({}); const [editing, setEditing] = useState(undefined); const [query, setQuery] = useState(''); const [error, setError] = useState('');
  useEffect(() => {
    setItems(null); setError('');
    Promise.all([api.get(config.endpoint), api.get('/public/services', { params: { limit: 50 } }), api.get('/admin/lawyers')])
      .then(([records, services, lawyers]) => { setItems(records.data.items); setLookups({ services: services.data.items.map((item) => ({ value: item._id, label: item.title })), lawyers: lawyers.data.items.map((item) => ({ value: item._id, label: item.user?.name || item.designation })) }); })
      .catch((err) => setError(err.message));
  }, [config]);
  const visible = useMemo(() => (items || []).filter((item) => JSON.stringify(item).toLowerCase().includes(query.toLowerCase())), [items, query]);
  const remove = async (item) => { if (!window.confirm(`Archive this ${config.singular}?`)) return; try { await api.delete(`${config.endpoint}/${item._id}`); setItems((current) => current.map((record) => record._id === item._id ? { ...record, isActive: false, isPublished: false } : record)); } catch (err) { setError(err.message); } };
  const save = (saved) => setItems((current) => current.some((item) => item._id === saved._id) ? current.map((item) => item._id === saved._id ? saved : item) : [saved, ...current]);
  return <section><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Admin content management</p><h1 className="text-4xl font-bold">{config.title}</h1></div><button className="btn-primary" onClick={() => setEditing(null)}><Plus size={18} />Add {config.singular}</button></div><div className="relative mt-7 max-w-md"><Search className="absolute left-4 top-3.5 text-slate-400" size={19} /><input className="input pl-11" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${config.title.toLowerCase()}…`} /></div><div className="mt-6"><ErrorAlert message={error} />{items === null && !error ? <Loading /> : visible.length ? <div className="table-wrap"><table className="data-table"><thead><tr>{config.columns.map(([label]) => <th key={label}>{label}</th>)}<th className="w-28">Actions</th></tr></thead><tbody>{visible.map((item) => <tr key={item._id}>{config.columns.map(([label, path]) => { const value = getPath(item, path); return <td key={label}>{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : (value ?? '—')}</td>; })}<td><div className="flex gap-2"><button className="rounded-lg border p-2 text-forest hover:bg-sage" onClick={() => setEditing(item)} title="Edit"><Edit3 size={16} /></button><button className="rounded-lg border p-2 text-red-600 hover:bg-red-50" onClick={() => remove(item)} title="Archive"><Trash2 size={16} /></button></div></td></tr>)}</tbody></table></div> : <EmptyState title={`No ${config.title.toLowerCase()} found`} />}</div>{editing !== undefined && <Editor config={config} item={editing} lookups={lookups} onClose={() => setEditing(undefined)} onSaved={save} />}</section>;
}
