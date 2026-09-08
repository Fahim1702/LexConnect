import { useEffect, useState } from 'react';
import { Briefcase, MessageSquare, Scale, Star, Users } from 'lucide-react';
import api from '../../api/client.js';
import { ErrorAlert, Loading, StatusBadge, formatDate } from '../../components/Ui.jsx';

export default function AdminDashboardPage() {
  const [data, setData] = useState(null); const [error, setError] = useState('');
  useEffect(() => { api.get('/admin/overview').then((res) => setData(res.data)).catch((err) => setError(err.message)); }, []);
  if (error) return <ErrorAlert message={error} />; if (!data) return <Loading />;
  const cards = [['Users', data.stats.users, Users], ['Lawyers', data.stats.lawyers, Briefcase], ['Services', data.stats.services, Scale], ['New messages', data.stats.unreadMessages, MessageSquare], ['Pending requests', data.stats.pending, MessageSquare], ['Testimonials to review', data.stats.pendingTestimonials, Star]];
  return <section><p className="eyebrow">Admin console</p><h1 className="text-4xl font-bold">Platform overview</h1><div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{cards.map(([label, value, Icon]) => <div className="card" key={label}><Icon className="text-gold" /><p className="mt-4 text-3xl font-bold">{value}</p><p className="text-sm text-slate-500">{label}</p></div>)}</div><h2 className="mt-10 text-2xl font-bold">Recent consultation requests</h2><div className="table-wrap mt-5"><table className="data-table"><thead><tr><th>Reference</th><th>Client</th><th>Service</th><th>Date</th><th>Status</th></tr></thead><tbody>{data.recent.map((item) => <tr key={item._id}><td className="font-mono text-xs">{item.reference}</td><td>{item.guestName}</td><td>{item.service?.title}</td><td>{formatDate(item.createdAt)}</td><td><StatusBadge value={item.status} /></td></tr>)}</tbody></table></div></section>;
}
