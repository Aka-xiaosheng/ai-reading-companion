import { useState, useEffect } from 'react';
import * as api from '../api';
import BookSearch from './BookSearch';
import EmptyIllustration from './EmptyIllustration';
import EpubReader from './EpubReader';

const STATUS = {
  want_to_read:  { label: '想读',   color: 'bg-accent-50 text-accent-600' },
  reading:       { label: '在读',   color: 'bg-amber-50 text-amber-700' },
  finished:      { label: '已读',   color: 'bg-emerald-50 text-emerald-700' },
};

const FILTERS = [
  { key: '',       label: '全部' },
  { key: 'reading',       label: '在读' },
  { key: 'want_to_read',  label: '想读' },
  { key: 'finished',      label: '已读' },
];

function BookCard({ book, onEdit, onDelete, onViewDetail, onOpenReader }) {
  const pct = book.total_pages ? Math.round((book.current_page / book.total_pages) * 100) : 0;
  const st = STATUS[book.status] || STATUS.want_to_read;

  return (
    <div className="bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-shadow duration-300 flex flex-col gap-4 p-6 group">
      {/* Cover + Title */}
      <div className="flex items-start gap-4">
        <div className="w-14 h-18 rounded-xl bg-[#F7F3EC] flex items-center justify-center text-2xl shrink-0 overflow-hidden transition-transform duration-300 group-hover:scale-[1.02] group-hover:-translate-y-1">
          {book.cover_url ? (
            <img
              src={book.cover_url}
              alt={book.title}
              className="w-full h-full object-cover"
              onError={e => { e.target.style.display = 'none'; }}
            />
          ) : (
            <span className="text-2xl select-none">📖</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-serif font-semibold text-[#1A1A1A] truncate text-base">
            {book.title}
            {book.file_path && (
              <span className="ml-1.5 text-xs text-amber-500 font-sans" title={book.file_type === 'pdf' ? 'PDF 文件' : 'EPUB 文件'}>
                {book.file_type === 'pdf' ? 'PDF' : 'EPUB'}
              </span>
            )}
          </h3>
          <p className="text-sm text-[#6B6B6B] mt-0.5">{book.author}</p>
        </div>
      </div>

      {/* Progress bar */}
      {book.total_pages > 0 && (
        <div>
          <div className="flex justify-between text-xs text-[#9B9B9B] mb-1.5">
            <span>阅读进度</span>
            <span>{book.current_page} / {book.total_pages} 页 ({pct}%)</span>
          </div>
          <div className="w-full h-2 bg-[#F0EBE3] rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#F0EBE3]">
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${st.color}`}>
          {st.label}
        </span>
        <div className="flex gap-1">
          {book.file_type === 'epub' && (
            <button
              onClick={() => onOpenReader(book)}
              className="text-xs sm:text-xs px-2.5 sm:px-3 py-1.5 rounded-xl text-white bg-accent-500 hover:bg-accent-600 transition-colors touch-target"
            >
              阅读
            </button>
          )}
          <button
            onClick={() => onViewDetail(book)}
            className="text-xs sm:text-xs px-2.5 sm:px-3 py-1.5 rounded-xl text-accent-600 hover:bg-accent-50 transition-colors touch-target"
          >
            详情
          </button>
          <button
            onClick={() => onEdit(book)}
            className="text-xs sm:text-xs px-2.5 sm:px-3 py-1.5 rounded-xl text-[#6B6B6B] hover:bg-[#F7F3EC] transition-colors touch-target"
          >
            编辑
          </button>
          <button
            onClick={() => { if (window.confirm(`删除《${book.title}》？`)) onDelete(book.id); }}
            className="text-xs sm:text-xs px-2 py-1.5 rounded-xl text-[#B8B8B8] hover:bg-red-50 hover:text-red-400 transition-colors touch-target"
          >
            删除
          </button>
        </div>
      </div>
    </div>
  );
}

function BookDetailModal({ bookId, onClose, onOpenReader }) {
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
        <div className="p-8 text-center text-[#9B9B9B]">
          <div className="animate-pulse text-2xl mb-2">📖</div>
          <p className="text-sm font-light">加载中...</p>
        </div>
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
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-xl font-serif font-semibold text-[#1A1A1A]">{book.title}</h2>
          <p className="text-sm text-[#6B6B6B] mt-0.5">{book.author}</p>
        </div>
        <button onClick={onClose} className="text-[#B8B8B8] hover:text-[#1A1A1A] text-xl leading-none transition-colors">&times;</button>
      </div>

      {/* Book meta */}
      <div className="flex flex-wrap gap-3 mb-5 text-sm items-center">
        <span className={`px-2.5 py-1 rounded-full font-medium text-xs ${st.color}`}>{st.label}</span>
        {book.total_pages > 0 && (
          <span className="text-[#6B6B6B]">{book.current_page} / {book.total_pages} 页 ({pct}%)</span>
        )}
        <span className="text-[#9B9B9B]">{notes.length} 条笔记</span>

        {book.file_path && (
          <div className="ml-auto flex items-center gap-1.5">
            {book.file_type === 'epub' && (
              <button
                onClick={() => onOpenReader(book)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium bg-accent-500 text-white hover:bg-accent-600 transition-colors"
              >
                📖 开始阅读
              </button>
            )}
            <a
              href={book.file_url}
              download={`${book.title}.${book.file_type}`}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium bg-[#F7F3EC] text-[#4A4A4A] border border-[#E8E2D5] hover:bg-[#F0EBE3] transition-colors"
            >
              下载
            </a>
          </div>
        )}
      </div>

      {/* Summary section */}
      <div className="mb-6 p-5 bg-accent-50 rounded-2xl">
        {summary ? (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-serif font-semibold text-accent-700">AI 摘要</span>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="text-xs px-2.5 py-1 rounded-full bg-accent-200 text-accent-700 hover:bg-accent-300 disabled:opacity-50 transition-colors"
              >
                {generating ? '生成中...' : '重新生成'}
              </button>
            </div>
            {summary.key_points && (
              <div className="text-sm text-accent-800 mb-3 whitespace-pre-wrap leading-relaxed">
                {summary.key_points}
              </div>
            )}
            <p className="text-sm text-accent-900 whitespace-pre-wrap leading-relaxed border-t border-accent-200 pt-3 mt-2">
              {summary.content}
            </p>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-accent-600 mb-3 font-light">暂无 AI 摘要</p>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-5 py-2.5 text-sm bg-accent-600 text-white rounded-2xl hover:bg-accent-700 disabled:opacity-50 transition-colors"
            >
              {generating ? 'AI 正在分析笔记...' : '生成 AI 摘要'}
            </button>
            {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
          </div>
        )}
      </div>

      {/* Notes list */}
      <h3 className="text-sm font-serif font-semibold text-[#4A4A4A] mb-3">读书笔记 ({notes.length})</h3>
      {notes.length === 0 ? (
        <div className="text-center py-8">
          <EmptyIllustration type="notes" size={100} className="mb-4" />
          <p className="text-sm text-[#9B9B9B] font-light">暂无笔记，添加笔记后 AI 可以生成更准确的摘要</p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-60 overflow-y-auto">
          {notes.map(note => (
            <div key={note.id} className="bg-[#F7F3EC] border border-[#F0EBE3] rounded-xl p-4">
              <p className="text-sm text-[#1A1A1A] whitespace-pre-wrap leading-relaxed">{note.content}</p>
              <p className="text-xs text-[#B8B8B8] mt-2">{new Date(note.created_at).toLocaleString('zh-CN')}</p>
            </div>
          ))}
        </div>
      )}
    </Overlay>
  );
}

function Overlay({ children, onClose, wide }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#1A1A1A]/15 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`bg-white shadow-card-hover p-4 sm:p-6 max-h-[90vh] overflow-y-auto w-full
          sm:rounded-2xl sm:m-4 sm:max-w-md
          rounded-t-2xl animate-slide-up
          ${wide ? 'sm:max-w-lg' : 'sm:max-w-md'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle visible on mobile */}
        <div className="sm:hidden flex justify-center mb-3">
          <div className="w-10 h-1 rounded-full bg-[#D4CDC0]" />
        </div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A1A]/15 backdrop-blur-sm" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-card-hover p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-serif font-semibold text-[#1A1A1A] mb-5">
          {isEdit ? '编辑书籍' : '添加新书'}
        </h2>

        {!isEdit && (
          <>
            <Field label="书名" name="title" value={form.title} onChange={handleChange} placeholder="例如：三体" required />
            <Field label="作者" name="author" value={form.author} onChange={handleChange} placeholder="例如：刘慈欣" required />
            <Field label="封面 URL" name="cover_url" value={form.cover_url} onChange={handleChange} placeholder="可选" />
            <Field label="总页数" name="total_pages" type="number" value={form.total_pages} onChange={handleChange} placeholder="例如：400" />

            {/* File upload */}
            <label className="block mb-5">
              <span className="text-sm font-medium text-[#4A4A4A]">电子书文件 <span className="text-[#9B9B9B] font-normal">(可选)</span></span>
              <div className="mt-1.5">
                <label className="flex items-center gap-2 px-4 py-3 border border-dashed border-[#D4CDC0] rounded-2xl cursor-pointer hover:border-accent-300 hover:bg-accent-50/50 transition-colors">
                  <span className="text-lg">📎</span>
                  <span className="text-sm text-[#6B6B6B] truncate flex-1">
                    {file ? file.name : '点击选择 EPUB 或 PDF 文件'}
                  </span>
                  {file && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                      className="text-xs text-red-400 hover:text-red-500"
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
              <p className="text-xs text-[#B8B8B8] mt-1.5">支持 EPUB、PDF 格式，最大 50MB</p>
            </label>
          </>
        )}

        {isEdit && (
          <>
            <p className="text-[#1A1A1A] font-medium mb-5 text-sm">{book.title} · {book.author}</p>
            <Field label="当前页数" name="current_page" type="number" value={form.current_page} onChange={handleChange} />
            {form.total_pages > 0 && (
              <p className="text-xs text-[#9B9B9B] -mt-2 mb-4">
                共 {form.total_pages} 页 · {form.total_pages > 0 ? Math.round((form.current_page / form.total_pages) * 100) : 0}%
              </p>
            )}

            {/* File upload for edit — allow attaching EPUB/PDF to existing book */}
            <label className="block mb-5">
              <span className="text-sm font-medium text-[#4A4A4A]">
                电子书文件 {book.file_path && <span className="text-xs text-accent-600">(已上传，可替换)</span>}
              </span>
              <div className="mt-1.5">
                <label className="flex items-center gap-2 px-4 py-3 border border-dashed border-[#D4CDC0] rounded-2xl cursor-pointer hover:border-accent-300 hover:bg-accent-50/50 transition-colors">
                  <span className="text-lg">📎</span>
                  <span className="text-sm text-[#6B6B6B] truncate flex-1">
                    {file ? file.name : book.file_path ? `已上传: ${book.file_path.split('/').pop()}` : '点击选择 EPUB 或 PDF 文件'}
                  </span>
                  {file && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                      className="text-xs text-red-400 hover:text-red-500"
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
              <p className="text-xs text-[#B8B8B8] mt-1.5">支持 EPUB、PDF 格式，最大 50MB</p>
            </label>
          </>
        )}

        <label className="block text-sm font-medium text-[#4A4A4A] mb-1.5">状态</label>
        <select
          name="status"
          value={form.status}
          onChange={handleChange}
          className="w-full border border-[#E8E2D5] rounded-xl px-3.5 py-2.5 text-sm mb-5 bg-white focus:outline-none focus:ring-2 focus:ring-accent-200 focus:border-accent-300 transition-colors"
        >
          <option value="want_to_read">想读</option>
          <option value="reading">在读</option>
          <option value="finished">已读</option>
        </select>

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm text-[#6B6B6B] hover:bg-[#F7F3EC] rounded-xl transition-colors">取消</button>
          <button type="submit" disabled={saving} className="px-5 py-2.5 text-sm bg-accent-600 text-white rounded-xl hover:bg-accent-700 disabled:opacity-50 transition-colors">
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, name, type = 'text', value, onChange, placeholder, required }) {
  return (
    <label className="block mb-4">
      <span className="text-sm font-medium text-[#4A4A4A]">
        {label}
        {required && <span className="text-accent-500 ml-0.5">*</span>}
      </span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="mt-1.5 w-full border border-[#E8E2D5] rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent-200 focus:border-accent-300 transition-colors"
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
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-serif font-semibold text-[#1A1A1A]">智能推荐</h2>
        <button onClick={onClose} className="text-[#B8B8B8] hover:text-[#1A1A1A] text-xl leading-none transition-colors">&times;</button>
      </div>

      {loading && (
        <div className="py-12 text-center">
          <div className="animate-pulse text-2xl mb-3">🤖</div>
          <p className="text-[#9B9B9B] text-sm font-light">AI 正在分析你的阅读偏好...</p>
          <p className="text-xs text-[#B8B8B8] mt-1">基于你的阅读历史和笔记生成个性化推荐</p>
        </div>
      )}

      {error && (
        <div className="py-8 text-center">
          <p className="text-red-400 mb-3">{error}</p>
          <p className="text-xs text-[#9B9B9B]">请确保 .env 中已配置 OPENAI_API_KEY</p>
        </div>
      )}

      {recs && !loading && (
        <>
          {recs.message && <p className="text-sm text-[#6B6B6B] mb-5">{recs.message}</p>}
          {recs.recommendations && recs.recommendations.length > 0 ? (
            <div className="space-y-3">
              {recs.recommendations.map((r, i) => (
                <div key={i} className="flex items-start gap-4 bg-[#F7F3EC] rounded-2xl p-5">
                  <div className="w-10 h-10 rounded-xl bg-accent-100 flex items-center justify-center text-lg shrink-0">
                    📚
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif font-semibold text-[#1A1A1A]">{r.title}</h3>
                    <p className="text-sm text-[#6B6B6B]">{r.author}</p>
                    <p className="text-xs text-[#4A4A4A] mt-1.5 leading-relaxed">{r.reason}</p>
                  </div>
                  <button
                    onClick={async () => {
                      await onAdd({ title: r.title, author: r.author, status: 'want_to_read' });
                    }}
                    className="shrink-0 px-4 py-2 text-xs bg-accent-600 text-white rounded-xl hover:bg-accent-700 transition-colors"
                  >
                    加入书架
                  </button>
                </div>
              ))}
              {recs.based_on && (
                <p className="text-xs text-[#B8B8B8] text-center mt-4">
                  基于你书架上的 {recs.based_on} 本书生成
                </p>
              )}
            </div>
          ) : (
            <div className="py-10 text-center">
              <EmptyIllustration type="bookshelf" size={100} className="mb-4" />
              <p className="text-sm text-[#9B9B9B] font-light">暂无推荐，请先添加一些在读或已读完的书籍</p>
            </div>
          )}
        </>
      )}
    </Overlay>
  );
}

export default function BookList({ books, onAdd, onUpdate, onDelete, onRefresh }) {
  const [filter, setFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [showRecs, setShowRecs] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [readerBook, setReaderBook] = useState(null);
  const filtered = filter ? books.filter(b => b.status === filter) : books;

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8">
        {/* Filter — scrollable row on mobile */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 px-3.5 sm:px-4 py-2 rounded-full text-sm font-medium transition-colors touch-target ${
                filter === f.key
                  ? 'bg-accent-600 text-white shadow-sm'
                  : 'bg-white text-[#6B6B6B] border border-[#E8E2D5] hover:bg-[#F7F3EC]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAdd(true)}
            className="flex-1 sm:flex-none px-4 sm:px-5 py-2.5 bg-accent-600 text-white text-sm font-medium rounded-2xl hover:bg-accent-700 transition-colors shadow-sm touch-target"
          >
            <span className="sm:hidden">+ 添加</span>
            <span className="hidden sm:inline">添加书籍</span>
          </button>
          <button
            onClick={() => setShowRecs(true)}
            className="flex-1 sm:flex-none px-4 sm:px-5 py-2.5 bg-accent-500 text-white text-sm font-medium rounded-2xl hover:bg-accent-600 transition-colors shadow-sm touch-target"
          >
            <span className="sm:hidden">🤖 推荐</span>
            <span className="hidden sm:inline">智能推荐</span>
          </button>
          <button
            onClick={() => setShowSearch(true)}
            className="flex-1 sm:flex-none px-4 sm:px-5 py-2.5 bg-[#4A7C6B] text-white text-sm font-medium rounded-2xl hover:bg-accent-600 transition-colors shadow-sm touch-target"
          >
            <span className="sm:hidden">🔍 找书</span>
            <span className="hidden sm:inline">联网找书</span>
          </button>
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-16 sm:py-20">
          <EmptyIllustration type="bookshelf" size={120} className="mb-4 sm:mb-6" />
          <p className="text-[#9B9B9B] font-light text-sm sm:text-base">
            {filter ? '该分类下暂无书籍' : '书架空空，添加你的第一本书吧'}
          </p>
        </div>
      )}

      {/* Book grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
        {filtered.map(book => (
          <BookCard
            key={book.id}
            book={book}
            onEdit={setEditing}
            onDelete={onDelete}
            onViewDetail={(b) => setDetailId(b.id)}
            onOpenReader={setReaderBook}
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
          onOpenReader={(book) => {
            setDetailId(null);
            setReaderBook(book);
          }}
        />
      )}

      {/* EPUB Reader */}
      {readerBook && (
        <EpubReader
          book={readerBook}
          onClose={() => setReaderBook(null)}
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
