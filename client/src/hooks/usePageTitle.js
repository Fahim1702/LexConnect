import { useEffect } from 'react';

export default function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | LexConnect BD` : 'LexConnect BD';
    return () => {
      document.title = 'LexConnect BD';
    };
  }, [title]);
}
