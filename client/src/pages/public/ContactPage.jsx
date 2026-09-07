import { useState } from 'react';
import api from '../../api/client.js';
import { ErrorAlert, SuccessAlert } from '../../components/Ui.jsx';

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm({
      ...form,
      [name]: value
    });
  }

  function validateForm() {
    if (!form.name.trim()) {
      return 'Name is required.';
    }

    if (!form.email.trim()) {
      return 'Email is required.';
    }

    if (!form.email.includes('@')) {
      return 'Enter a valid email address.';
    }

    if (!form.subject.trim()) {
      return 'Subject is required.';
    }

    if (!form.message.trim()) {
      return 'Message is required.';
    }

    return '';
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError('');
    setSuccess('');

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);

      const response = await api.post('/public/contact', form);

      setSuccess(
        response.data.message || 'Message sent successfully.'
      );

      setForm({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });

    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'Unable to send message.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="py-16">
      <div className="container-page grid gap-10 lg:grid-cols-2">

        <div>
          <h1 className="text-4xl font-bold">
            Contact Us
          </h1>

          <p className="mt-4 max-w-xl text-gray-600">
            Send us a message for general questions about LexConnect.
            For legal assistance, use the consultation request form.
          </p>

          <div className="mt-8 space-y-3 text-gray-700">
            <p>
              <strong>Address:</strong> Bashundhara, Dhaka, Bangladesh
            </p>

            <p>
              <strong>Phone:</strong> +880 1700-000000
            </p>

            <p>
              <strong>Email:</strong> hello@lexconnect.test
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-lg border bg-white p-6 shadow-sm"
        >

          <ErrorAlert message={error} />
          <SuccessAlert message={success} />

          <div className="grid gap-5 sm:grid-cols-2">

            <div>
              <label className="mb-2 block font-semibold">
                Name
              </label>

              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full rounded border px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block font-semibold">
                Email
              </label>

              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full rounded border px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block font-semibold">
                Phone
              </label>

              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full rounded border px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block font-semibold">
                Subject
              </label>

              <input
                type="text"
                name="subject"
                value={form.subject}
                onChange={handleChange}
                className="w-full rounded border px-4 py-3"
              />
            </div>

          </div>

          <div className="mt-5">
            <label className="mb-2 block font-semibold">
              Message
            </label>

            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              rows="6"
              className="w-full rounded border px-4 py-3"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-5 rounded bg-blue-700 px-5 py-3 font-semibold text-white disabled:opacity-60"
          >
            {loading ? 'Sending...' : 'Send Message'}
          </button>

        </form>

      </div>
    </section>
  );
}