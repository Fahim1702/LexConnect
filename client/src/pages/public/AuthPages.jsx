import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Scale } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { ErrorAlert } from '../../components/Ui.jsx';

function AuthShell({ title, children, footer }) { return <div className="section-pad"><div className="container-page max-w-md"><div className="mb-7 flex justify-center"><span className="rounded-2xl bg-forest p-4 text-gold"><Scale size={32} /></span></div><div className="card"><h1 className="text-center text-3xl font-bold">{title}</h1>{children}<p className="mt-6 text-center text-sm text-slate-500">{footer}</p></div></div></div>; }

export function LoginPage() {
  const { user, login } = useAuth(); const [form, setForm] = useState({ email: '', password: '' }); const [status, setStatus] = useState({ loading: false, error: '' }); const navigate = useNavigate(); const location = useLocation();
  if (user) return <Navigate to={`/${user.role}`} replace />;
  const submit = async (e) => { e.preventDefault(); setStatus({ loading: true, error: '' }); try { const account = await login(form); navigate(location.state?.from?.pathname || `/${account.role}`, { replace: true }); } catch (error) { setStatus({ loading: false, error: error.message }); } };
  return <AuthShell title="Welcome back" footer={<>New to LexConnect? <Link className="font-bold text-forest" to="/register">Create an account</Link></>}><form className="mt-6" onSubmit={submit}><ErrorAlert message={status.error} /><label className="block"><span className="label">Email</span><input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label><label className="mt-4 block"><span className="label">Password</span><input className="input" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label><button className="btn-primary mt-6 w-full" disabled={status.loading}>{status.loading ? 'Logging in…' : 'Log in'}</button></form></AuthShell>;
}

export function RegisterPage() {
  const { user, register } = useAuth(); const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' }); const [status, setStatus] = useState({ loading: false, error: '' }); const navigate = useNavigate();
  if (user) return <Navigate to={`/${user.role}`} replace />;
  const submit = async (e) => { e.preventDefault(); setStatus({ loading: true, error: '' }); try { await register(form); navigate('/client'); } catch (error) { setStatus({ loading: false, error: error.message }); } };
  return <AuthShell title="Create client account" footer={<>Already registered? <Link className="font-bold text-forest" to="/login">Log in</Link></>}><form className="mt-6" onSubmit={submit}><ErrorAlert message={status.error} />{[['Full name', 'name', 'text'], ['Email', 'email', 'email'], ['Phone', 'phone', 'tel'], ['Password (8+ characters)', 'password', 'password']].map(([label, key, type]) => <label className="mt-4 block first:mt-0" key={key}><span className="label">{label}</span><input className="input" type={type} required={key !== 'phone'} minLength={key === 'password' ? 8 : undefined} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} /></label>)}<button className="btn-primary mt-6 w-full" disabled={status.loading}>{status.loading ? 'Creating account…' : 'Create account'}</button></form></AuthShell>;
}
