import {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from 'react';
import type { ICellEditorParams, ICellRendererParams } from 'ag-grid-community';
import type { Task } from '../../../types';

// ── Cell Renderer ─────────────────────────────────────────────────────────────

export function DateTimeRenderer(params: ICellRendererParams<Task, string | null>) {
  const value = params.value;
  const isCompleted = params.data?.status === 'Completed';
  const isEmpty = !value;

  const displayText = value ? new Date(value).toLocaleString() : null;

  // Completed tasks: show value or dash, no edit affordance
  if (isCompleted) {
    return (
      <span style={{ color: isEmpty ? '#9ca3af' : 'inherit', fontSize: '13px' }}>
        {displayText || '—'}
      </span>
    );
  }

  // Editable cells: show value with pencil icon, or placeholder
  return (
    <span
      className="datetime-cell-editable"
      title={value ? `Click to edit — ${displayText}` : 'Click to set date/time'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        width: '100%',
        height: '100%',
        cursor: 'pointer',
        fontSize: '13px',
      }}
    >
      {isEmpty ? (
        <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Click to set</span>
      ) : (
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {displayText}
        </span>
      )}
      {/* Pencil icon — visible on hover via CSS */}
      <svg
        className="datetime-edit-icon"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#9ca3af"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ flexShrink: 0, opacity: 0, transition: 'opacity 150ms' }}
      >
        <path d="M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
      </svg>
    </span>
  );
}

// ── Cell Editor ───────────────────────────────────────────────────────────────

interface DateTimeEditorHandle {
  getValue(): string | null;
  isPopup(): boolean;
}

/**
 * AG Grid custom cell editor for datetime fields.
 * Uses HTML5 <input type="datetime-local">.
 *
 * Input:  ISO string ("2026-04-16T11:00:00.000Z") or null
 * Output: ISO string or null
 */
const DateTimeEditor = forwardRef<DateTimeEditorHandle, ICellEditorParams<Task, string | null>>(
  (props, ref) => {
    // Convert ISO UTC string to "YYYY-MM-DDTHH:mm" format in UTC
    // so the user edits in UTC and no timezone shift occurs on save.
    const toUtcInput = (iso: string | null | undefined): string => {
      if (!iso) return '';
      const d = new Date(iso);
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
    };

    const [value, setValue] = useState(toUtcInput(props.value));
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      inputRef.current?.focus();
      inputRef.current?.showPicker?.();
    }, []);

    useImperativeHandle(ref, () => ({
      getValue() {
        // The input value is in UTC — append "Z" to ensure correct parsing
        return value ? new Date(value + 'Z').toISOString() : null;
      },
      isPopup() {
        return false;
      },
    }));

    return (
      <input
        ref={inputRef}
        type="datetime-local"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          outline: 'none',
          padding: '0 4px',
          fontSize: '13px',
          fontFamily: 'inherit',
          boxSizing: 'border-box',
        }}
      />
    );
  }
);

DateTimeEditor.displayName = 'DateTimeEditor';

export default DateTimeEditor;
