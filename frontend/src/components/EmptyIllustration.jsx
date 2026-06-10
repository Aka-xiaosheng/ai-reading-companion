/**
 * EmptyIllustration — 极简线稿插图，用于空状态占位
 * type: 'bookshelf' | 'notes' | 'search'
 */
export default function EmptyIllustration({ type = 'bookshelf', size = 120, className = '' }) {
  const stroke = '#C5C0B6';
  const strokeWidth = 1.5;

  const illustrations = {
    bookshelf: (
      <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Shelf top */}
        <line x1="15" y1="35" x2="105" y2="35" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" />
        {/* Shelf middle */}
        <line x1="15" y1="70" x2="105" y2="70" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" />
        {/* Shelf bottom */}
        <line x1="15" y1="105" x2="105" y2="105" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" />
        {/* Left bracket */}
        <line x1="15" y1="35" x2="15" y2="105" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" />
        {/* Right bracket */}
        <line x1="105" y1="35" x2="105" y2="105" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" />
        {/* Leaning book top shelf */}
        <line x1="35" y1="35" x2="32" y2="15" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" />
        <line x1="32" y1="15" x2="50" y2="15" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" />
        <line x1="50" y1="15" x2="50" y2="35" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" />
        {/* Small standing book middle shelf */}
        <line x1="50" y1="70" x2="50" y2="50" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" />
        <line x1="50" y1="50" x2="62" y2="50" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" />
        <line x1="62" y1="50" x2="62" y2="70" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" />
      </svg>
    ),

    notes: (
      <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Paper */}
        <rect x="28" y="18" width="64" height="84" rx="3" stroke={stroke} strokeWidth={strokeWidth} />
        {/* Paper lines */}
        <line x1="38" y1="38" x2="70" y2="38" stroke={stroke} strokeWidth={1} strokeLinecap="round" opacity="0.6" />
        <line x1="38" y1="50" x2="82" y2="50" stroke={stroke} strokeWidth={1} strokeLinecap="round" opacity="0.6" />
        <line x1="38" y1="62" x2="60" y2="62" stroke={stroke} strokeWidth={1} strokeLinecap="round" opacity="0.6" />
        <line x1="38" y1="74" x2="75" y2="74" stroke={stroke} strokeWidth={1} strokeLinecap="round" opacity="0.6" />
        {/* Quill pen */}
        <line x1="72" y1="82" x2="92" y2="28" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" />
        {/* Quill feather curves */}
        <path d="M85 35 Q80 20 75 22" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" fill="none" />
        <path d="M88 40 Q86 25 82 26" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" fill="none" />
      </svg>
    ),

    search: (
      <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Magnifying glass circle */}
        <circle cx="48" cy="48" r="22" stroke={stroke} strokeWidth={strokeWidth} />
        {/* Handle */}
        <line x1="64" y1="64" x2="88" y2="88" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" />
        {/* Inner question mark */}
        <path
          d="M44 38 Q48 32 52 35 Q56 38 52 42 L52 46"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle cx="52" cy="52" r="1.5" fill={stroke} />
      </svg>
    ),
  };

  return (
    <div className={`flex justify-center ${className}`}>
      {illustrations[type] || illustrations.bookshelf}
    </div>
  );
}
