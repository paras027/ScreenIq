import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
});

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      document.cookie = 'access_token=; path=/; max-age=0';
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const login = (data) => api.post('/login/', data);
export const register = (data) => api.post('/register/', data);
export const screenCandidate = (data) => api.post('/screen/', data);
export const getApplications = (page = 1) => api.get(`/applications/?page=${page}`);

export function screenCandidateStream(data, onChunk, onDone, onError) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  fetch('/api/stream/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, token }),
  }).then(async (res) => {
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      onError(err.error || 'Streaming failed.');
      return;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop();
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const parsed = JSON.parse(line.slice(6));
          if (parsed.error) { onError(parsed.error); return; }
          if (parsed.done) { onDone(parsed); return; }
          if (parsed.chunk) onChunk(parsed.chunk);
        } catch {}
      }
    }
  }).catch(() => onError('Connection failed.'));
}

export default api;
