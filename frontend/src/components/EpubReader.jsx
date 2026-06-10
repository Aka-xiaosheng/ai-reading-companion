import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Reader,
  ReaderContent,
  ReaderNext,
  ReaderPrevious,
  useBookNavigator,
  loadEPUB,
} from 'react-ebookjs';

const FONT_SIZES = [
  { label: '小', value: 14 },
  { label: '中', value: 16 },
  { label: '大', value: 20 },
  { label: '特大', value: 24 },
];

const FONT_SIZE_KEY = 'reader-font-size';

function getStored(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v !== null ? v : fallback;
  } catch {
    return fallback;
  }
}

function setStored(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

/**
 * Full-screen EPUB reader using react-ebookjs (foliate-js under the hood).
 *
 * Outer shell: loads the EPUB blob, manages night/font/toc state.
 * Inner shell: lives inside <Reader> context, uses useBookNavigator().
 */
export default function EpubReader({ book, onClose }) {
  const bookId = book.id;

  // ── EPUB loading state ──
  const [loaded, setLoaded] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Progress (0-1, persisted per-book) ──
  const [progress, setProgress] = useState(() => {
    const v = getStored(`reader-progress-${bookId}`, '0');
    return parseFloat(v) || 0;
  });

  // ── Night mode ──
  const [nightMode, setNightMode] = useState(false);

  // ── Font size (number, persisted globally) ──
  const [fontSize, setFontSizeState] = useState(() => {
    const v = getStored(FONT_SIZE_KEY, '16');
    return parseInt(v, 10) || 16;
  });

  const setFontSize = (v) => {
    setFontSizeState(v);
    setStored(FONT_SIZE_KEY, String(v));
  };

  // ── TOC drawer ──
  const [showToc, setShowToc] = useState(false);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (showToc) setShowToc(false);
        else onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showToc, onClose]);

  // ── Lock body scroll ──
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // ── Load EPUB file from backend URL ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        console.log('[EpubReader] fetching:', book.file_url);
        const res = await fetch(book.file_url);
        console.log('[EpubReader] fetch status:', res.status);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        console.log('[EpubReader] blob size:', blob.size, 'type:', blob.type);
        if (cancelled) return;
        const epubBook = await loadEPUB(blob);
        // Fix: normalize language tags (zh_CN → zh-CN) to avoid
        // Intl.getCanonicalLocales() RangeError inside react-ebookjs
        if (epubBook?.metadata?.language) {
          const lang = epubBook.metadata.language;
          if (Array.isArray(lang)) {
            epubBook.metadata.language = lang.map((l) =>
              typeof l === 'string' ? l.replace(/_/g, '-') : l,
            );
          } else if (typeof lang === 'string') {
            epubBook.metadata.language = lang.replace(/_/g, '-');
          }
        }
        console.log('[EpubReader] loaded book:', epubBook?.metadata?.title, 'toc:', epubBook?.toc?.length);
        if (cancelled) return;
        setLoaded(epubBook);
      } catch (err) {
        console.error('[EpubReader] load error:', err);
        if (!cancelled) setLoadError(err.message || '加载 EPUB 失败');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [book.file_url]);

  // ── Persist progress ──
  const handleProgressChange = useCallback(
    (p) => {
      setProgress(p);
      setStored(`reader-progress-${bookId}`, String(p));
    },
    [bookId],
  );

  // ── Loading / Error states ──
  if (loading || !loaded) {
    return (
      <div
        className={`fixed inset-0 z-[100] flex items-center justify-center ${
          nightMode ? 'bg-[#1A1A1A]' : 'bg-[#FBF7F0]'
        }`}
      >
        <div className="text-center">
          {loadError ? (
            <>
              <p className="text-red-400 mb-3 text-sm">{loadError}</p>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm bg-accent-600 text-white rounded-xl"
              >
                返回
              </button>
            </>
          ) : (
            <>
              <div className="animate-pulse text-3xl mb-3">📖</div>
              <p className="text-sm text-[#9B9B9B] font-light">
                正在加载书籍...
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col transition-colors duration-300 ${
        nightMode ? 'night bg-[#1A1A1A]' : 'bg-[#FBF7F0]'
      }`}
    >
      <Reader
        book={loaded}
        progress={progress}
        onProgressChange={handleProgressChange}
      >
        <ReaderInner
          book={book}
          loaded={loaded}
          nightMode={nightMode}
          setNightMode={setNightMode}
          fontSize={fontSize}
          setFontSize={setFontSize}
          showToc={showToc}
          setShowToc={setShowToc}
          onClose={onClose}
        />
      </Reader>
    </div>
  );
}

/**
 * Inner component — must be rendered inside <Reader> to access
 * useBookNavigator() context.
 */
function ReaderInner({
  book,
  loaded,
  nightMode,
  setNightMode,
  fontSize,
  setFontSize,
  showToc,
  setShowToc,
  onClose,
}) {
  const navigator = useBookNavigator();
  const containerRef = useRef(null);

  // ── Night-mode styles via foliate-paginator.setStyles() ──
  useEffect(() => {
    const el = containerRef.current?.querySelector?.('foliate-paginator');
    if (!el || !el.setStyles) return;

    if (nightMode) {
      el.setStyles({
        backgroundColor: '#1E1E1E',
        color: '#D4D4D4',
        fontFamily: "'LXGW WenKai', serif",
      });
    } else {
      el.setStyles({
        backgroundColor: '#FBF7F0',
        color: '#1A1A1A',
        fontFamily: "'LXGW WenKai', serif",
      });
    }
  }, [nightMode]);

  // ── TOC helpers ──
  const toc = loaded?.toc || [];

  const flattenToc = (items, depth = 0) => {
    if (!items || !Array.isArray(items)) return [];
    return items.flatMap((item) => {
      const current = { ...item, depth };
      if (item.subitems && item.subitems.length > 0) {
        return [current, ...flattenToc(item.subitems, depth + 1)];
      }
      return [current];
    });
  };

  const tocEntries = flattenToc(toc);

  const handleTocNavigate = (href) => {
    if (href) {
      navigator.goTo(href);
    }
    setShowToc(false);
  };

  // ── Restore progress on mount ──
  useEffect(() => {
    console.log('[ReaderInner] mounted, book sections:', loaded?.sections?.length, 'toc:', loaded?.toc?.length);
    const stored = parseFloat(
      getStored(`reader-progress-${book.id}`, '0'),
    );
    if (stored > 0) {
      navigator.goTo({ fraction: stored });
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Keyboard arrow keys for page turning ──
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigator.previous();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigator.next();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigator]);

  // ── Touch swipe gesture for page turning ──
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      const dy = e.changedTouches[0].clientY - touchStartY.current;
      const SWIPE_THRESHOLD = 60;

      // Only trigger if horizontal swipe dominates (avoid triggering on vertical scroll)
      if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (dx < 0) {
          navigator.next(); // swipe left → next page
        } else {
          navigator.previous(); // swipe right → previous page
        }
      }
    },
    [navigator],
  );

  return (
    <>
      {/* ── Toolbar ── */}
      <HeaderBar
        book={book}
        nightMode={nightMode}
        setNightMode={setNightMode}
        fontSize={fontSize}
        setFontSize={setFontSize}
        showToc={showToc}
        setShowToc={setShowToc}
        onClose={onClose}
      />

      {/* ── Reader area ── */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`flex-1 relative transition-colors duration-300 group ${
          nightMode ? 'bg-[#1E1E1E]' : 'bg-[#FBF7F0]'
        }`}
      >
        <div className="absolute inset-0 px-4 md:px-12 lg:px-24 py-4 md:py-6">
          <div className="w-full h-full">
            <ReaderContent
              fontSize={fontSize}
              lineSpacing={1.8}
              justify
              hyphenate
              flow="paginated"
            />
          </div>
        </div>

        {/* Floating prev / next buttons (always visible on mobile, hover on desktop) */}
        <ReaderPrevious
          className={`absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center md:opacity-0 group-hover:opacity-100 hover:!opacity-100 transition-all duration-200 shadow-lg z-20 border touch-target ${
            nightMode
              ? 'bg-[#2A2A2A]/80 text-[#D4D4D4] border-[#444] hover:bg-[#3A3A3A]'
              : 'bg-white/80 text-[#4A4A4A] border-[#E8E2D5] hover:bg-white hover:text-accent-600'
          }`}
          aria-label="上一页"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </ReaderPrevious>

        <ReaderNext
          className={`absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center md:opacity-0 group-hover:opacity-100 hover:!opacity-100 transition-all duration-200 shadow-lg z-20 border touch-target ${
            nightMode
              ? 'bg-[#2A2A2A]/80 text-[#D4D4D4] border-[#444] hover:bg-[#3A3A3A]'
              : 'bg-white/80 text-[#4A4A4A] border-[#E8E2D5] hover:bg-white hover:text-accent-600'
          }`}
          aria-label="下一页"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </ReaderNext>

        {/* Keyboard left/right hint (shown briefly, then fades) */}
        <KeyboardNavHint nightMode={nightMode} />
      </div>

      {/* ── TOC Side Drawer ── */}
      <TocDrawer
        entries={tocEntries}
        nightMode={nightMode}
        onClose={() => setShowToc(false)}
        onNavigate={handleTocNavigate}
        visible={showToc}
      />

      {/* ── CSS ── */}
      <style>{`
        .epub-container {
          background-color: #FBF7F0;
        }
        .epub-container .epub-content {
          font-family: 'LXGW WenKai', serif;
          line-height: 1.8;
          color: #1A1A1A;
        }
        .night .epub-container {
          background-color: #1A1A1A;
          color: #D1D5DB;
        }
      `}</style>
    </>
  );
}

/* ──────────────────────────────────────────────
   Sub-components
   ────────────────────────────────────────────── */

function HeaderBar({
  book,
  nightMode,
  setNightMode,
  fontSize,
  setFontSize,
  showToc,
  setShowToc,
  onClose,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const btnBase = (active) =>
    `inline-flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium transition-colors border touch-target ${
      active
        ? 'bg-accent-600 text-white border-accent-600 shadow-sm'
        : nightMode
          ? 'text-[#B0B0B0] border-[#3A3A3A] hover:text-[#E0E0E0] hover:bg-[#2A2A2A]'
          : 'text-accent-600 border-[#E8E2D5] hover:text-white hover:bg-accent-600 hover:border-accent-600'
    }`;

  return (
    <header
      className={`flex items-center gap-2 md:gap-3 px-4 md:px-8 py-3 md:py-4 shrink-0 transition-all duration-300 z-10 ${
        nightMode
          ? 'bg-[#1A1A1A]/90 backdrop-blur-md shadow-sm border-b border-[#333]'
          : 'bg-[#FBF7F0]/85 backdrop-blur-md shadow-sm border-b border-[#E8E2D5]'
      }`}
    >
      {/* Back */}
      <button
        onClick={onClose}
        className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium transition-colors border touch-target ${
          nightMode
            ? 'text-[#B0B0B0] border-[#3A3A3A] hover:text-[#E0E0E0] hover:bg-[#2A2A2A]'
            : 'text-accent-600 border-[#E8E2D5] hover:text-white hover:bg-accent-600 hover:border-accent-600'
        }`}
        title="返回 (Esc)"
      >
        <ChevronLeft />
        <span className="hidden sm:inline">返回</span>
      </button>

      {/* Title */}
      <span
        className={`text-sm font-serif truncate flex-1 min-w-0 ${
          nightMode ? 'text-[#D4D4D4]' : 'text-[#4A4A4A]'
        }`}
      >
        {book.title}
      </span>

      {/* ── Desktop buttons (md+) ── */}
      <div className="hidden md:flex items-center gap-2">
        <button onClick={() => setShowToc((v) => !v)} className={btnBase(showToc)} title="目录">
          <ListIcon />
          <span>目录</span>
        </button>

        <button onClick={() => setNightMode((v) => !v)} className={btnBase(nightMode)} title="夜间模式">
          {nightMode ? <SunIcon /> : <MoonIcon />}
        </button>

        <div className={`flex items-center gap-0.5 rounded-xl p-0.5 ${nightMode ? 'bg-[#3A3A3A]' : 'bg-[#F0EBE3]'}`}>
          {FONT_SIZES.map((fs) => (
            <button
              key={fs.value}
              onClick={() => setFontSize(fs.value)}
              className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                fontSize === fs.value
                  ? 'bg-accent-600 text-white shadow-sm'
                  : nightMode ? 'text-[#999] hover:text-[#DDD]' : 'text-[#6B6B6B] hover:text-accent-600'
              }`}
              title={`字号: ${fs.label}`}
            >
              {fs.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Mobile: "more" menu button ── */}
      <div className="flex md:hidden relative">
        <button
          onClick={() => setMobileMenuOpen((v) => !v)}
          className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium transition-colors border touch-target ${
            mobileMenuOpen
              ? 'bg-accent-600 text-white border-accent-600'
              : nightMode
                ? 'text-[#B0B0B0] border-[#3A3A3A]'
                : 'text-accent-600 border-[#E8E2D5]'
          }`}
          title="更多"
        >
          <DotsIcon />
        </button>

        {/* Dropdown */}
        {mobileMenuOpen && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setMobileMenuOpen(false)} />
            <div
              className={`absolute right-0 top-full mt-2 w-44 rounded-2xl shadow-xl border z-30 overflow-hidden ${
                nightMode ? 'bg-[#2A2A2A] border-[#444]' : 'bg-white border-[#E8E2D5]'
              }`}
            >
              {/* TOC */}
              <button
                onClick={() => { setShowToc((v) => !v); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-2 px-4 py-3 text-sm transition-colors ${
                  nightMode ? 'text-[#D4D4D4] hover:bg-[#3A3A3A]' : 'text-[#1A1A1A] hover:bg-[#F7F3EC]'
                }`}
              >
                <ListIcon /> 目录
              </button>

              {/* Night mode */}
              <button
                onClick={() => { setNightMode((v) => !v); }}
                className={`w-full flex items-center gap-2 px-4 py-3 text-sm transition-colors ${
                  nightMode ? 'text-[#D4D4D4] hover:bg-[#3A3A3A]' : 'text-[#1A1A1A] hover:bg-[#F7F3EC]'
                }`}
              >
                {nightMode ? <SunIcon /> : <MoonIcon />}
                {nightMode ? '日间模式' : '夜间模式'}
              </button>

              {/* Font sizes */}
              <div
                className={`px-3 py-2 border-t ${
                  nightMode ? 'border-[#444]' : 'border-[#F0EBE3]'
                }`}
              >
                <p className={`text-xs mb-2 px-1 ${nightMode ? 'text-[#999]' : 'text-[#9B9B9B]'}`}>字号</p>
                <div className="flex gap-1">
                  {FONT_SIZES.map((fs) => (
                    <button
                      key={fs.value}
                      onClick={() => { setFontSize(fs.value); }}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        fontSize === fs.value
                          ? 'bg-accent-600 text-white'
                          : nightMode
                            ? 'text-[#999] hover:bg-[#3A3A3A]'
                            : 'text-[#6B6B6B] hover:bg-[#F0EBE3]'
                      }`}
                    >
                      {fs.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}

function TocDrawer({ entries, nightMode, visible, onClose, onNavigate }) {
  if (!visible) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-20 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`fixed right-0 top-0 bottom-0 z-30 w-80 max-w-[85vw] shadow-2xl transition-transform duration-300 flex flex-col ${
          nightMode
            ? 'bg-[#252525] text-[#D4D4D4]'
            : 'bg-white text-[#1A1A1A]'
        }`}
      >
        <div
          className={`flex items-center justify-between px-4 py-4 border-b ${
            nightMode ? 'border-[#3A3A3A]' : 'border-[#F0EBE3]'
          }`}
        >
          <h3 className="font-serif font-semibold text-sm">目录</h3>
          <button
            onClick={onClose}
            className={`text-lg leading-none transition-colors ${
              nightMode
                ? 'text-[#777] hover:text-[#DDD]'
                : 'text-[#B8B8B8] hover:text-[#1A1A1A]'
            }`}
          >
            &times;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {entries.length === 0 ? (
            <p
              className={`text-sm text-center py-12 font-light ${
                nightMode ? 'text-[#777]' : 'text-[#9B9B9B]'
              }`}
            >
              本书无目录
            </p>
          ) : (
            entries.map((entry, i) => (
              <button
                key={entry.href || i}
                onClick={() => onNavigate(entry.href)}
                className={`w-full text-left text-sm transition-colors border-l-2 ${
                  nightMode
                    ? 'hover:bg-[#333] border-transparent hover:border-[#555]'
                    : 'hover:bg-accent-50 border-transparent hover:border-accent-500'
                }`}
                style={{
                  paddingLeft: `${16 + (entry.depth || 0) * 16}px`,
                  paddingRight: '16px',
                  paddingTop: '10px',
                  paddingBottom: '10px',
                }}
              >
                <span className="line-clamp-2 leading-relaxed">
                  {entry.label}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );
}

/**
 * Shows a subtle "← → 翻页" hint at the bottom center,
 * fades out after 3 seconds.
 */
function KeyboardNavHint({ nightMode }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-xs font-light transition-opacity duration-700 z-10 pointer-events-none ${
        nightMode
          ? 'bg-[#3A3A3A]/80 text-[#999]'
          : 'bg-[#F0EBE3]/80 text-[#9B9B9B]'
      }`}
    >
      ← 键盘方向键翻页 →
    </div>
  );
}

/* ──────────────────────────────────────────────
   Tiny inline SVG icons (keeps component self-contained)
   ────────────────────────────────────────────── */

function ChevronLeft() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
    >
      <circle cx="12" cy="5" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="19" r="2" />
    </svg>
  );
}
