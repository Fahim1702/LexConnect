import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const navLinks = [
    { name: 'Services', path: '/services' },
    { name: 'Lawyers', path: '/lawyers' },
    { name: 'Case Studies', path: '/case-studies' },
    { name: 'Blog', path: '/blog' },
    { name: 'FAQ', path: '/faq' },
    { name: 'Contact', path: '/contact' }
];

export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const { user, loading, logout } = useAuth();
    const location = useLocation();
    const toggleRef = useRef(null);
    const [loggingOut, setLoggingOut] = useState(false);
    const [logoutError, setLogoutError] = useState('');

    useEffect(() => { setMenuOpen(false); }, [location]);

    useEffect(() => {
        if (!menuOpen) return;
        const closeOnEscape = (event) => {
            if (event.key === 'Escape') {
                setMenuOpen(false);
                toggleRef.current?.focus();
            }
        };
        const desktop = window.matchMedia('(min-width: 1280px)');
        const closeOnDesktop = () => { if (desktop.matches) setMenuOpen(false); };
        document.addEventListener('keydown', closeOnEscape);
        desktop.addEventListener('change', closeOnDesktop);
        closeOnDesktop();
        return () => {
            document.removeEventListener('keydown', closeOnEscape);
            desktop.removeEventListener('change', closeOnDesktop);
        };
    }, [menuOpen]);

    const handleLogout = async () => {
        setLoggingOut(true);
        setLogoutError('');
        try {
            await logout();
            setMenuOpen(false);
        } catch {
            setLogoutError('Unable to log out. Please try again.');
        } finally {
            setLoggingOut(false);
        }
    };

    const accountLinks = loading ? <span role="status">Loading account…</span> : user ? (
        <>
            <Link to={`/${user.role}`} onClick={() => setMenuOpen(false)} className="rounded bg-blue-700 px-4 py-2 text-white">Dashboard</Link>
            <button type="button" onClick={handleLogout} disabled={loggingOut} className="py-2 text-left disabled:opacity-50">{loggingOut ? 'Logging out…' : 'Log out'}</button>
        </>
    ) : (
        <>
            <Link to="/login" onClick={() => setMenuOpen(false)} className="py-2">Log in</Link>
            <Link to="/register" onClick={() => setMenuOpen(false)} className="py-2">Register</Link>
            <Link to="/consultation" onClick={() => setMenuOpen(false)} className="rounded bg-blue-700 px-4 py-2 text-white">Request Consultation</Link>
        </>
    );

    return (
        <header className="border-b bg-white">
            <div className="container-page flex items-center justify-between py-4">

                <Link to="/" className="text-xl font-bold">
                    LexConnect
                </Link>

                <nav aria-label="Main navigation" className="hidden gap-4 xl:flex">
                    {navLinks.map((link) => (
                        <NavLink
                            key={link.path}
                            to={link.path}
                            className={({ isActive }) =>
                                isActive
                                    ? 'font-semibold text-blue-700'
                                    : 'text-gray-700 hover:text-blue-700'
                            }
                        >
                            {link.name}
                        </NavLink>
                    ))}
                </nav>

                <div className="hidden items-center gap-4 xl:flex">
                    {accountLinks}
                </div>

                <button
                    ref={toggleRef}
                    type="button"
                    className="rounded p-3 xl:hidden"
                    onClick={() => setMenuOpen((open) => !open)}
                    aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                    aria-expanded={menuOpen}
                    aria-controls="mobile-navigation"
                >
                    {menuOpen ? <X /> : <Menu />}
                </button>

            </div>

            {logoutError && <p role="alert" className="container-page py-2 text-red-700">{logoutError}</p>}
                <div id="mobile-navigation" hidden={!menuOpen} className="container-page border-t py-4 xl:hidden">

                    <nav aria-label="Mobile navigation" className="flex flex-col gap-3">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className="py-2"
                                onClick={() => setMenuOpen(false)}
                            >
                                {link.name}
                            </Link>
                        ))}

                        <div className="flex flex-col gap-3 border-t pt-3">{accountLinks}</div>
                    </nav>

                </div>
        </header>
    );
}
