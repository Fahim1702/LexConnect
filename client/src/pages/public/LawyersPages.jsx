import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

const lawyers = [
  {
    id: 1,
    slug: 'ahsan-rahman',
    name: 'Ahsan Rahman',
    designation: 'Advocate',
    specialization: 'Family Law',
    experience: 8,
    location: 'Dhaka',
    fee: 1500,
    bio: 'Provides legal assistance in divorce, child custody, maintenance and other family-related matters.',
    languages: ['Bangla', 'English'],
    education: ['LL.B', 'LL.M']
  },
  {
    id: 2,
    slug: 'nadia-islam',
    name: 'Nadia Islam',
    designation: 'Advocate',
    specialization: 'Property Law',
    experience: 6,
    location: 'Dhaka',
    fee: 1800,
    bio: 'Works with property ownership, land documentation, transfer and property dispute matters.',
    languages: ['Bangla', 'English'],
    education: ['LL.B', 'LL.M']
  },
  {
    id: 3,
    slug: 'farhan-ahmed',
    name: 'Farhan Ahmed',
    designation: 'Legal Consultant',
    specialization: 'Business Law',
    experience: 10,
    location: 'Chattogram',
    fee: 2000,
    bio: 'Provides legal support for business registration, contracts and commercial legal disputes.',
    languages: ['Bangla', 'English'],
    education: ['LL.B', 'Bar-at-Law']
  }
];

export function LawyersPage() {
  const [search, setSearch] = useState('');
  const [specialization, setSpecialization] = useState('');

  const filteredLawyers = lawyers.filter((lawyer) => {
    const matchesSearch =
      lawyer.name.toLowerCase().includes(search.toLowerCase());

    const matchesSpecialization =
      specialization === '' ||
      lawyer.specialization === specialization;

    return matchesSearch && matchesSpecialization;
  });

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

            <option value="Family Law">
              Family Law
            </option>

            <option value="Property Law">
              Property Law
            </option>

            <option value="Business Law">
              Business Law
            </option>
          </select>

        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">

          {filteredLawyers.map((lawyer) => (
            <div
              key={lawyer.id}
              className="rounded-lg border bg-white p-6 shadow-sm"
            >

              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-700 text-xl font-bold text-white">
                {lawyer.name.charAt(0)}
              </div>

              <h2 className="mt-4 text-xl font-bold">
                {lawyer.name}
              </h2>

              <p className="mt-1 font-semibold text-blue-700">
                {lawyer.designation}
              </p>

              <p className="mt-3 text-gray-600">
                {lawyer.specialization}
              </p>

              <p className="mt-2 text-sm text-gray-500">
                {lawyer.experience} years of experience
              </p>

              <Link
                to={`/lawyers/${lawyer.slug}`}
                className="mt-5 inline-block font-semibold text-blue-700"
              >
                View Profile
              </Link>

            </div>
          ))}

        </div>

        {filteredLawyers.length === 0 && (
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

  const lawyer = lawyers.find(
    (item) => item.slug === identifier
  );

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
            {lawyer.name.charAt(0)}
          </div>

          <h1 className="mt-5 text-3xl font-bold">
            {lawyer.name}
          </h1>

          <p className="mt-1 font-semibold text-blue-700">
            {lawyer.designation}
          </p>

          <p className="mt-4 text-gray-600">
            {lawyer.location}
          </p>

          <div className="mt-6 border-t pt-5">

            <p className="text-sm text-gray-500">
              Consultation Fee
            </p>

            <p className="text-2xl font-bold">
              ৳{lawyer.fee}
            </p>

          </div>

          <Link
            to={`/consultation?lawyer=${lawyer.slug}`}
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
                  {lawyer.specialization}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Experience
                </p>

                <p className="font-semibold">
                  {lawyer.experience} years
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Languages
                </p>

                <p className="font-semibold">
                  {lawyer.languages.join(', ')}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Education
                </p>

                <p className="font-semibold">
                  {lawyer.education.join(', ')}
                </p>
              </div>

            </div>

          </div>

        </main>

      </div>
    </section>
  );
}