import { Link, useParams } from 'react-router-dom';

const caseStudies = [
  {
    id: 1,
    slug: 'family-dispute-resolution',
    service: 'Family Law',
    title: 'Resolving a Family Dispute',
    summary:
      'A family dispute was handled through legal consultation and negotiation.',
    challenge:
      'The client needed guidance regarding a family dispute involving responsibilities and legal rights.',
    approach:
      'The lawyer reviewed the situation, explained the available legal options and helped the client proceed through negotiation.',
    outcome:
      'The dispute was resolved without requiring a lengthy court process.'
  },
  {
    id: 2,
    slug: 'property-documentation',
    service: 'Property Law',
    title: 'Property Documentation Support',
    summary:
      'Legal support was provided to review and organize property documents.',
    challenge:
      'The client had incomplete and confusing property documents.',
    approach:
      'The lawyer reviewed the available records and identified the documents that needed correction.',
    outcome:
      'The client was able to organize the required documentation and proceed with the property matter.'
  }
];

const blogPosts = [
  {
    id: 1,
    slug: 'understanding-property-documents',
    category: 'Property Law',
    title: 'Understanding Property Documents',
    author: 'Nadia Islam',
    date: 'September 1, 2026',
    excerpt:
      'A simple introduction to important property documents and why they matter.',
    content:
      'Property transactions involve several documents. Before making a major decision, a person should carefully review ownership records, agreements and supporting documents. Legal assistance may help identify missing or inconsistent information.'
  },
  {
    id: 2,
    slug: 'before-signing-a-contract',
    category: 'Business Law',
    title: 'What to Check Before Signing a Contract',
    author: 'Farhan Ahmed',
    date: 'August 28, 2026',
    excerpt:
      'Important points to review before entering into a legal agreement.',
    content:
      'A contract should clearly describe the responsibilities of each party. Important sections can include payment terms, deadlines, termination conditions and dispute resolution procedures.'
  }
];

const faqs = [
  {
    id: 1,
    question: 'How do I request a consultation?',
    answer:
      'Open the consultation page, complete the required information and submit the request.'
  },
  {
    id: 2,
    question: 'Can I choose a lawyer?',
    answer:
      'Yes. You can browse the lawyer directory and select a lawyer before submitting a consultation request.'
  },
  {
    id: 3,
    question: 'Can I cancel my consultation request?',
    answer:
      'Registered clients can view their consultation requests from the client dashboard and cancel eligible requests.'
  },
  {
    id: 4,
    question: 'Is the information on LexConnect legal advice?',
    answer:
      'No. The website provides general information and helps users connect with legal professionals.'
  }
];

export function CaseStudiesPage() {
  return (
    <section className="py-16">
      <div className="container-page">

        <h1 className="text-4xl font-bold">
          Case Studies
        </h1>

        <p className="mt-4 max-w-2xl text-gray-600">
          Example legal situations showing the problem, approach and outcome.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">

          {caseStudies.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border bg-white p-6 shadow-sm"
            >
              <p className="text-sm font-semibold text-blue-700">
                {item.service}
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                {item.title}
              </h2>

              <p className="mt-3 text-gray-600">
                {item.summary}
              </p>

              <Link
                to={`/case-studies/${item.slug}`}
                className="mt-5 inline-block font-semibold text-blue-700"
              >
                Read Case Study
              </Link>
            </div>
          ))}

        </div>

      </div>
    </section>
  );
}

export function CaseStudyDetailPage() {
  const { identifier } = useParams();

  const item = caseStudies.find(
    (caseStudy) => caseStudy.slug === identifier
  );

  if (!item) {
    return (
      <div className="container-page py-16">
        <h1 className="text-3xl font-bold">
          Case study not found
        </h1>

        <Link
          to="/case-studies"
          className="mt-5 inline-block text-blue-700"
        >
          Back to Case Studies
        </Link>
      </div>
    );
  }

  return (
    <article className="py-16">
      <div className="container-page max-w-4xl">

        <p className="font-semibold text-blue-700">
          {item.service}
        </p>

        <h1 className="mt-2 text-4xl font-bold">
          {item.title}
        </h1>

        <p className="mt-5 text-lg text-gray-600">
          {item.summary}
        </p>

        <div className="mt-10 grid gap-6">

          <section className="rounded-lg border bg-white p-6">
            <h2 className="text-2xl font-bold">
              The Challenge
            </h2>

            <p className="mt-4 leading-7 text-gray-700">
              {item.challenge}
            </p>
          </section>

          <section className="rounded-lg border bg-white p-6">
            <h2 className="text-2xl font-bold">
              The Approach
            </h2>

            <p className="mt-4 leading-7 text-gray-700">
              {item.approach}
            </p>
          </section>

          <section className="rounded-lg bg-blue-700 p-6 text-white">
            <h2 className="text-2xl font-bold">
              The Outcome
            </h2>

            <p className="mt-4 leading-7">
              {item.outcome}
            </p>
          </section>

        </div>

      </div>
    </article>
  );
}

export function BlogPage() {
  return (
    <section className="py-16">
      <div className="container-page">

        <h1 className="text-4xl font-bold">
          Blog
        </h1>

        <p className="mt-4 max-w-2xl text-gray-600">
          Read simple articles about common legal topics.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">

          {blogPosts.map((post) => (
            <div
              key={post.id}
              className="rounded-lg border bg-white p-6 shadow-sm"
            >

              <p className="text-sm font-semibold text-blue-700">
                {post.category}
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                {post.title}
              </h2>

              <p className="mt-3 text-gray-600">
                {post.excerpt}
              </p>

              <p className="mt-4 text-sm text-gray-500">
                {post.author} · {post.date}
              </p>

              <Link
                to={`/blog/${post.slug}`}
                className="mt-5 inline-block font-semibold text-blue-700"
              >
                Read More
              </Link>

            </div>
          ))}

        </div>

      </div>
    </section>
  );
}

export function BlogDetailPage() {
  const { identifier } = useParams();

  const post = blogPosts.find(
    (blogPost) => blogPost.slug === identifier
  );

  if (!post) {
    return (
      <div className="container-page py-16">

        <h1 className="text-3xl font-bold">
          Blog post not found
        </h1>

        <Link
          to="/blog"
          className="mt-5 inline-block text-blue-700"
        >
          Back to Blog
        </Link>

      </div>
    );
  }

  return (
    <article className="py-16">
      <div className="container-page max-w-3xl">

        <p className="font-semibold text-blue-700">
          {post.category}
        </p>

        <h1 className="mt-2 text-4xl font-bold">
          {post.title}
        </h1>

        <p className="mt-4 text-sm text-gray-500">
          By {post.author} · {post.date}
        </p>

        <p className="mt-8 border-y py-6 text-xl text-gray-600">
          {post.excerpt}
        </p>

        <p className="mt-8 leading-8 text-gray-700">
          {post.content}
        </p>

      </div>
    </article>
  );
}

export function FAQPage() {
  return (
    <section className="py-16">
      <div className="container-page max-w-4xl">

        <h1 className="text-4xl font-bold">
          Frequently Asked Questions
        </h1>

        <p className="mt-4 text-gray-600">
          Find answers to common questions about using LexConnect.
        </p>

        <div className="mt-10 grid gap-4">

          {faqs.map((faq) => (
            <details
              key={faq.id}
              className="rounded-lg border bg-white"
            >
              <summary className="cursor-pointer p-5 font-semibold">
                {faq.question}
              </summary>

              <p className="border-t px-5 py-4 leading-7 text-gray-600">
                {faq.answer}
              </p>
            </details>
          ))}

        </div>

      </div>
    </section>
  );
}