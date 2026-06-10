import { useState, useEffect, useCallback } from 'react';
import BookList from './components/BookList';
import * as api from './api';

function App() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  const loadBooks = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);
      const data = await api.fetchBooks();
      setBooks(data);
    } catch {
      setError('无法连接到后端，请确保后端已启动 (localhost:3001)');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadBooks(true); }, [loadBooks]);

  // Scroll-aware glassmorphism
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
    <div className="min-h-screen-safe bg-[#FBF7F0]">
      <header
        className={`sticky top-0 z-30 transition-all duration-300 ${
          scrolled
            ? 'bg-[#FBF7F0]/85 backdrop-blur-md shadow-sm border-b border-[#E8E2D5]'
            : 'bg-[#FBF7F0] border-b border-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-3 sm:py-4 flex items-center gap-2 sm:gap-3">
          <span className="text-lg sm:text-xl text-accent-500 select-none">◆</span>
          <h1 className="text-lg sm:text-xl font-serif font-semibold text-[#1A1A1A] tracking-wide">
            阅读花园
          </h1>
          <span className="text-xs sm:text-sm text-[#9B9B9B] ml-auto font-light">
            {books.length} 本
          </span>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-[#9B9B9B]">
            <div className="animate-pulse text-3xl mb-3">📖</div>
            <p className="text-sm font-light">正在整理书架...</p>
          </div>
        ) : error ? (
          <div className="text-center py-32">
            <p className="text-red-400 mb-4 font-light">{error}</p>
            <button
              onClick={() => loadBooks(true)}
              className="text-sm text-accent-600 hover:text-accent-700 underline underline-offset-4 transition-colors"
            >
              重试
            </button>
          </div>
        ) : (
          <BookList
            books={books}
            onAdd={handleAdd}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onRefresh={loadBooks}
          />
        )}
      </main>
    </div>
  );
}

export default App;
