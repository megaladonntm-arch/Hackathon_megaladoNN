const DEFAULT_API_BASE = 'https://hackathon-megaladonn.onrender.com';
const rawApiBase = (process.env.REACT_APP_API_BASE || DEFAULT_API_BASE).trim();

export const API_BASE = rawApiBase.replace(/\/+$/, '');

export async function apiFetch(path, options = {}, token) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Request failed');
  }
  if (response.status === 204) {
    return null;
  }
  return response.json();
}
