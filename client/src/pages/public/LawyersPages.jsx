import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import usePublicData from '../../hooks/usePublicData.js';
import { ErrorAlert, Loading, EmptyState, formatDate } from '../../components/Ui.jsx';

export function LawyersPage() {
  const [search, setSearch] = useState('');
  const [specialization, setSpecialization] = useState('');

  const [minExperience, setMinExperience] = useState('');
  const { data, error, loading } = usePublicData(`/public/lawyers?limit=50&q=${encodeURIComponent(search)}&service=${encodeURIComponent(specialization)}&minExperience=${encodeURIComponent(minExperience || '0')}`);
  const serviceOptions = usePublicData('/public/services?limit=50');
  const filteredLawyers = data?.items || [];

  return (
    <section className="py-16">
      <div className="container-page">

        <h1 className="text-4xl font-bold">
          Lawyer Directory
        </h1>

        <p className="mt-4 max-w-2xl text-gray-600">
          Search lawyers by name or legal specialization.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">

          <input
            type="text"
            placeholder="Search lawyer by name..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="rounded border px-4 py-3"
          />

          <select
            value={specialization}
            onChange={(event) => setSpecialization(event.target.value)}
            className="rounded border px-4 py-3"
          >
            <option value="">
              All Specializations
            </option>

            {serviceOptions.data?.items.map(service => <option key={service._id} value={service._id}>{service.title}</option>)}

          </select>

        </div>

        <label className="mt-4 block"><span className="block font-semibold">Minimum years of experience</span><input type="number" min="0" className="mt-2 rounded border px-4 py-3" value={minExperience} onChange={event => setMinExperience(event.target.value)} /></label>
        <ErrorAlert message={error || serviceOptions.error} />
        {loading && <Loading />}
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">

          {filteredLawyers.map((lawyer) => (
            <div
              key={lawyer._id}
              className="rounded-lg border bg-white p-6 shadow-sm"
            >

              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-700 text-xl font-bold text-white">
                {lawyer.user?.name?.charAt(0)}
              </div>

              <h2 className="mt-4 text-xl font-bold">
                {lawyer.user?.name}
              </h2>

              <p className="mt-1 font-semibold text-blue-700">
                {lawyer.designation}
              </p>

              <p className="mt-3 text-gray-600">
                {lawyer.services?.map(service => service.title).join(', ')}
              </p>

              <p className="mt-2 text-sm text-gray-500">
                {lawyer.experienceYears} years of experience
              </p>

              <Link
                to={`/lawyers/${lawyer.slug || lawyer._id}`}
                className="mt-5 inline-block font-semibold text-blue-700"
              >
                View Profile
              </Link>

            </div>
          ))}

        </div>

        {!loading && !error && filteredLawyers.length === 0 && (
          <p className="mt-8 text-gray-500">
            No lawyers found.
          </p>
        )}

      </div>
    </section>
  );
}

export function LawyerDetailPage() {
  const { identifier } = useParams();

  const { data, error, loading } = usePublicData(`/public/lawyers/${identifier}`);
  const lawyer = data?.lawyer;
  if (loading) return <Loading />;
  if (error) return <div className="container-page py-16"><ErrorAlert message={error} /></div>;

  if (!lawyer) {
    return (
      <div className="container-page py-16">

        <h1 className="text-3xl font-bold">
          Lawyer not found
        </h1>

        <Link
          to="/lawyers"
          className="mt-5 inline-block text-blue-700"
        >
          Back to Lawyer Directory
        </Link>

      </div>
    );
  }

  return (
    <section className="py-16">
      <div className="container-page grid gap-8 lg:grid-cols-[300px_1fr]">

        <aside className="rounded-lg border bg-white p-6 shadow-sm">

          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-700 text-3xl font-bold text-white">
            {lawyer.user?.name?.charAt(0)}
          </div>

          <h1 className="mt-5 text-3xl font-bold">
            {lawyer.user?.name}
          </h1>

          <p className="mt-1 font-semibold text-blue-700">
            {lawyer.designation}
          </p>

          <p className="mt-4 text-gray-600">
            {lawyer.chamberAddress || 'Chamber address not listed'}
          </p>

          <div className="mt-6 border-t pt-5">

            <p className="text-sm text-gray-500">
              Consultation Fee
            </p>

            <p className="text-2xl font-bold">
              ৳{lawyer.consultationFee?.toLocaleString()}
            </p>

          </div>

          <Link
            to={`/consultation?lawyer=${lawyer._id}`}
            className="mt-6 inline-block rounded bg-blue-700 px-5 py-3 font-semibold text-white"
          >
            Request Consultation
          </Link>

        </aside>

        <main>

          <div className="rounded-lg border bg-white p-6 shadow-sm">

            <h2 className="text-2xl font-bold">
              Professional Profile
            </h2>

            <p className="mt-4 leading-7 text-gray-700">
              {lawyer.bio}
            </p>

            <div className="mt-8 grid gap-6 border-t pt-6 sm:grid-cols-2">

              <div>
                <p className="text-sm text-gray-500">
                  Specialization
                </p>

                <p className="font-semibold">
                  {lawyer.services?.map(service => service.title).join(', ')}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Experience
                </p>

                <p className="font-semibold">
                  {lawyer.experienceYears} years
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Languages
                </p>

                <p className="font-semibold">
                  {lawyer.languages?.join(', ')}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Education
                </p>

                <p className="font-semibold">
                  {lawyer.education?.join(', ')}
                </p>
              </div>

            </div>

          </div>

          <section className="mt-6 rounded-lg border bg-white p-6"><h2 className="text-2xl font-bold">Professional details</h2><p className="mt-4">Bar Council no.: {lawyer.barCouncilNumber}</p><h3 className="mt-5 font-semibold">Practice areas</h3>{lawyer.services?.map(service => <Link key={service._id} className="mt-3 block text-blue-700" to={`/services/${service.slug || service._id}`}>{service.title}</Link>)}{data.caseStudies.length > 0 && <><h3 className="mt-5 font-semibold">Case studies</h3>{data.caseStudies.map(item => <Link key={item._id} className="mt-3 block text-blue-700" to={`/case-studies/${item.slug || item._id}`}>{item.title}</Link>)}</>}</section>
        </main>

      </div>
    </section>
  );
}