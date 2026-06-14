import { useEffect, useRef, useState } from 'react';

function LabelText({ label, required }) {
  return <span>{label}{required ? <span className="ml-1 text-destructive">*</span> : null}</span>;
}

export function TextInput({ label, hint, className = '', required, ...props }) {
  return (
    <label className={`grid gap-2 text-sm font-medium ${className}`}>
      <LabelText label={label} required={required} />
      <input {...props} required={required} className="min-h-11 w-full rounded-2xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:opacity-60" />
      {hint ? <span className="text-xs font-normal text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

export function NumberInput({ label, ...props }) {
  return <TextInput label={label} type="text" inputMode="decimal" {...props} />;
}

export function SelectInput({ label, hint, children, className = '', required, ...props }) {
  return (
    <label className={`grid gap-2 text-sm font-medium ${className}`}>
      <LabelText label={label} required={required} />
      <select {...props} required={required} className="min-h-11 w-full rounded-2xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:opacity-60">
        {children}
      </select>
      {hint ? <span className="text-xs font-normal text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

export function TextArea({ label, hint, className = '', required, ...props }) {
  return (
    <label className={`grid gap-2 text-sm font-medium ${className}`}>
      <LabelText label={label} required={required} />
      <textarea {...props} required={required} className="min-h-28 w-full resize-y rounded-2xl border border-input bg-background px-4 py-3 text-sm leading-7 outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:opacity-60 break-words" />
      {hint ? <span className="text-xs font-normal text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

export function FileInput({ label, hint, ...props }) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      <span>{label}</span>
      <input {...props} type="file" className="w-full rounded-2xl border border-input bg-background p-3 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium" />
      {hint ? <span className="text-xs font-normal text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

export function RequiredNote() {
  return <p className="rounded-2xl bg-secondary/50 px-4 py-3 text-sm text-muted-foreground"><span className="font-semibold text-destructive">*</span> là thông tin bắt buộc.</p>;
}

export function AdminTable({ columns, rows = [], actions, empty = 'Chưa có dữ liệu', rowClassName }) {
  return (
    <div className="max-w-full overflow-x-auto rounded-3xl border border-border bg-background">
      <table className="min-w-[48rem] w-full text-sm">
        <thead className="bg-secondary/60 text-left">
          <tr>
            {columns.map((column) => <th key={column.key} className="whitespace-nowrap px-4 py-3 font-semibold">{column.label}</th>)}
            {actions ? <th className="whitespace-nowrap px-4 py-3 font-semibold">Thao tác</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.length ? rows.map((row) => (
            <tr key={row.uuid || row.id || row.rowNumber} className={`border-t border-border ${rowClassName ? rowClassName(row) : ''}`}>
              {columns.map((column) => <td key={column.key} className="max-w-[22rem] break-words px-4 py-3 align-top">{column.render ? column.render(row) : row[column.key] ?? '-'}</td>)}
              {actions ? <td className="px-4 py-3 align-top">{actions(row)}</td> : null}
            </tr>
          )) : (
            <tr><td className="px-4 py-10 text-center text-muted-foreground" colSpan={columns.length + (actions ? 1 : 0)}>{empty}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function PageHeader({ title, description, actions }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
        {description ? <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function ActionButton({ className = '', ...props }) {
  return <button {...props} className={`inline-flex min-h-10 items-center justify-center rounded-2xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${className}`} />;
}
export function SecondaryButton({ className = '', ...props }) {
  return <button {...props} className={`inline-flex min-h-10 items-center justify-center rounded-2xl border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50 ${className}`} />;
}
export function DangerButton({ className = '', ...props }) {
  return <button {...props} className={`inline-flex min-h-10 items-center justify-center rounded-2xl border border-destructive/30 bg-background px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50 ${className}`} />;
}

export function Notice({ type = 'error', children }) {
  if (!children) return null;
  const cls = type === 'success' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : type === 'info' ? 'border-primary/20 bg-primary/10 text-primary' : 'border-destructive/20 bg-destructive/10 text-destructive';
  return <div className={`rounded-2xl border p-3 text-sm leading-6 ${cls}`}>{children}</div>;
}

export function SectionCard({ title, description, children, actions, className = '' }) {
  return (
    <section className={`rounded-3xl border border-border bg-background p-4 shadow-sm sm:p-5 ${className}`}>
      {(title || description || actions) ? (
        <div className="mb-5 flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title ? <h3 className="font-display text-xl font-semibold">{title}</h3> : null}
            {description ? <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function TabButtons({ value, onChange, items }) {
  return <div className="flex gap-2 overflow-x-auto rounded-3xl border border-border bg-secondary/40 p-2 sm:flex-wrap sm:overflow-visible">{items.map((item) => <button key={item.value} type="button" onClick={() => onChange(item.value)} className={`whitespace-nowrap rounded-2xl px-4 py-2 text-sm font-medium transition-colors ${value === item.value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:bg-background/70 hover:text-foreground'}`}>{item.label}</button>)}</div>;
}

const STATUS_LABELS = {
  ACTIVE: 'Hiển thị',
  INACTIVE: 'Tạm ẩn',
  ARCHIVED: 'Lưu trữ',
  DRAFT: 'Nháp',
  PUBLISHED: 'Đã đăng',
  COMPLETED: 'Hoàn tất',
  PROCESSING: 'Đang xử lý',
  PENDING: 'Chờ xử lý',
  FAILED: 'Lỗi',
  SUCCESS: 'Thành công',
  VALID: 'Hợp lệ',
  INVALID: 'Không hợp lệ',
  NEW: 'Tạo mới',
  UPDATE: 'Cập nhật',
  WARNING: 'Cảnh báo',
  DUPLICATE_IN_FILE: 'Trùng SKU',
  SKIPPED: 'Bỏ qua',
};

export function StatusBadge({ children }) {
  const value = String(children || '').toUpperCase();
  const positive = ['ACTIVE', 'PUBLISHED', 'VISIBLE', 'COMPLETED', 'SUCCESS', 'VALID', 'NEW', 'UPDATE'];
  const negative = ['INACTIVE', 'FAILED', 'SPAM', 'HIDDEN', 'ARCHIVED', 'INVALID', 'DUPLICATE_IN_FILE', 'SKIPPED'];
  const cls = positive.includes(value)
    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
    : negative.includes(value)
      ? 'bg-destructive/10 text-destructive'
      : 'bg-secondary text-muted-foreground';
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>{STATUS_LABELS[value] || children || '-'}</span>;
}

export function Toolbar({ children }) {
  return <div className="grid gap-3 rounded-3xl border border-border bg-secondary/30 p-4 sm:grid-cols-2 xl:grid-cols-3">{children}</div>;
}

export const formatDate = (value) => value ? new Date(value).toLocaleString('vi-VN') : '-';
export const normalizeMoneyInput = (value) => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : null;

  let normalized = String(value).trim().replace(/\s/g, '');
  if (!normalized) return null;

  const lastComma = normalized.lastIndexOf(',');
  const lastDot = normalized.lastIndexOf('.');

  if (lastComma !== -1 && lastDot !== -1) {
    normalized = lastComma > lastDot
      ? normalized.replace(/\./g, '').replace(',', '.')
      : normalized.replace(/,/g, '');
  } else if (lastComma !== -1) {
    const parts = normalized.split(',');
    const last = parts.at(-1) || '';
    normalized = parts.length > 1 && last.length > 0 && last.length <= 2
      ? `${parts.slice(0, -1).join('')}.${last}`
      : normalized.replace(/,/g, '');
  } else if (lastDot !== -1) {
    const parts = normalized.split('.');
    const last = parts.at(-1) || '';
    normalized = parts.length > 2 || last.length === 3
      ? normalized.replace(/\./g, '')
      : normalized;
  }

  return /^\d+(\.\d{1,2})?$/.test(normalized) ? normalized : null;
};

const normalizeNumberValue = (value) => {
  const normalized = normalizeMoneyInput(value);
  if (normalized === null) return null;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
};

export const toInputNumber = (value) => {
  const normalized = normalizeMoneyInput(value);
  return normalized === null ? '' : normalized;
};

export const normalizeIntegerInput = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const normalized = String(value).trim().replace(/\s/g, '').replace(/,/g, '').replace(/\./g, '');
  if (!/^\d+$/.test(normalized)) return null;
  const number = Number(normalized);
  return Number.isSafeInteger(number) ? number : null;
};

export const formatMoney = (value, currency = 'VND') => {
  const number = normalizeNumberValue(value);
  if (number === null) return '-';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(number);
};

const EDITOR_BLOCKED_TAGS = ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'meta', 'link', 'base', 'svg', 'math'];

const stripEditorControlChars = (value = '') => Array.from(String(value || '')).filter((char) => {
  const code = char.charCodeAt(0);
  return code > 31 && code !== 127;
}).join('');

const safeEditorUrl = (value = '') => {
  const normalized = stripEditorControlChars(value).trim();
  if (!normalized) return '';
  const lower = normalized.toLowerCase();
  if (lower.startsWith('javascript:') || lower.startsWith('data:') || lower.startsWith('file:')) return '';
  if (normalized.startsWith('/') && !normalized.startsWith('//') && !normalized.includes('..')) return normalized;
  if (lower.startsWith('http://') || lower.startsWith('https://')) return normalized;
  return '';
};

const safeEditorImageUrl = (value = '') => {
  const normalized = safeEditorUrl(value);
  if (!normalized) return '';
  if (normalized.startsWith('/uploads/')) return normalized;
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) return normalized;
  return '';
};

const sanitizeEditorPreviewHtml = (value = '') => {
  let html = String(value || '');
  for (const tag of EDITOR_BLOCKED_TAGS) {
    html = html.replace(new RegExp(`<${tag}\\b[\\s\\S]*?<\\/${tag}>`, 'gi'), '');
    html = html.replace(new RegExp(`<\\/?${tag}\\b[^>]*>`, 'gi'), '');
  }
  html = html.replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  html = html.replace(/href\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/gi, (_match, _all, dquote, squote, bare) => {
    const href = safeEditorUrl(dquote || squote || bare || '');
    return href ? `href="${href.replace(/"/g, '&quot;')}" rel="noopener noreferrer"` : '';
  });
  html = html.replace(/src\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/gi, (_match, _all, dquote, squote, bare) => {
    const src = safeEditorImageUrl(dquote || squote || bare || '');
    return src ? `src="${src.replace(/"/g, '&quot;')}"` : '';
  });
  return html;
};

export function RichTextEditor({ label, value, onChange, hint, required, onUploadImage }) {
  const editorRef = useRef(null);
  const imageInputRef = useRef(null);
  const [preview, setPreview] = useState(false);
  const [editorError, setEditorError] = useState('');

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== (value || '')) editorRef.current.innerHTML = value || '';
  }, [value]);

  const emit = () => onChange(editorRef.current?.innerHTML || '');
  const apply = (command, argument = null) => {
    setEditorError('');
    editorRef.current?.focus();
    document.execCommand(command, false, argument);
    emit();
  };

  const applyBlock = (tagName) => apply('formatBlock', tagName);

  const insertLink = () => {
    const href = safeEditorUrl(window.prompt('Nhập link hợp lệ, ví dụ https://example.com hoặc /blog') || '');
    if (!href) { setEditorError('Link không hợp lệ. Chỉ dùng http://, https:// hoặc đường dẫn bắt đầu bằng /.'); return; }
    apply('createLink', href);
  };

  const insertImageUrl = (src) => {
    const safeSrc = safeEditorImageUrl(src);
    if (!safeSrc) { setEditorError('URL ảnh không hợp lệ. Chỉ dùng http://, https:// hoặc /uploads/.'); return; }
    apply('insertImage', safeSrc);
  };

  const insertImageByUrl = () => insertImageUrl(window.prompt('Nhập URL ảnh hợp lệ') || '');

  const uploadInlineImage = async (file) => {
    if (!file) return;
    if (!onUploadImage) { setEditorError('Chưa cấu hình upload ảnh trong nội dung.'); return; }
    try {
      setEditorError('');
      const src = await onUploadImage(file);
      insertImageUrl(src);
    } catch (err) {
      setEditorError(err.message || 'Không upload được ảnh trong bài viết.');
    } finally {
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const text = event.clipboardData?.getData('text/plain') || '';
    document.execCommand('insertText', false, text);
    emit();
  };

  const buttonClass = 'rounded-xl bg-background px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-primary hover:text-primary-foreground';
  const previewHtml = sanitizeEditorPreviewHtml(value || '');

  return (
    <div className="grid gap-2 text-sm font-medium">
      <LabelText label={label} required={required} />
      <div className="flex flex-wrap gap-2 rounded-2xl border border-border bg-secondary/40 p-2">
        <button type="button" onClick={() => applyBlock('h2')} className={buttonClass}>H2</button>
        <button type="button" onClick={() => applyBlock('h3')} className={buttonClass}>H3</button>
        <button type="button" onClick={() => applyBlock('p')} className={buttonClass}>Đoạn</button>
        <button type="button" onClick={() => apply('bold')} className={buttonClass}>Đậm</button>
        <button type="button" onClick={() => apply('italic')} className={buttonClass}>Nghiêng</button>
        <button type="button" onClick={() => apply('underline')} className={buttonClass}>Gạch chân</button>
        <button type="button" onClick={() => apply('insertUnorderedList')} className={buttonClass}>• List</button>
        <button type="button" onClick={() => apply('insertOrderedList')} className={buttonClass}>1. List</button>
        <button type="button" onClick={() => applyBlock('blockquote')} className={buttonClass}>Trích dẫn</button>
        <button type="button" onClick={insertLink} className={buttonClass}>Link</button>
        <button type="button" onClick={() => imageInputRef.current?.click()} className={buttonClass}>Upload ảnh</button>
        <button type="button" onClick={insertImageByUrl} className={buttonClass}>Ảnh URL</button>
        <button type="button" onClick={() => apply('justifyLeft')} className={buttonClass}>Trái</button>
        <button type="button" onClick={() => apply('justifyCenter')} className={buttonClass}>Giữa</button>
        <button type="button" onClick={() => apply('removeFormat')} className={buttonClass}>Xóa định dạng</button>
        <button type="button" onClick={() => setPreview((current) => !current)} className={buttonClass}>{preview ? 'Soạn thảo' : 'Preview'}</button>
        <input ref={imageInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => uploadInlineImage(event.target.files?.[0] || null)} />
      </div>
      {editorError ? <Notice>{editorError}</Notice> : null}
      {preview ? (
        <div className="min-h-[24rem] max-h-[70vh] overflow-y-auto break-words [overflow-wrap:anywhere] rounded-2xl border border-input bg-background px-4 py-3 text-sm leading-7 prose prose-neutral max-w-none dark:prose-invert [&_*]:max-w-full [&_*]:break-words [&_*]:[overflow-wrap:anywhere] [&_blockquote]:rounded-2xl [&_blockquote]:border-l-4 [&_blockquote]:border-primary/40 [&_blockquote]:bg-secondary/40 [&_blockquote]:px-4 [&_blockquote]:py-2 [&_img]:h-auto [&_img]:rounded-2xl [&_img]:object-cover" dangerouslySetInnerHTML={{ __html: previewHtml }} />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={emit}
          onBlur={emit}
          onPaste={handlePaste}
          className="min-h-[24rem] max-h-[70vh] overflow-y-auto break-words [overflow-wrap:anywhere] rounded-2xl border border-input bg-background px-4 py-3 text-sm leading-7 outline-none focus:border-primary prose prose-neutral max-w-none dark:prose-invert [&_*]:max-w-full [&_*]:break-words [&_*]:[overflow-wrap:anywhere] [&_blockquote]:rounded-2xl [&_blockquote]:border-l-4 [&_blockquote]:border-primary/40 [&_blockquote]:bg-secondary/40 [&_blockquote]:px-4 [&_blockquote]:py-2 [&_img]:h-auto [&_img]:rounded-2xl [&_img]:object-cover"
        />
      )}
      {hint ? <span className="text-xs font-normal text-muted-foreground">{hint}</span> : null}
    </div>
  );
}
