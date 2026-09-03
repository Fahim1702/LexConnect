import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

const services = [
  {
    id: 1,
    slug: 'family-law',
    title: 'Family Law',
    category: 'Personal',
    summary: 'Legal support for marriage, divorce, custody and family disputes.',
    description:
      'Family law covers legal matters involving marriage, divorce, child custody, maintenance and other family-related disputes.'
  },
  {
    id: 2,
    slug: 'property-law',
    title: 'Property Law',
    category: 'Property',
    summary: 'Legal assistance for land, ownership, documentation and property disputes.',
    description:
      'Property law deals with ownership, transfer, documentation, land disputes and other legal matters involving property.'
  },
  {
    id: 3,
    slug: 'business-law',
    title: 'Business Law',
    category: 'Commercial',
    summary: 'Legal support for businesses, contracts and company-related matters.',
    description:
      'Business law covers contracts, business registration, commercial disputes and other legal issues faced by companies.'
  }
];

export function ServicesPage() {
  const [search, setSearch] = useState('');

  const filteredServices = services.filter((service) =>
    service.title.toLowerCase().includes(search.toLowerCase())
  );

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
          onChange={(event) => setSearch(event.target.value)}
          className="mt-8 w-full max-w-lg rounded border px-4 py-3"
        />

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">

          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="rounded-lg border bg-white p-6 shadow-sm"
            >
              <p className="text-sm font-semibold text-blue-700">
                {service.category}
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                {service.title}
              </h2>

              <p className="mt-3 text-gray-600">
                {service.summary}
              </p>

              <Link
                to={`/services/${service.slug}`}
                className="mt-5 inline-block font-semibold text-blue-700"
              >
                View Service
              </Link>
            </div>
          ))}

        </div>

        {filteredServices.length === 0 && (
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

  const service = services.find(
    (item) => item.slug === identifier
  );

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
            {service.summary}
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
            to={`/consultation?service=${service.slug}`}
            className="mt-8 inline-block rounded bg-blue-700 px-5 py-3 font-semibold text-white"
          >
            Request Consultation
          </Link>

        </div>
      </section>
    </>
  );
}