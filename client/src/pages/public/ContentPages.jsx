import { Link, useParams } from 'react-router-dom';

import usePublicData from '../../hooks/usePublicData.js';
import { ErrorAlert, Loading, EmptyState, formatDate } from '../../components/Ui.jsx';

export function CaseStudiesPage() {
  const { data, error, loading } = usePublicData('/public/case-studies');
  const caseStudies = data?.items || [];
  if (loading) return <Loading />;
  if (error) return <div className="container-page py-16"><ErrorAlert message={error} /></div>;
  if (!caseStudies.length) return <div className="container-page py-16"><EmptyState /></div>;
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
              key={item._id}
              className="rounded-lg border bg-white p-6 shadow-sm"
            >
              <p className="text-sm font-semibold text-blue-700">
                {item.service?.title}
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

  const { data, error, loading } = usePublicData(`/public/case-studies/${identifier}`);
  const item = data?.item;
  if (loading) return <Loading />;
  if (error) return <div className="container-page py-16"><ErrorAlert message={error} /></div>;

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
          {item.service?.title}
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
  const { data, error, loading } = usePublicData('/public/blog?limit=50');
  const blogPosts = data?.items || [];
  if (loading) return <Loading />;
  if (error) return <div className="container-page py-16"><ErrorAlert message={error} /></div>;
  if (!blogPosts.length) return <div className="container-page py-16"><EmptyState /></div>;
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
              key={post._id}
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
                {post.author?.name} · {formatDate(post.publishedAt)}
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

  const { data, error, loading } = usePublicData(`/public/blog/${identifier}`);
  const post = data?.item;
  if (loading) return <Loading />;
  if (error) return <div className="container-page py-16"><ErrorAlert message={error} /></div>;

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
          By {post.author?.name} · {formatDate(post.publishedAt)}
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
  const { data, error, loading } = usePublicData('/public/faqs');
  const faqs = data?.items || [];
  if (loading) return <Loading />;
  if (error) return <div className="container-page py-16"><ErrorAlert message={error} /></div>;
  if (!faqs.length) return <div className="container-page py-16"><EmptyState /></div>;
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
              key={faq._id}
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