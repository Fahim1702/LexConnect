export default function Pagination({ pagination, page, onChange, loading = false }) {
  if (!pagination || pagination.pages <= 1) return null;
  return <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-4"><button className="rounded border px-4 py-2 disabled:opacity-40" disabled={loading || page <= 1} onClick={() => onChange(page - 1)}>Previous</button><span>Page {page} of {pagination.pages}</span><button className="rounded border px-4 py-2 disabled:opacity-40" disabled={loading || page >= pagination.pages} onClick={() => onChange(page + 1)}>Next</button></nav>;
}
