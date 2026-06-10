import { useState } from 'react';
import * as api from '../api';
import EmptyIllustration from './EmptyIllustration';

/**
 * BookSearch — DeepSeek 联网找书弹窗
 */
export default function BookSearch({ onClose, onAdd }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [addingId, setAddingId] = useState(null);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A1A]/15 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-card-hover w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0EBE3]">
          <h2 className="text-lg font-serif font-semibold text-[#1A1A1A]">联网找书</h2>
          <button onClick={onClose} className="text-[#B8B8B8] hover:text-[#1A1A1A] text-xl leading-none transition-colors">
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
            className="flex-1 border border-[#E8E2D5] rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent-200 transition-colors"
            autoFocus
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-5 py-2.5 bg-accent-600 text-white text-sm font-medium rounded-xl hover:bg-accent-700 disabled:opacity-50 transition-colors shrink-0"
          >
            {loading ? '搜索中...' : '搜索'}
          </button>
        </form>
        <p className="px-6 text-xs text-[#B8B8B8] -mt-2 mb-2">
          由 DeepSeek 联网搜索提供结果
        </p>

        {/* Results area */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {/* Loading */}
          {loading && (
            <div className="py-12 text-center">
              <div className="animate-pulse text-2xl mb-3">🤖</div>
              <p className="text-[#9B9B9B] text-sm font-light">DeepSeek 正在联网搜索...</p>
              <p className="text-xs text-[#B8B8B8] mt-1">这可能需要几秒钟</p>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="py-8 text-center">
              <p className="text-red-400 mb-2">{error}</p>
              <p className="text-xs text-[#9B9B9B]">请确保 .env 中已正确配置 DEEPSEEK_API_KEY</p>
            </div>
          )}

          {/* Empty (searched but no results) */}
          {results !== null && results.length === 0 && !error && !loading && (
            <div className="py-12 text-center">
              <EmptyIllustration type="search" size={100} className="mb-4" />
              <p className="text-sm text-[#9B9B9B] font-light">未找到相关书籍，换个关键词试试</p>
            </div>
          )}

          {/* Results list */}
          {results && results.length > 0 && (
            <>
              <p className="text-sm text-[#6B6B6B] mb-4">共找到 {results.length} 条结果</p>
              <div className="space-y-3">
                {results.map((book, i) => (
                  <div
                    key={i}
                    className="flex gap-4 bg-[#F7F3EC] rounded-2xl p-5 hover:bg-[#F0EBE3] transition-colors"
                  >
                    {/* Cover placeholder */}
                    <div className="w-12 h-16 rounded-lg bg-white border border-[#E8E2D5] flex items-center justify-center text-2xl shrink-0 overflow-hidden">
                      {book.cover_url ? (
                        <img
                          src={book.cover_url}
                          alt={book.title}
                          className="w-full h-full object-cover"
                          onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = ''; }}
                        />
                      ) : null}
                      <span style={{ display: book.cover_url ? 'none' : '' }}>📖</span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-serif font-semibold text-[#1A1A1A] truncate">{book.title}</h3>
                      <p className="text-sm text-[#6B6B6B]">{book.author}</p>
                      {book.description && (
                        <p className="text-xs text-[#4A4A4A] mt-1.5 line-clamp-2 leading-relaxed">
                          {book.description}
                        </p>
                      )}
                      {book.source && (
                        <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-[#E8EFEB] text-accent-600">
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
                          ? 'bg-accent-50 text-accent-600 cursor-default'
                          : 'bg-accent-600 text-white hover:bg-accent-700 disabled:opacity-50'
                      }`}
                    >
                      {book._added ? '已添加' : addingId === i ? '添加中...' : '加入书架'}
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-[#B8B8B8] text-center mt-5">
                数据来源：DeepSeek 联网搜索
              </p>
            </>
          )}

          {/* Initial hint */}
          {results === null && !loading && !error && (
            <div className="py-12 text-center">
              <EmptyIllustration type="search" size={100} className="mb-4" />
              <p className="text-sm text-[#9B9B9B] font-light">输入书名，让 DeepSeek 帮你全网搜索</p>
              <p className="text-xs text-[#B8B8B8] mt-1">支持实体书、网络文学、外文图书</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
