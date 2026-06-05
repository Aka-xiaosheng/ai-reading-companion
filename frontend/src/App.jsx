import { useState, useEffect, useCallback } from 'react';
import BookList from './components/BookList';
import * as api from './api';

function App() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadBooks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.fetchBooks();
      setBooks(data);
    } catch {
      setError('无法连接到后端，请确保后端已启动 (localhost:3001)');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadBooks(); }, [loadBooks]);

  const handleAdd = async (data, file) => {
    await api.createBook(data, file);
    await loadBooks();
  };

  const handleUpdate = async (id, data, file) => {
    await api.updateBook(id, data, file);
    await loadBooks();
  };

  const handleDelete = async (id) => {
    await api.deleteBook(id);
    await loadBooks();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <span className="text-2xl">📚</span>
          <h1 className="text-xl font-semibold text-slate-800">AI Reading Companion</h1>
          <span className="text-sm text-slate-400 ml-auto">{books.length} 本书</span>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-24 text-slate-400">加载中...</div>
        ) : error ? (
          <div className="text-center py-24">
            <p className="text-red-500 mb-4">{error}</p>
            <button onClick={loadBooks} className="text-sm text-blue-500 hover:underline">重试</button>
          </div>
        ) : (
          <BookList
            books={books}
            onAdd={handleAdd}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        )}
      </main>
    </div>
  );
}

export default App;
