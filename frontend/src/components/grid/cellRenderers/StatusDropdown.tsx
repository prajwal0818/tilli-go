import type { ICellRendererParams } from 'ag-grid-community';
import { STATUS_BADGE_COLORS } from '../../../utils/constants';
import type { Task, TaskStatus } from '../../../types';

export default function StatusRenderer(params: ICellRendererParams<Task, TaskStatus>) {
  const value = params.value;
  if (!value) return null;

  const isCompleted = params.data?.status === 'Completed';
  const colors = STATUS_BADGE_COLORS[value] || { bg: '#f3f4f6', text: '#374151' };

  return (
    <span
      className={isCompleted ? undefined : 'status-cell-editable'}
      title={isCompleted ? `Status: ${value}` : 'Click to change status'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: 600,
        backgroundColor: colors.bg,
        color: colors.text,
        lineHeight: '20px',
        cursor: isCompleted ? 'default' : 'pointer',
        border: `1px solid ${colors.text}20`,
        transition: 'box-shadow 150ms, filter 150ms',
      }}
    >
      {/* Status dot */}
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: colors.text,
          flexShrink: 0,
        }}
      />
      {value}
      {/* Chevron icon for editable statuses — visible on hover via CSS */}
      {!isCompleted && (
        <svg
          className="status-edit-icon"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0, opacity: 0, transition: 'opacity 150ms', marginLeft: '2px' }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      )}
      {/* Lock icon for completed */}
      {isCompleted && (
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0, opacity: 0.5, marginLeft: '2px' }}
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
      )}
    </span>
  );
}
