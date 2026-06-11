import { useState, useEffect, useCallback } from 'react';
import BookList from './components/BookList';
import Login from './components/Login';
import * as api from './api';

function App() {
  const [user, setUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  // Check existing auth on mount
  useEffect(() => {
    (async () => {
      if (api.isLoggedIn()) {
        try {
          const me = await api.getMe();
          setUser(me);
        } catch {
          // Token expired or invalid
          api.setToken(null);
        }
      }
      setAuthChecking(false);
    })();
  }, []);

  const loadBooks = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);
      const data = await api.fetchBooks();
      setBooks(data);
    } catch (err) {
      if (err.message && err.message.includes('未登录')) {
        // Token expired — force logout
        api.setToken(null);
        setUser(null);
        return;
      }
      setError('无法连接到后端，请确保后端已启动 (localhost:3005)');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadBooks(true);
    }
  }, [user, loadBooks]);

  // Scroll-aware glassmorphism
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    api.setToken(null);
    setUser(null);
    setBooks([]);
    setError(null);
  };

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

  // Auth checking screen
  if (authChecking) {
    return (
      <div className="min-h-screen-safe bg-[#FBF7F0] flex items-center justify-center">
        <div className="animate-pulse text-3xl">📖</div>
      </div>
    );
  }

  // Not logged in — show login
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // Logged in — show main app
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
          <span className="text-xs sm:text-sm text-[#9B9B9B] font-light">
            {books.length} 本
          </span>

          {/* User menu */}
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <span className="text-xs text-[#9B9B9B] hidden sm:inline font-light">
              {user.username}
            </span>
            <button
              onClick={handleLogout}
              className="text-xs text-[#9B9B9B] hover:text-red-400 transition-colors px-2 py-1 rounded-md hover:bg-red-50"
              title="退出登录"
            >
              退出
            </button>
          </div>
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
