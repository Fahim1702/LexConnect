import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
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
    const { user } = useAuth();

    return (
        <header className="border-b bg-white">
            <div className="container-page flex items-center justify-between py-4">

                <Link to="/" className="text-xl font-bold">
                    LexConnect
                </Link>

                <nav className="hidden gap-6 lg:flex">
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

                <div className="hidden items-center gap-4 lg:flex">
                    {user ? (
                        <Link
                            to={`/${user.role}`}
                            className="rounded bg-blue-700 px-4 py-2 text-white"
                        >
                            Dashboard
                        </Link>
                    ) : (
                        <>
                            <Link to="/login">
                                Log in
                            </Link>

                            <Link
                                to="/consultation"
                                className="rounded bg-blue-700 px-4 py-2 text-white"
                            >
                                Request Consultation
                            </Link>
                        </>
                    )}
                </div>

                <button
                    className="lg:hidden"
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Toggle menu"
                >
                    {menuOpen ? <X /> : <Menu />}
                </button>

            </div>

            {menuOpen && (
                <div className="container-page border-t py-4 lg:hidden">

                    <nav className="flex flex-col gap-3">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                onClick={() => setMenuOpen(false)}
                            >
                                {link.name}
                            </Link>
                        ))}

                        <Link
                            to={user ? `/${user.role}` : '/consultation'}
                            onClick={() => setMenuOpen(false)}
                            className="font-semibold text-blue-700"
                        >
                            {user ? 'Dashboard' : 'Request Consultation'}
                        </Link>
                    </nav>

                </div>
            )}
        </header>
    );
}