import React, { useRef, useMemo } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

// Keywords for syntax highlighting
export const KEYWORDS = {
  actions: ['add', 'remove', 'change', 'make', 'replace', 'insert', 'draw', 'put', 'blur', 'sharpen', 'set'],
  animations: ['zoom', 'pan', 'shimmer', 'fade', 'reveal', 'rotate', 'shake', 'pulse', 'dolly', 'truck', 'slowly'],
  styles: ['retro', 'cinematic', 'watercolor', 'painting', 'glow', 'dramatic', 'vibrant', 'monochrome', 'sepia', 'comic book', 'pixel art'],
  subjects: ['background', 'foreground', 'text', 'logo', 'person', 'car', 'sky', 'water', 'object', 'subject', 'hair', 'eyes', 'image', 'photo'],
  quality: ['photorealistic', 'hyperrealistic', 'hyperdetailed', 'sharp focus', 'detailed textures', '8k', 'professional photography', 'cinematic lighting', 'Unreal Engine'],
};

const KEYWORD_CLASSES = {
  actions: 'text-cyan-400',
  animations: 'text-lime-400',
  styles: 'text-amber-400',
  subjects: 'text-fuchsia-400',
  quality: 'text-emerald-400',
};

// Escapes HTML special characters to prevent XSS
const escapeHtml = (text: string) => {
  const map: {[key: string]: string} = {
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
};

// Takes plain text and returns HTML with keywords wrapped in styled spans
const highlightSyntax = (text: string): string => {
  if (!text) return '';
  const allKeywords = Object.values(KEYWORDS).flat().sort((a, b) => b.length - a.length);
  const regex = new RegExp(`\\b(${allKeywords.join('|')})\\b`, 'gi');
  
  return escapeHtml(text)
    .replace(regex, (match) => {
      const lowerMatch = match.toLowerCase();
      if (KEYWORDS.actions.includes(lowerMatch)) return `<span class="${KEYWORD_CLASSES.actions}">${match}</span>`;
      if (KEYWORDS.animations.includes(lowerMatch)) return `<span class="${KEYWORD_CLASSES.animations}">${match}</span>`;
      if (KEYWORDS.styles.includes(lowerMatch)) return `<span class="${KEYWORD_CLASSES.styles}">${match}</span>`;
      if (KEYWORDS.subjects.includes(lowerMatch)) return `<span class="${KEYWORD_CLASSES.subjects}">${match}</span>`;
      if (KEYWORDS.quality.includes(lowerMatch)) return `<span class="${KEYWORD_CLASSES.quality}">${match}</span>`;
      return match;
    })
    .replace(/\n/g, '<br />'); // Preserve line breaks for HTML
};

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder, rows = 3 }) => {
  const highlighterRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Memoize the highlighted HTML to avoid re-calculating on every render
  const highlightedHTML = useMemo(() => highlightSyntax(value), [value]);

  // Syncs the scroll position of the background div with the textarea
  const handleScroll = () => {
    if (highlighterRef.current && textareaRef.current) {
      highlighterRef.current.scrollTop = textareaRef.current.scrollTop;
      highlighterRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };
  
  const commonClasses = "block w-full rounded-md bg-gray-900 border-gray-600 shadow-sm sm:text-sm whitespace-pre-wrap p-3 leading-relaxed";

  return (
    <div className="relative">
       {/* The background div that displays the highlighted text */}
      <div
        ref={highlighterRef}
        aria-hidden="true"
        className={`${commonClasses} absolute inset-0 z-0 pointer-events-none overflow-hidden text-gray-200 border-transparent`}
        dangerouslySetInnerHTML={{ __html: highlightedHTML + ' ' }}
      />
       {/* The invisible textarea that the user actually interacts with */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        placeholder={placeholder}
        rows={rows}
        spellCheck="false"
        className={`${commonClasses} caret-white bg-transparent text-transparent placeholder-gray-500 relative z-10 resize-none focus:border-indigo-500 focus:ring-indigo-500`}
      />
    </div>
  );
};

export default RichTextEditor;