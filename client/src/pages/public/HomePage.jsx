import { Link } from 'react-router-dom';

import usePublicData from '../../hooks/usePublicData.js';
import { ErrorAlert, Loading, EmptyState, formatDate } from '../../components/Ui.jsx';

export default function HomePage() {
  const { data: response, error, loading } = usePublicData('/public/home');
  const data = response?.data;
  const services = data?.services || [];
  const lawyers = data?.lawyers || [];
  return (
    <>
      {/* Hero Section */}
      <section className="bg-slate-900 py-24 text-white">
        <div className="container-page">

          <h1 className="max-w-3xl text-4xl font-bold md:text-5xl">
            Find the legal help you need
          </h1>

          <p className="mt-5 max-w-2xl text-lg text-gray-300">
            LexConnect helps people find legal services, browse lawyer
            profiles and request consultations through one platform.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">

            <Link
              to="/consultation"
              className="rounded bg-blue-700 px-5 py-3 font-semibold text-white"
            >
              Request Consultation
            </Link>

            <Link
              to="/lawyers"
              className="rounded border border-white px-5 py-3 font-semibold"
            >
              Find a Lawyer
            </Link>

          </div>

        </div>
      </section>

      <div className="container-page"><ErrorAlert message={error} />{loading && <Loading />}</div>
      {/* Services Section */}
      <section className="py-16">
        <div className="container-page">

          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold">
              Legal Services
            </h2>

            <Link
              to="/services"
              className="font-semibold text-blue-700"
            >
              View All
            </Link>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">

            {!loading && !error && !services.length && <EmptyState title="No services yet" />}
            {services.map((service) => (
              <div
                key={service._id}
                className="rounded-lg border bg-white p-6 shadow-sm"
              >
                <h3 className="text-xl font-semibold">
                  {service.title}
                </h3>

                <p className="mt-3 text-gray-600">
                  {service.summary || service.description}
                </p>

                <Link
                  to={`/services/${service.slug || service._id}`}
                  className="mt-5 inline-block font-semibold text-blue-700"
                >
                  Learn More
                </Link>
              </div>
            ))}

          </div>

        </div>
      </section>

      {/* Lawyers Section */}
      <section className="bg-gray-100 py-16">
        <div className="container-page">

          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold">
              Featured Lawyers
            </h2>

            <Link
              to="/lawyers"
              className="font-semibold text-blue-700"
            >
              View All
            </Link>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">

            {!loading && !error && !lawyers.length && <EmptyState title="No featured lawyers yet" />}
            {lawyers.map((lawyer) => (
              <div
                key={lawyer._id}
                className="rounded-lg bg-white p-6 shadow-sm"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-700 text-xl font-bold text-white">
                  {lawyer.user?.name?.charAt(0)}
                </div>

                <h3 className="mt-4 text-xl font-semibold">
                  {lawyer.user?.name}
                </h3>

                <p className="mt-1 text-blue-700">
                  {lawyer.designation}
                </p>

                <p className="mt-2 text-sm text-gray-600">
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

        </div>
      </section>

      {data?.testimonials?.length > 0 && <section className="py-16"><div className="container-page"><h2 className="text-3xl font-bold">Client feedback</h2><div className="mt-8 grid gap-6 md:grid-cols-2">{data.testimonials.map(item => <blockquote key={item._id} className="rounded-lg border bg-white p-6"><p className="font-semibold text-blue-700">{item.rating}/5 stars</p><p className="mt-3">{item.comment}</p><footer className="mt-4 font-semibold">{item.client?.name}</footer></blockquote>)}</div></div></section>}
      {/* How It Works */}
      <section className="py-16">
        <div className="container-page">

          <h2 className="text-center text-3xl font-bold">
            How LexConnect Works
          </h2>

          <div className="mt-10 grid gap-6 md:grid-cols-3">

            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-700 font-bold text-white">
                1
              </div>

              <h3 className="mt-4 font-semibold">
                Explore Legal Services
              </h3>

              <p className="mt-2 text-gray-600">
                Browse legal services based on your needs.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-700 font-bold text-white">
                2
              </div>

              <h3 className="mt-4 font-semibold">
                Find a Lawyer
              </h3>

              <p className="mt-2 text-gray-600">
                View lawyer profiles and specializations.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-700 font-bold text-white">
                3
              </div>

              <h3 className="mt-4 font-semibold">
                Request Consultation
              </h3>

              <p className="mt-2 text-gray-600">
                Submit a consultation request through the platform.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-700 py-14 text-white">
        <div className="container-page text-center">

          <h2 className="text-3xl font-bold">
            Need legal assistance?
          </h2>

          <p className="mt-3">
            Submit a consultation request and connect with a lawyer.
          </p>

          <Link
            to="/consultation"
            className="mt-6 inline-block rounded bg-white px-5 py-3 font-semibold text-blue-700"
          >
            Request Consultation
          </Link>

        </div>
      </section>
    </>
  );
}