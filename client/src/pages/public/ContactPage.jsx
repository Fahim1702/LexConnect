import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Mail, MapPin, Phone, Send } from 'lucide-react';
import api from '../../api/client.js';
import { ErrorAlert, SuccessAlert } from '../../components/Ui.jsx';
import { PageHero } from '../../components/public/PublicUi.jsx';
import usePageTitle from '../../hooks/usePageTitle.js';

const EMPTY_FORM = { name: '', email: '', phone: '', subject: '', message: '' };
const MESSAGE_LIMIT = 1200;

export default function ContactPage() {
  usePageTitle('Contact');
  const [form, setForm] = useState(EMPTY_FORM);
  const [status, setStatus] = useState({ loading: false, error: '', success: '' });

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (status.error || status.success) setStatus({ loading: false, error: '', success: '' });
  };

  const submit = async (event) => {
    event.preventDefault();
    setStatus({ loading: true, error: '', success: '' });

    try {
      const { data } = await api.post('/public/contact', form);
      setForm(EMPTY_FORM);
      setStatus({ loading: false, error: '', success: data.message || 'Your message has been sent.' });
    } catch (error) {
      setStatus({ loading: false, error: error.message, success: '' });
    }
  };

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Let’s start a conversation"
        description="Send us a general question, feedback, or partnership enquiry. For help with a legal matter, request a consultation instead."
      />
      <section className="section-pad">
        <div className="container-page grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:gap-12">
          <aside className="h-fit rounded-2xl bg-ink p-6 text-white sm:p-8">
            <p className="eyebrow">Reach us</p>
            <h2 className="text-2xl font-bold sm:text-3xl">We are here to help you find the right next step.</h2>
            <p className="mt-4 leading-7 text-white/65">Our team will review your message and respond through the contact details you provide.</p>
            <address className="mt-8 grid gap-5 text-sm not-italic">
              <ContactItem icon={MapPin} label="Office">Bashundhara, Dhaka, Bangladesh</ContactItem>
              <ContactItem icon={Phone} label="Phone" href="tel:+8801700000000">+880 1700-000000</ContactItem>
              <ContactItem icon={Mail} label="Email" href="mailto:hello@lexconnect.test">hello@lexconnect.test</ContactItem>
            </address>
            <div className="mt-8 border-t border-white/15 pt-6">
              <p className="font-bold">Do you need legal assistance?</p>
              <p className="mt-2 text-sm leading-6 text-white/65">Share the basic details securely through our consultation request form.</p>
              <Link className="mt-4 inline-flex items-center gap-2 font-bold text-gold transition hover:text-white" to="/consultation">
                Request a consultation <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>
          </aside>

          <form className="card p-5 sm:p-8" onSubmit={submit}>
            <div className="mb-7">
              <p className="eyebrow">Send a message</p>
              <h2 className="text-2xl font-bold sm:text-3xl">How can we help?</h2>
              <p className="mt-2 text-sm text-slate-500">Fields marked with an asterisk are required.</p>
            </div>
            <ErrorAlert message={status.error} />
            <SuccessAlert message={status.success} />

            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                autoComplete="name"
                label="Name"
                name="name"
                required
                value={form.name}
                onChange={(value) => updateField('name', value)}
              />
              <Field
                autoComplete="email"
                label="Email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={(value) => updateField('email', value)}
              />
              <Field
                autoComplete="tel"
                label="Phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={(value) => updateField('phone', value)}
              />
              <Field
                label="Subject"
                name="subject"
                required
                value={form.subject}
                onChange={(value) => updateField('subject', value)}
              />
            </div>

            <label className="mt-5 block" htmlFor="contact-message">
              <span className="label">Message *</span>
              <textarea
                className="input min-h-40 resize-y"
                id="contact-message"
                maxLength={MESSAGE_LIMIT}
                name="message"
                placeholder="Write your message here..."
                required
                value={form.message}
                onChange={(event) => updateField('message', event.target.value)}
              />
              <span className="mt-1.5 block text-right text-xs text-slate-400" aria-live="polite">
                {form.message.length}/{MESSAGE_LIMIT}
              </span>
            </label>

            <button className="btn-primary mt-5 w-full sm:w-auto" disabled={status.loading} type="submit">
              <Send size={17} aria-hidden="true" />
              {status.loading ? 'Sending…' : 'Send message'}
            </button>
          </form>
        </div>
      </section>
    </>
  );
}

function ContactItem({ icon: Icon, label, href, children }) {
  const content = (
    <>
      <Icon className="mt-0.5 shrink-0 text-gold" size={20} aria-hidden="true" />
      <span><span className="block font-bold text-white">{label}</span><span className="mt-0.5 block text-white/65">{children}</span></span>
    </>
  );

  return href
    ? <a className="flex gap-3 rounded-lg transition hover:text-gold" href={href}>{content}</a>
    : <div className="flex gap-3">{content}</div>;
}

function Field({ autoComplete, label, name, value, onChange, type = 'text', required = false }) {
  const id = `contact-${name}`;
  return (
    <label htmlFor={id}>
      <span className="label">{label}{required ? ' *' : ''}</span>
      <input
        autoComplete={autoComplete}
        className="input"
        id={id}
        name={name}
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
