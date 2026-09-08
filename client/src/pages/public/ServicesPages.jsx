import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import Pagination from '../../components/Pagination.jsx';
import usePublicData from '../../hooks/usePublicData.js';
import { ErrorAlert, Loading, EmptyState, formatDate } from '../../components/Ui.jsx';

export function ServicesPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);

  const { data, error, loading } = usePublicData(`/public/services?limit=12&page=${page}&category=${encodeURIComponent(category)}&q=${encodeURIComponent(search)}`);
  const filteredServices = data?.items || [];

  return (
    <section className="py-16">
      <div className="container-page">

        <h1 className="text-4xl font-bold">
          Legal Services
        </h1>

        <p className="mt-4 max-w-2xl text-gray-600">
          Browse different areas of legal assistance available through LexConnect.
        </p>

        <input
          type="text"
          placeholder="Search services..."
          value={search}
          onChange={(event) => { setSearch(event.target.value); setPage(1); }}
          className="mt-8 w-full max-w-lg rounded border px-4 py-3"
        />

        <label className="mt-4 block"><span className="block font-semibold">Category</span><select className="mt-2 rounded border px-4 py-3" value={category} onChange={event => { setCategory(event.target.value); setPage(1); }}><option value="">All categories</option>{(data?.categories || (category ? [category] : [])).map(value => <option key={value}>{value}</option>)}</select></label>
        <ErrorAlert message={error} />
        {loading && <Loading />}
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">

          {filteredServices.map((service) => (
            <div
              key={service._id}
              className="rounded-lg border bg-white p-6 shadow-sm"
            >
              <p className="text-sm font-semibold text-blue-700">
                {service.category}
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                {service.title}
              </h2>

              <p className="mt-3 text-gray-600">
                {service.summary || service.description}
              </p>

              <Link
                to={`/services/${service.slug || service._id}`}
                className="mt-5 inline-block font-semibold text-blue-700"
              >
                View Service
              </Link>
            </div>
          ))}

        </div>

        <Pagination pagination={data?.pagination} page={page} onChange={setPage} loading={loading} />
        {!loading && !error && filteredServices.length === 0 && (
          <p className="mt-8 text-gray-500">
            No services found.
          </p>
        )}

      </div>
    </section>
  );
}

export function ServiceDetailPage() {
  const { identifier } = useParams();

  const { data, error, loading } = usePublicData(`/public/services/${identifier}`);
  const service = data?.service;
  if (loading) return <Loading />;
  if (error) return <div className="container-page py-16"><ErrorAlert message={error} /></div>;

  if (!service) {
    return (
      <div className="container-page py-16">
        <h1 className="text-3xl font-bold">
          Service not found
        </h1>

        <Link
          to="/services"
          className="mt-5 inline-block text-blue-700"
        >
          Back to Services
        </Link>
      </div>
    );
  }

  return (
    <>
      <section className="bg-slate-900 py-16 text-white">
        <div className="container-page">

          <p className="text-sm font-semibold text-blue-300">
            {service.category}
          </p>

          <h1 className="mt-2 text-4xl font-bold">
            {service.title}
          </h1>

          <p className="mt-5 max-w-2xl text-gray-300">
            {service.summary || service.description}
          </p>

        </div>
      </section>

      <section className="py-16">
        <div className="container-page">

          <h2 className="text-2xl font-bold">
            About This Service
          </h2>

          <p className="mt-5 max-w-3xl leading-7 text-gray-700">
            {service.description}
          </p>

          <Link
            to={`/consultation?service=${service._id}`}
            className="mt-8 inline-block rounded bg-blue-700 px-5 py-3 font-semibold text-white"
          >
            Request Consultation
          </Link>
          <div className="mt-10 grid gap-6 md:grid-cols-2"><section><h2 className="text-2xl font-bold">Lawyers for this service</h2>{data.lawyers.map(lawyer => <Link className="mt-4 block text-blue-700" key={lawyer._id} to={`/lawyers/${lawyer.slug || lawyer._id}`}>{lawyer.user?.name} ? {lawyer.designation}</Link>)}{!data.lawyers.length && <p className="mt-4 text-gray-600">No lawyer assigned yet.</p>}</section><section><h2 className="text-2xl font-bold">Related case studies</h2>{data.caseStudies.map(item => <Link className="mt-4 block text-blue-700" key={item._id} to={`/case-studies/${item.slug || item._id}`}>{item.title}</Link>)}</section></div>

        </div>
      </section>
    </>
  );
}