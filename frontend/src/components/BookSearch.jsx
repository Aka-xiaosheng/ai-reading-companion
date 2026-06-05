import { useState } from 'react';
import * as api from '../api';

/**
 * BookSearch — DeepSeek 联网找书弹窗
 * 展示在 Overlay 中，包含搜索框 + 结果卡片 + 加入书架按钮
 */
export default function BookSearch({ onClose, onAdd }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);   // null = 未搜索, [] = 无结果
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [addingId, setAddingId] = useState(null); // 正在加入书架的书籍 index

  const handleSearch = async (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const data = await api.searchBooks(q);
      setResults(data.books || []);
      if ((data.books || []).length === 0 && data.message) {
        setError(data.message);
      }
    } catch (err) {
      setError(err.message || '搜索失败，请检查 DeepSeek API Key 是否已配置');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (book, index) => {
    setAddingId(index);
    try {
      await onAdd({
        title: book.title,
        author: book.author,
        cover_url: book.cover_url || null,
        status: 'want_to_read',
      });
      // 标记为已添加
      setResults(prev =>
        prev.map((b, i) => (i === index ? { ...b, _added: true } : b))
      );
    } catch (err) {
      alert(`添加失败：${err.message}`);
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">🔍 联网找书</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">
            &times;
          </button>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="px-6 py-4 flex gap-3">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="输入书名，DeepSeek 联网搜索..."
            className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            autoFocus
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors shrink-0"
          >
            {loading ? '搜索中...' : '搜索'}
          </button>
        </form>
        <p className="px-6 text-xs text-slate-400 -mt-2 mb-2">
          由 DeepSeek 联网搜索提供结果，支持实体书和网络文学
        </p>

        {/* Results area */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {/* Loading */}
          {loading && (
            <div className="py-12 text-center">
              <p className="text-slate-400">🤖 DeepSeek 正在联网搜索...</p>
              <p className="text-xs text-slate-300 mt-1">这可能需要几秒钟</p>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="py-8 text-center">
              <p className="text-red-500 mb-2">{error}</p>
              <p className="text-xs text-slate-400">请确保 .env 中已正确配置 DEEPSEEK_API_KEY</p>
            </div>
          )}

          {/* Empty (searched but no results) */}
          {results !== null && results.length === 0 && !error && !loading && (
            <div className="py-12 text-center text-slate-400">
              <p className="text-4xl mb-3">📭</p>
              <p>未找到相关书籍，换个关键词试试</p>
            </div>
          )}

          {/* Results list */}
          {results && results.length > 0 && (
            <>
              <p className="text-sm text-slate-500 mb-3">共找到 {results.length} 条结果</p>
              <div className="space-y-3">
                {results.map((book, i) => (
                  <div
                    key={i}
                    className="flex gap-4 bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-colors"
                  >
                    {/* Cover placeholder */}
                    <div className="w-12 h-16 rounded bg-white border border-slate-200 flex items-center justify-center text-2xl shrink-0">
                      {book.cover_url ? (
                        <img
                          src={book.cover_url}
                          alt={book.title}
                          className="w-full h-full object-cover rounded"
                          onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = ''; }}
                        />
                      ) : null}
                      <span style={{ display: book.cover_url ? 'none' : '' }}>📖</span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800 truncate">{book.title}</h3>
                      <p className="text-sm text-slate-500">{book.author}</p>
                      {book.description && (
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                          {book.description}
                        </p>
                      )}
                      {book.source && (
                        <span className="inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                          {book.source}
                        </span>
                      )}
                    </div>

                    {/* Add button */}
                    <button
                      onClick={() => handleAdd(book, i)}
                      disabled={addingId === i || book._added}
                      className={`shrink-0 self-center px-4 py-2 text-xs font-medium rounded-xl transition-colors ${
                        book._added
                          ? 'bg-green-100 text-green-600 cursor-default'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50'
                      }`}
                    >
                      {book._added ? '✅ 已添加' : addingId === i ? '添加中...' : '📚 加入书架'}
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 text-center mt-4">
                数据来源：DeepSeek 联网搜索
              </p>
            </>
          )}

          {/* Initial hint */}
          {results === null && !loading && !error && (
            <div className="py-12 text-center text-slate-400">
              <p className="text-4xl mb-3">🔍</p>
              <p>输入书名，让 DeepSeek 帮你全网搜索</p>
              <p className="text-xs text-slate-300 mt-1">支持实体书、网络文学、外文图书</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
