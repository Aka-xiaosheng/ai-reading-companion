import { useState, useEffect } from 'react';
import * as api from '../api';
import BookSearch from './BookSearch';

const STATUS = {
  want_to_read:  { label: '想读',   color: 'bg-blue-100 text-blue-700' },
  reading:       { label: '在读',   color: 'bg-amber-100 text-amber-700' },
  finished:      { label: '已读',   color: 'bg-green-100 text-green-700' },
};

const FILTERS = [
  { key: '',       label: '全部' },
  { key: 'reading',       label: '📖 在读' },
  { key: 'want_to_read',  label: '📋 想读' },
  { key: 'finished',      label: '✅ 已读' },
];

function BookCard({ book, onEdit, onDelete, onViewDetail }) {
  const pct = book.total_pages ? Math.round((book.current_page / book.total_pages) * 100) : 0;
  const st = STATUS[book.status] || STATUS.want_to_read;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="w-12 h-16 rounded bg-slate-100 flex items-center justify-center text-2xl shrink-0">
          📖
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-slate-800 truncate">
            {book.title}
            {book.file_path && (
              <span className="ml-1.5 text-xs text-amber-500" title={book.file_type === 'pdf' ? 'PDF 文件' : 'EPUB 文件'}>
                {book.file_type === 'pdf' ? '📄' : '📘'}
              </span>
            )}
          </h3>
          <p className="text-sm text-slate-500">{book.author}</p>
        </div>
      </div>

      {book.total_pages && (
        <div>
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>进度</span>
            <span>{book.current_page} / {book.total_pages} 页 ({pct}%)</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-50">
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${st.color}`}>
          {st.label}
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => onViewDetail(book)}
            className="text-xs px-3 py-1 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            详情
          </button>
          <button
            onClick={() => onEdit(book)}
            className="text-xs px-3 py-1 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          >
            编辑
          </button>
          <button
            onClick={() => { if (window.confirm(`删除《${book.title}》？`)) onDelete(book.id); }}
            className="text-xs px-2 py-1 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            删除
          </button>
        </div>
      </div>
    </div>
  );
}

function BookDetailModal({ bookId, onClose }) {
  const [book, setBook] = useState(null);
  const [notes, setNotes] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [bookData, notesData] = await Promise.all([
          api.fetchBook(bookId),
          api.fetchNotes(bookId),
        ]);
        setBook(bookData);
        setNotes(notesData);
        setSummary(bookData.summary);
      } catch {
        setError('加载失败');
      } finally {
        setLoading(false);
      }
    })();
  }, [bookId]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    try {
      const result = await api.summarizeBook(bookId);
      setSummary({ content: result.summary, key_points: result.key_points });
    } catch (err) {
      setError(err.message || '生成摘要失败');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <Overlay onClose={onClose}>
        <div className="p-8 text-center text-slate-400">加载中...</div>
      </Overlay>
    );
  }

  if (!book) {
    return (
      <Overlay onClose={onClose}>
        <div className="p-8 text-center text-red-400">{error || '未找到书籍'}</div>
      </Overlay>
    );
  }

  const pct = book.total_pages ? Math.round((book.current_page / book.total_pages) * 100) : 0;
  const st = STATUS[book.status] || STATUS.want_to_read;

  return (
    <Overlay onClose={onClose} wide>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">{book.title}</h2>
          <p className="text-sm text-slate-500">{book.author}</p>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
      </div>

      {/* Book meta */}
      <div className="flex flex-wrap gap-3 mb-4 text-sm items-center">
        <span className={`px-2.5 py-1 rounded-full font-medium text-xs ${st.color}`}>{st.label}</span>
        {book.total_pages && (
          <span className="text-slate-500">{book.current_page} / {book.total_pages} 页 ({pct}%)</span>
        )}
        <span className="text-slate-400">{notes.length} 条笔记</span>

        {/* Local file button */}
        {book.file_path && (
          <a
            href={book.file_url}
            target={book.file_type === 'pdf' ? '_blank' : undefined}
            rel="noreferrer"
            download={book.file_type === 'epub' ? `${book.title}.epub` : undefined}
            className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
          >
            {book.file_type === 'pdf' ? '📖 阅读' : '📥 下载'}
          </a>
        )}
      </div>

      {/* Summary section */}
      <div className="mb-6 p-4 bg-indigo-50 rounded-xl">
        {summary ? (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold text-indigo-700">🤖 AI 摘要</span>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="text-xs px-2 py-0.5 rounded-full bg-indigo-200 text-indigo-700 hover:bg-indigo-300 disabled:opacity-50"
              >
                {generating ? '生成中...' : '重新生成'}
              </button>
            </div>
            {summary.key_points && (
              <div className="text-sm text-indigo-800 mb-2 whitespace-pre-wrap leading-relaxed">
                {summary.key_points}
              </div>
            )}
            <p className="text-sm text-indigo-900 whitespace-pre-wrap leading-relaxed border-t border-indigo-200 pt-2 mt-2">
              {summary.content}
            </p>
          </div>
        ) : (
          <div className="text-center py-3">
            <p className="text-sm text-indigo-600 mb-3">暂无 AI 摘要</p>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {generating ? '🤖 AI 正在分析笔记...' : '🤖 生成 AI 摘要'}
            </button>
            {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
          </div>
        )}
      </div>

      {/* Notes list */}
      <h3 className="text-sm font-semibold text-slate-600 mb-2">📝 读书笔记 ({notes.length})</h3>
      {notes.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-4">暂无笔记。添加笔记后，AI 可以生成更准确的摘要。</p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {notes.map(note => (
            <div key={note.id} className="bg-white border border-slate-100 rounded-lg p-3">
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{note.content}</p>
              <p className="text-xs text-slate-400 mt-1">{new Date(note.created_at).toLocaleString('zh-CN')}</p>
            </div>
          ))}
        </div>
      )}
    </Overlay>
  );
}

function Overlay({ children, onClose, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className={`bg-white rounded-2xl shadow-xl p-6 mx-4 max-h-[90vh] overflow-y-auto ${wide ? 'w-full max-w-lg' : 'w-full max-w-md'}`}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function BookModal({ book, onSave, onClose }) {
  const isEdit = !!book;
  const [form, setForm] = useState({
    title: book?.title || '',
    author: book?.author || '',
    cover_url: book?.cover_url || '',
    total_pages: book?.total_pages || '',
    current_page: book?.current_page || 0,
    status: book?.status || 'want_to_read',
  });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) setFile(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      total_pages: form.total_pages ? Number(form.total_pages) : null,
      current_page: Number(form.current_page),
    };
    if (!isEdit) {
      if (!payload.title.trim() || !payload.author.trim()) {
        alert('书名和作者为必填项');
        setSaving(false);
        return;
      }
    }
    await onSave(isEdit ? book.id : null, payload, file);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          {isEdit ? '编辑书籍' : '添加新书'}
        </h2>

        {!isEdit && (
          <>
            <Field label="书名 *" name="title" value={form.title} onChange={handleChange} placeholder="例如：三体" />
            <Field label="作者 *" name="author" value={form.author} onChange={handleChange} placeholder="例如：刘慈欣" />
            <Field label="封面 URL" name="cover_url" value={form.cover_url} onChange={handleChange} placeholder="可选" />
            <Field label="总页数" name="total_pages" type="number" value={form.total_pages} onChange={handleChange} placeholder="例如：400" />

            {/* File upload */}
            <label className="block mb-4">
              <span className="text-sm font-medium text-slate-600">电子书文件 <span className="text-slate-400 font-normal">(可选)</span></span>
              <div className="mt-1">
                <label className="flex items-center gap-2 px-3 py-2.5 border border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors">
                  <span className="text-lg">📎</span>
                  <span className="text-sm text-slate-500 truncate flex-1">
                    {file ? file.name : '点击选择 EPUB 或 PDF 文件'}
                  </span>
                  {file && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                      className="text-xs text-red-400 hover:text-red-600"
                    >
                      ✕
                    </button>
                  )}
                  <input
                    type="file"
                    accept=".epub,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-xs text-slate-400 mt-1">支持 EPUB、PDF 格式，最大 50MB</p>
            </label>
          </>
        )}

        {isEdit && (
          <>
            <p className="text-slate-700 font-medium mb-4">{book.title} · {book.author}</p>
            <Field label="当前页数" name="current_page" type="number" value={form.current_page} onChange={handleChange} />
            {form.total_pages && (
              <p className="text-xs text-slate-400 -mt-2 mb-3">
                共 {form.total_pages} 页 · {form.total_pages > 0 ? Math.round((form.current_page / form.total_pages) * 100) : 0}%
              </p>
            )}
          </>
        )}

        <label className="block text-sm font-medium text-slate-600 mb-1">状态</label>
        <select
          name="status"
          value={form.status}
          onChange={handleChange}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          <option value="want_to_read">📋 想读</option>
          <option value="reading">📖 在读</option>
          <option value="finished">✅ 已读</option>
        </select>

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-50 rounded-lg">取消</button>
          <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, name, type = 'text', value, onChange, placeholder }) {
  return (
    <label className="block mb-3">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
      />
    </label>
  );
}

function RecommendationsModal({ onClose, onAdd }) {
  const [recs, setRecs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getRecommendations();
        setRecs(data);
      } catch (err) {
        setError(err.message || '获取推荐失败');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Overlay onClose={onClose} wide>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-800">🎯 智能推荐</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
      </div>

      {loading && (
        <div className="py-12 text-center">
          <p className="text-slate-400 mb-2">🤖 AI 正在分析你的阅读偏好...</p>
          <p className="text-xs text-slate-300">基于你的阅读历史和笔记生成个性化推荐</p>
        </div>
      )}

      {error && (
        <div className="py-8 text-center">
          <p className="text-red-500 mb-3">{error}</p>
          <p className="text-xs text-slate-400">请确保 .env 中已配置 OPENAI_API_KEY</p>
        </div>
      )}

      {recs && !loading && (
        <>
          {recs.message && <p className="text-sm text-slate-500 mb-4">{recs.message}</p>}
          {recs.recommendations && recs.recommendations.length > 0 ? (
            <div className="space-y-3">
              {recs.recommendations.map((r, i) => (
                <div key={i} className="flex items-start gap-4 bg-slate-50 rounded-xl p-4">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-lg shrink-0">
                    📚
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-800">{r.title}</h3>
                    <p className="text-sm text-slate-500">{r.author}</p>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{r.reason}</p>
                  </div>
                  <button
                    onClick={async () => {
                      await onAdd({ title: r.title, author: r.author, status: 'want_to_read' });
                    }}
                    className="shrink-0 px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    📚 加入书架
                  </button>
                </div>
              ))}
              {recs.based_on && (
                <p className="text-xs text-slate-400 text-center mt-3">
                  基于你书架上的 {recs.based_on} 本书生成
                </p>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400">
              <p>暂无推荐。请先添加一些在读或已读完的书籍。</p>
            </div>
          )}
        </>
      )}
    </Overlay>
  );
}

export default function BookList({ books, onAdd, onUpdate, onDelete }) {
  const [filter, setFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [showRecs, setShowRecs] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const filtered = filter ? books.filter(b => b.status === filter) : books;

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === f.key
                  ? 'bg-slate-800 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-xl hover:bg-slate-700 transition-colors"
        >
          + 添加书籍
        </button>
        <button
          onClick={() => setShowRecs(true)}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-500 transition-colors"
        >
          🎯 智能推荐
        </button>
        <button
          onClick={() => setShowSearch(true)}
          className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-500 transition-colors"
        >
          🔍 联网找书
        </button>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-20 text-slate-400">
          <p className="text-4xl mb-3">📚</p>
          <p>{filter ? '该分类下暂无书籍' : '书架空空，添加你的第一本书吧'}</p>
        </div>
      )}

      {/* Book grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(book => (
          <BookCard
            key={book.id}
            book={book}
            onEdit={setEditing}
            onDelete={onDelete}
            onViewDetail={(b) => setDetailId(b.id)}
          />
        ))}
      </div>

      {/* Add modal */}
      {showAdd && (
        <BookModal
          book={null}
          onSave={async (_id, data, file) => { await onAdd(data, file); }}
          onClose={() => setShowAdd(false)}
        />
      )}

      {/* Edit modal */}
      {editing && (
        <BookModal
          book={editing}
          onSave={async (id, data, file) => { await onUpdate(id, data, file); }}
          onClose={() => setEditing(null)}
        />
      )}

      {/* Detail modal */}
      {detailId && (
        <BookDetailModal
          bookId={detailId}
          onClose={() => setDetailId(null)}
        />
      )}

      {/* Recommendations modal */}
      {showRecs && (
        <RecommendationsModal
          onClose={() => setShowRecs(false)}
          onAdd={onAdd}
        />
      )}

      {/* Book Search modal */}
      {showSearch && (
        <BookSearch
          onClose={() => setShowSearch(false)}
          onAdd={onAdd}
        />
      )}
    </div>
  );
}
