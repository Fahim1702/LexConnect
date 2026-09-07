import { useEffect, useState } from 'react';
import api from '../api/client.js';

export default function usePublicData(path) {
  const [state, setState] = useState({ path, data: null, error: '', loading: true });
  useEffect(() => {
    let active = true;
    setState({ path, data: null, error: '', loading: true });
    api.get(path).then(({ data }) => {
      if (active) setState({ path, data, error: '', loading: false });
    }).catch(error => {
      if (active) setState({ path, data: null, error: error.message, loading: false });
    });
    return () => { active = false; };
  }, [path]);
  return state.path === path ? state : { data: null, error: '', loading: true };
}
