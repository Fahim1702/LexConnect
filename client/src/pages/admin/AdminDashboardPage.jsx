import { useEffect, useState } from 'react';
import { ArrowUpRight, Briefcase, MessageSquare, Scale, Star, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import { DashboardHeader } from '../../components/DashboardUi.jsx';
import { EmptyState, ErrorAlert, Loading, StatusBadge, formatDate } from '../../components/Ui.jsx';

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/overview')
      .then((response) => setData(response.data))
      .catch((requestError) => setError(requestError.message));
  }, []);

  if (error) return <ErrorAlert message={error} />;
  if (!data) return <Loading label="Loading the admin overview…" />;

  const cards = [
    ['Users', data.stats.users, Users, '/admin/users'],
    ['Active lawyers', data.stats.lawyers, Briefcase, '/admin/lawyers'],
    ['Active services', data.stats.services, Scale, '/admin/services'],
    ['New messages', data.stats.unreadMessages, MessageSquare, '/admin/messages'],
    ['Pending requests', data.stats.pending, MessageSquare, '/admin/consultations'],
    ['Testimonials to review', data.stats.pendingTestimonials, Star, '/admin/testimonials']
  ];

  return (
    <section>
      <DashboardHeader
        eyebrow="Admin console"
        title="Platform overview"
        description="Monitor the records that need attention and move directly into each management workflow."
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([label, value, Icon, to]) => (
          <Link className="card group transition hover:-translate-y-0.5 hover:border-gold/60 hover:shadow-md" key={label} to={to}>
            <div className="flex items-start justify-between">
              <Icon className="text-gold" />
              <ArrowUpRight className="text-slate-300 transition group-hover:text-forest" size={19} />
            </div>
            <p className="mt-4 text-3xl font-bold">{value}</p>
            <p className="text-sm text-slate-500">{label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-10 flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Recent consultation requests</h2>
        <Link className="text-sm font-semibold text-forest hover:underline" to="/admin/consultations">Manage all</Link>
      </div>
      {data.recent.length ? (
        <div className="table-wrap mt-5">
          <table className="data-table">
            <thead><tr><th>Reference</th><th>Client</th><th>Service</th><th>Date</th><th>Status</th></tr></thead>
            <tbody>
              {data.recent.map((item) => (
                <tr key={item._id}>
                  <td className="font-mono text-xs">{item.reference}</td>
                  <td className="font-semibold">{item.guestName}</td>
                  <td>{item.service?.title || 'Archived service'}</td>
                  <td>{formatDate(item.createdAt)}</td>
                  <td><StatusBadge value={item.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <div className="mt-5"><EmptyState title="No consultation requests yet" text="New client and guest requests will appear here." /></div>}
    </section>
  );
}
