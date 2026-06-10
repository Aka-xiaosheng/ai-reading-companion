const API_BASE = '/api';

async function request(url, options = {}) {
  const { isFormData, ...fetchOptions } = options;

  const headers = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${url}`, {
    headers,
    ...fetchOptions,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Request failed');
  return json.data;
}

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
export const getFileUrl = (filePath) => filePath ? filePath : null;

