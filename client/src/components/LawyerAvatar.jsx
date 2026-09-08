import { useState } from 'react';

export default function LawyerAvatar({ lawyer, className = 'h-16 w-16' }) {
  const [failedUrl, setFailedUrl] = useState(null);
  const name = lawyer.user?.name || 'Lawyer';
  const url = lawyer.photoUrl;
  return url && failedUrl !== url
    ? <img src={url} alt={name} className={`${className} rounded-full object-cover`} onError={() => setFailedUrl(url)} />
    : <div aria-label={name} className={`${className} flex items-center justify-center rounded-full bg-blue-700 text-xl font-bold text-white`}>{name.charAt(0)}</div>;
}
