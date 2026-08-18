import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Menu, Scale, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const nav = [
  ['Services', '/services'], ['Lawyers', '/lawyers'], ['Case Studies', '/case-studies'],
  ['Blog', '/blog'], ['FAQ', '/faq'], ['Contact', '/contact']
];

export default function PublicLayout() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  return <div className="min-h-screen">
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink text-white shadow-lg">
      <div className="container-page flex h-18 items-center justify-between py-4">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold"><span className="rounded-xl bg-gold p-2 text-ink"><Scale size={21} /></span>LexConnect <span className="text-gold">BD</span></Link>
        <nav className="hidden items-center gap-6 lg:flex">
          {nav.map(([label, to]) => <NavLink key={to} className={({ isActive }) => `text-sm font-medium hover:text-gold ${isActive ? 'text-gold' : 'text-white/80'}`} to={to}>{label}</NavLink>)}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          {user ? <Link className="btn-primary !bg-gold !text-ink hover:!bg-white" to={`/${user.role}`}>Dashboard</Link> : <><Link className="text-sm font-semibold" to="/login">Log in</Link><Link className="rounded-xl bg-gold px-4 py-2.5 text-sm font-bold text-ink" to="/consultation">Request consultation</Link></>}
        </div>
        <button className="lg:hidden" onClick={() => setOpen(!open)} aria-label="Toggle navigation">{open ? <X /> : <Menu />}</button>
      </div>
      {open && <nav className="container-page grid gap-2 border-t border-white/10 py-4 lg:hidden">
        {nav.map(([label, to]) => <Link key={to} className="rounded-lg px-3 py-2 text-white/85 hover:bg-white/10" to={to} onClick={() => setOpen(false)}>{label}</Link>)}
        <Link className="rounded-lg bg-gold px-3 py-2 font-bold text-ink" to={user ? `/${user.role}` : '/consultation'} onClick={() => setOpen(false)}>{user ? 'Dashboard' : 'Request consultation'}</Link>
      </nav>}
    </header>
    <main><Outlet /></main>
    <footer className="bg-ink py-12 text-white/70">
      <div className="container-page grid gap-10 md:grid-cols-3"><div><div className="flex items-center gap-2 font-display text-xl font-bold text-white"><Scale className="text-gold" />LexConnect BD</div><p className="mt-4 max-w-sm text-sm leading-6">A university project connecting people in Bangladesh with legal services and verified lawyer profiles.</p></div><div><h3 className="font-sans text-sm font-bold uppercase tracking-wider text-white">Quick links</h3><div className="mt-4 grid gap-2 text-sm"><Link to="/services">Services</Link><Link to="/lawyers">Lawyers</Link><Link to="/faq">Frequently asked questions</Link></div></div><div><h3 className="font-sans text-sm font-bold uppercase tracking-wider text-white">Important</h3><p className="mt-4 text-sm leading-6">Content on this student project is for demonstration and general information. It is not legal advice.</p></div></div>
      <div className="container-page mt-10 border-t border-white/10 pt-6 text-xs">© {new Date().getFullYear()} LexConnect BD · CSE 482L project</div>
    </footer>
  </div>;
}
