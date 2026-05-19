import type { TaskStatus, StatusColors } from '../types';

/** Whether Microsoft OAuth sign-in button is shown. Set REACT_APP_MICROSOFT_OAUTH=false to hide. */
export const MICROSOFT_OAUTH_ENABLED = process.env.REACT_APP_MICROSOFT_OAUTH !== 'false';

export const TASK_STATUSES: TaskStatus[] = [
  'Pending',
  'Triggered',
  'Acknowledged',
  'Completed',
  'Blocked',
];

export const SYSTEMS = [
  'FOL',
  'SAP GW',
  'Fiserv',
] as const;

// Status → Tailwind classes (used in Dashboard cards and tables)
export const STATUS_CARD_COLORS: Record<TaskStatus, string> = {
  Pending: 'bg-amber-100 text-amber-800 border-amber-300',
  Triggered: 'bg-teal-100 text-teal-800 border-teal-300',
  Acknowledged: 'bg-purple-100 text-purple-800 border-purple-300',
  Completed: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  Blocked: 'bg-red-100 text-red-800 border-red-300',
};

// Status → hex colors (used in AG Grid cell renderers)
export const STATUS_BADGE_COLORS: Record<TaskStatus, StatusColors> = {
  Pending: { bg: '#fef3c7', text: '#92400e' },
  Triggered: { bg: '#ccfbf1', text: '#115e59' },
  Acknowledged: { bg: '#ede9fe', text: '#6d28d9' },
  Completed: { bg: '#d1fae5', text: '#065f46' },
  Blocked: { bg: '#fee2e2', text: '#991b1b' },
};
