import { Link } from 'react-router-dom';

const services = [
  {
    id: 1,
    title: 'Family Law',
    description:
      'Get legal guidance for marriage, divorce, child custody and other family matters.'
  },
  {
    id: 2,
    title: 'Property Law',
    description:
      'Find legal assistance for property ownership, land disputes and documentation.'
  },
  {
    id: 3,
    title: 'Business Law',
    description:
      'Get support for contracts, business registration and commercial legal issues.'
  }
];

const lawyers = [
  {
    id: 1,
    name: 'Ahsan Rahman',
    specialization: 'Family Law',
    experience: 8
  },
  {
    id: 2,
    name: 'Nadia Islam',
    specialization: 'Property Law',
    experience: 6
  },
  {
    id: 3,
    name: 'Farhan Ahmed',
    specialization: 'Business Law',
    experience: 10
  }
];

export default function HomePage() {
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

            {services.map((service) => (
              <div
                key={service.id}
                className="rounded-lg border bg-white p-6 shadow-sm"
              >
                <h3 className="text-xl font-semibold">
                  {service.title}
                </h3>

                <p className="mt-3 text-gray-600">
                  {service.description}
                </p>

                <Link
                  to="/services"
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

            {lawyers.map((lawyer) => (
              <div
                key={lawyer.id}
                className="rounded-lg bg-white p-6 shadow-sm"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-700 text-xl font-bold text-white">
                  {lawyer.name.charAt(0)}
                </div>

                <h3 className="mt-4 text-xl font-semibold">
                  {lawyer.name}
                </h3>

                <p className="mt-1 text-blue-700">
                  {lawyer.specialization}
                </p>

                <p className="mt-2 text-sm text-gray-600">
                  {lawyer.experience} years of experience
                </p>

                <Link
                  to="/lawyers"
                  className="mt-5 inline-block font-semibold text-blue-700"
                >
                  View Profile
                </Link>
              </div>
            ))}

          </div>

        </div>
      </section>

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