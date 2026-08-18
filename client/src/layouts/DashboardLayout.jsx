import { NavLink, Outlet } from 'react-router-dom';
import { ArrowLeft, BookOpen, Briefcase, FileText, Gauge, HelpCircle, LogOut, MessageSquare, Scale, Star, UserRound, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const menus = {
  admin: [
    ['Overview', '/admin', Gauge], ['Lawyers', '/admin/lawyers', Users], ['Services', '/admin/services', Scale],
    ['Case Studies', '/admin/case-studies', Briefcase], ['Blog', '/admin/blog', BookOpen], ['FAQ', '/admin/faqs', HelpCircle],
    ['Consultations', '/admin/consultations', MessageSquare], ['Users', '/admin/users', UserRound], ['Testimonials', '/admin/testimonials', Star]
  ],
  client: [['My Requests', '/client', MessageSquare], ['Profile', '/client/profile', UserRound], ['Testimonials', '/client/testimonials', Star]],
  lawyer: [['Assigned Requests', '/lawyer', MessageSquare], ['My Profile', '/lawyer/profile', UserRound], ['My Blog Drafts', '/lawyer/blog', FileText]]
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const items = menus[user.role];
  return <div className="min-h-screen bg-slate-100 lg:grid lg:grid-cols-[260px_1fr]">
    <aside className="bg-ink p-5 text-white lg:min-h-screen">
      <div className="mb-8 flex items-center gap-2 font-display text-xl font-bold"><Scale className="text-gold" />LexConnect BD</div>
      <div className="mb-5 rounded-xl bg-white/5 p-3"><p className="font-semibold">{user.name}</p><p className="text-xs capitalize text-white/60">{user.role} account</p></div>
      <nav className="grid gap-1">{items.map(([label, to, Icon]) => <NavLink key={to} end={to === `/${user.role}`} to={to} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${isActive ? 'bg-gold font-bold text-ink' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}><Icon size={18} />{label}</NavLink>)}</nav>
      <div className="mt-8 grid gap-1 border-t border-white/10 pt-5"><NavLink to="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/70 hover:bg-white/10"><ArrowLeft size={18} />Public site</NavLink><button onClick={logout} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-white/70 hover:bg-white/10"><LogOut size={18} />Log out</button></div>
    </aside>
    <main className="min-w-0 p-4 sm:p-7 lg:p-10"><Outlet /></main>
  </div>;
}
