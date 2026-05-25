import {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from 'react';
import type { ICellEditorParams, ICellRendererParams } from 'ag-grid-community';
import type { Task } from '../../../types';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Convert ISO UTC string to "YYYY-MM-DDTHH:mm" in UTC (no timezone shift). */
function toUtcInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

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
 * Renders as a popup so the native date picker doesn't cause
 * premature editor closure via stopEditingWhenCellsLoseFocus.
 *
 * Input:  ISO string ("2026-04-16T11:00:00.000Z") or null
 * Output: ISO string or null
 */
const DateTimeEditor = forwardRef<DateTimeEditorHandle, ICellEditorParams<Task, string | null>>(
  (props, ref) => {
    const [value, setValue] = useState(toUtcInput(props.value));
    const inputRef = useRef<HTMLInputElement>(null);
    const field = props.colDef.field!;
    const rowId = props.data!.id;
    const applyFieldUpdate = props.context?.applyFieldUpdate as
      | ((rowId: string, field: string, value: unknown) => void)
      | undefined;

    /** Read the current value from the DOM (avoids React state batching issues). */
    const readDom = (): string | null => {
      const v = inputRef.current?.value || '';
      return v ? new Date(v + 'Z').toISOString() : null;
    };

    useEffect(() => {
      const id = requestAnimationFrame(() => {
        inputRef.current?.focus();
        try { inputRef.current?.showPicker?.(); } catch { /* not all browsers support this */ }
      });
      return () => cancelAnimationFrame(id);
    }, []);

    useImperativeHandle(ref, () => ({
      getValue() {
        return readDom();
      },
      isPopup() {
        return true;
      },
    }));

    const handleSet = () => {
      const isoValue = readDom();
      // Explicitly push the update through context so it persists
      // even if AG Grid's cellValueChanged doesn't fire for popup editors.
      applyFieldUpdate?.(rowId, field, isoValue);
      props.stopEditing();
    };

    const handleClear = () => {
      if (inputRef.current) inputRef.current.value = '';
      setValue('');
      applyFieldUpdate?.(rowId, field, null);
      props.stopEditing();
    };

    return (
      <div
        style={{
          background: 'white',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          padding: '10px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          minWidth: '230px',
          fontFamily: 'inherit',
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <label style={{ fontSize: '11px', fontWeight: 600, color: '#57534e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Date &amp; Time (UTC)
        </label>
        <input
          ref={inputRef}
          type="datetime-local"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); handleSet(); }
            if (e.key === 'Escape') { e.preventDefault(); props.stopEditing(); }
          }}
          style={{
            width: '100%',
            padding: '6px 8px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            fontSize: '13px',
            fontFamily: 'inherit',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={handleClear}
            style={{
              padding: '4px 10px',
              fontSize: '12px',
              fontFamily: 'inherit',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              background: 'white',
              color: '#57534e',
              cursor: 'pointer',
            }}
          >
            Clear
          </button>
          <button
            type="button"
            onClick={handleSet}
            style={{
              padding: '4px 10px',
              fontSize: '12px',
              fontFamily: 'inherit',
              border: 'none',
              borderRadius: '4px',
              background: '#115e59',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            Set
          </button>
        </div>
      </div>
    );
  }
);

DateTimeEditor.displayName = 'DateTimeEditor';

export default DateTimeEditor;
