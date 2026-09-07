import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import api from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { ErrorAlert, SuccessAlert } from '../../components/Ui.jsx';

export default function ConsultationPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [services, setServices] = useState([]);
  const [lawyers, setLawyers] = useState([]);

  const [form, setForm] = useState({
    guestName: user?.name || '',
    guestEmail: user?.email || '',
    guestPhone: user?.phone || '',
    service: searchParams.get('service') || '',
    preferredLawyer: searchParams.get('lawyer') || '',
    subject: '',
    details: '',
    preferredDate: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function loadOptions() {
      try {
        const serviceResponse = await api.get('/public/services', {
          params: { limit: 50 }
        });

        const lawyerResponse = await api.get('/public/lawyers', {
          params: { limit: 50 }
        });

        setServices(serviceResponse.data.items);
        setLawyers(lawyerResponse.data.items);
      } catch (err) {
        setError('Unable to load services or lawyers.');
      }
    }

    loadOptions();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm({
      ...form,
      [name]: value
    });
  }

  function validateForm() {
    if (!form.guestName.trim()) {
      return 'Full name is required.';
    }

    if (!form.guestEmail.trim()) {
      return 'Email is required.';
    }

    if (!form.guestEmail.includes('@')) {
      return 'Enter a valid email address.';
    }

    if (!form.guestPhone.trim()) {
      return 'Phone number is required.';
    }

    if (!form.service) {
      return 'Please choose a legal service.';
    }

    if (!form.subject.trim()) {
      return 'Subject is required.';
    }

    if (!form.details.trim()) {
      return 'Please provide brief case details.';
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

      const response = await api.post('/consultations', form);

      const reference = response.data.request?.reference;

      setSuccess(
        reference
          ? `Consultation request submitted. Reference: ${reference}`
          : response.data.message || 'Consultation request submitted successfully.'
      );

      setForm({
        ...form,
        subject: '',
        details: '',
        preferredDate: ''
      });

    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'Unable to submit consultation request.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="py-16">
      <div className="container-page max-w-4xl">

        <h1 className="text-4xl font-bold">
          Request a Consultation
        </h1>

        <p className="mt-4 text-gray-600">
          Tell us about your legal matter. A consultation request does not
          automatically create an attorney-client relationship.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 rounded-lg border bg-white p-6 shadow-sm"
        >
          <ErrorAlert message={error} />
          <SuccessAlert message={success} />

          <div className="grid gap-5 sm:grid-cols-2">

            <div>
              <label className="mb-2 block font-semibold">
                Full Name
              </label>

              <input
                type="text"
                name="guestName"
                value={form.guestName}
                onChange={handleChange}
                disabled={Boolean(user)}
                className="w-full rounded border px-4 py-3 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="mb-2 block font-semibold">
                Email
              </label>

              <input
                type="email"
                name="guestEmail"
                value={form.guestEmail}
                onChange={handleChange}
                disabled={Boolean(user)}
                className="w-full rounded border px-4 py-3 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="mb-2 block font-semibold">
                Phone
              </label>

              <input
                type="text"
                name="guestPhone"
                value={form.guestPhone}
                onChange={handleChange}
                className="w-full rounded border px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block font-semibold">
                Legal Service
              </label>

              <select
                name="service"
                value={form.service}
                onChange={handleChange}
                className="w-full rounded border px-4 py-3"
              >
                <option value="">
                  Choose a service
                </option>

                {services.map((service) => (
                  <option
                    key={service._id}
                    value={service._id}
                  >
                    {service.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block font-semibold">
                Preferred Lawyer
              </label>

              <select
                name="preferredLawyer"
                value={form.preferredLawyer}
                onChange={handleChange}
                className="w-full rounded border px-4 py-3"
              >
                <option value="">
                  No preference
                </option>

                {lawyers.map((lawyer) => (
                  <option
                    key={lawyer._id}
                    value={lawyer._id}
                  >
                    {lawyer.user?.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block font-semibold">
                Preferred Date
              </label>

              <input
                type="date"
                name="preferredDate"
                value={form.preferredDate}
                onChange={handleChange}
                className="w-full rounded border px-4 py-3"
              />
            </div>

          </div>

          <div className="mt-5">
            <label className="mb-2 block font-semibold">
              Subject
            </label>

            <input
              type="text"
              name="subject"
              value={form.subject}
              onChange={handleChange}
              maxLength={180}
              className="w-full rounded border px-4 py-3"
            />
          </div>

          <div className="mt-5">
            <label className="mb-2 block font-semibold">
              Brief Case Details
            </label>

            <textarea
              name="details"
              value={form.details}
              onChange={handleChange}
              rows="6"
              maxLength={5000}
              placeholder="Briefly describe the legal issue."
              className="w-full rounded border px-4 py-3"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 rounded bg-blue-700 px-5 py-3 font-semibold text-white disabled:opacity-60"
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>

        </form>

      </div>
    </section>
  );
}