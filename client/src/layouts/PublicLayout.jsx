import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Mail, MapPin, Menu, Phone, Scale, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const nav = [
  ['Services', '/services'], ['Lawyers', '/lawyers'], ['Case Studies', '/case-studies'],
  ['Blog', '/blog'], ['FAQ', '/faq'], ['Contact', '/contact']
];

export default function PublicLayout() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname]);

  useEffect(() => {
    const closeOnEscape = (event) => event.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);

  return (
    <div className="min-h-screen">
      <a className="skip-link" href="#public-content">Skip to main content</a>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/95 text-white shadow-lg backdrop-blur">
        <div className="container-page flex min-h-[72px] items-center justify-between py-3">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold" aria-label="LexConnect BD home">
            <span className="rounded-xl bg-gold p-2 text-ink"><Scale size={21} aria-hidden="true" /></span>
            LexConnect <span className="text-gold">BD</span>
          </Link>
          <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary navigation">
            {nav.map(([label, to]) => <NavLink key={to} className={({ isActive }) => `text-sm font-medium hover:text-gold ${isActive ? 'text-gold' : 'text-white/80'}`} to={to}>{label}</NavLink>)}
          </nav>
          <div className="hidden items-center gap-3 lg:flex">
            {user ? <Link className="btn-primary !bg-gold !text-ink hover:!bg-white" to={`/${user.role}`}>Dashboard</Link> : <><Link className="text-sm font-semibold" to="/login">Log in</Link><Link className="rounded-xl bg-gold px-4 py-2.5 text-sm font-bold text-ink" to="/consultation">Request consultation</Link></>}
          </div>
          <button className="rounded-lg p-2 hover:bg-white/10 lg:hidden" onClick={() => setOpen(!open)} aria-label="Toggle navigation" aria-controls="mobile-navigation" aria-expanded={open}>{open ? <X /> : <Menu />}</button>
        </div>
        {open && <nav id="mobile-navigation" className="container-page grid gap-2 border-t border-white/10 py-4 lg:hidden" aria-label="Mobile navigation">
          {nav.map(([label, to]) => <Link key={to} className="rounded-lg px-3 py-2 text-white/85 hover:bg-white/10" to={to}>{label}</Link>)}
          {!user && <Link className="rounded-lg px-3 py-2 font-semibold text-white" to="/login">Log in</Link>}
          <Link className="rounded-lg bg-gold px-3 py-2 font-bold text-ink" to={user ? `/${user.role}` : '/consultation'}>{user ? 'Dashboard' : 'Request consultation'}</Link>
        </nav>}
      </header>
      <main id="public-content" tabIndex="-1"><Outlet /></main>
      <footer className="bg-ink py-12 text-white/70">
        <div className="container-page grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div><div className="flex items-center gap-2 font-display text-xl font-bold text-white"><Scale className="text-gold" aria-hidden="true" />LexConnect BD</div><p className="mt-4 max-w-sm text-sm leading-6">Connecting people in Bangladesh with clear legal information, relevant services, and experienced professionals.</p></div>
          <div><h2 className="font-sans text-sm font-bold uppercase tracking-wider text-white">Explore</h2><div className="mt-4 grid gap-2 text-sm"><Link className="hover:text-gold" to="/services">Legal services</Link><Link className="hover:text-gold" to="/lawyers">Lawyer directory</Link><Link className="hover:text-gold" to="/case-studies">Case studies</Link><Link className="hover:text-gold" to="/blog">Legal blog</Link></div></div>
          <div><h2 className="font-sans text-sm font-bold uppercase tracking-wider text-white">Contact</h2><div className="mt-4 grid gap-3 text-sm"><p className="flex gap-2"><MapPin className="mt-0.5 shrink-0 text-gold" size={17} aria-hidden="true" />Bashundhara, Dhaka</p><a className="flex gap-2 hover:text-gold" href="tel:+8801700000000"><Phone className="text-gold" size={17} aria-hidden="true" />+880 1700-000000</a><a className="flex gap-2 hover:text-gold" href="mailto:hello@lexconnect.test"><Mail className="text-gold" size={17} aria-hidden="true" />hello@lexconnect.test</a></div></div>
          <div><h2 className="font-sans text-sm font-bold uppercase tracking-wider text-white">Important</h2><p className="mt-4 text-sm leading-6">This academic project provides general information only. Submitting a request does not create an attorney-client relationship.</p><Link className="mt-4 inline-block text-sm font-bold text-gold" to="/faq">Read common questions →</Link></div>
        </div>
        <div className="container-page mt-10 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs sm:flex-row sm:justify-between"><span>© {new Date().getFullYear()} LexConnect BD</span><span>CSE 482L · North South University</span></div>
      </footer>
    </div>
  );
}
