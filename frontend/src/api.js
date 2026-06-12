const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Backend origin (without /api) — used for direct file access
const API_ORIGIN = API_BASE === '/api' ? '' : API_BASE.replace(/\/api$/, '');

// ---- Auth token management ----
function getToken() {
  return localStorage.getItem('auth_token');
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
}

export function isLoggedIn() {
  return !!getToken();
}

async function request(url, options = {}) {
  const { isFormData, ...fetchOptions } = options;

  const headers = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  // Attach auth token if available
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${url}`, {
    headers,
    ...fetchOptions,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Request failed');
  return json.data;
}

// ---- Auth ----
export const register = (username, password) =>
  request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

export const login = (username, password) =>
  request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

export const getMe = () => request('/auth/me');

// ---- Books ----
export const fetchBooks = (status) => request(`/books${status ? `?status=${status}` : ''}`);
export const fetchBook = (id) => request(`/books/${id}`);

export const createBook = (data, file) => {
  if (file) {
    const fd = new FormData();
    fd.append('title', data.title);
    fd.append('author', data.author);
    if (data.cover_url) fd.append('cover_url', data.cover_url);
    if (data.total_pages) fd.append('total_pages', String(data.total_pages));
    if (data.status) fd.append('status', data.status);
    fd.append('file', file);
    return request('/books', { method: 'POST', body: fd, isFormData: true });
  }
  return request('/books', { method: 'POST', body: JSON.stringify(data) });
};

export const updateBook = (id, data, file) => {
  if (file) {
    const fd = new FormData();
    if (data.title) fd.append('title', data.title);
    if (data.author) fd.append('author', data.author);
    if (data.cover_url !== undefined) fd.append('cover_url', data.cover_url);
    if (data.total_pages !== undefined) fd.append('total_pages', String(data.total_pages));
    if (data.current_page !== undefined) fd.append('current_page', String(data.current_page));
    if (data.status) fd.append('status', data.status);
    fd.append('file', file);
    return request(`/books/${id}`, { method: 'PUT', body: fd, isFormData: true });
  }
  return request(`/books/${id}`, { method: 'PUT', body: JSON.stringify(data) });
};

export const deleteBook = (id) => request(`/books/${id}`, { method: 'DELETE' });

// ---- Notes ----
export const fetchNotes = (bookId) => request(`/books/${bookId}/notes`);
export const createNote = (bookId, data) => request(`/books/${bookId}/notes`, { method: 'POST', body: JSON.stringify(data) });
export const updateNote = (id, data) => request(`/notes/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteNote = (id) => request(`/notes/${id}`, { method: 'DELETE' });

// ---- AI ----
export const summarizeBook = (id) => request(`/books/${id}/summarize`, { method: 'POST' });
export const getRecommendations = () => request('/books/recommendations');

// ---- AI Search (DeepSeek) ----
export const searchBooks = (q) => request(`/ai-search?q=${encodeURIComponent(q)}`);

// ---- File download URL helper ----
// file_url from backend is like "/api/books/file/filename.epub"
// In dev (proxy), relative path works. In production, we need full Railway URL.
export const getFileUrl = (filePath) => {
  if (!filePath) return null;
  if (filePath.startsWith('http')) return filePath;
  return API_ORIGIN ? API_ORIGIN + filePath : filePath;
};
