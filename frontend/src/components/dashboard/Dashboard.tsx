import React, { useContext } from 'react';
import { useTaskData } from '../../hooks/useTaskData';
import { useNavigate } from 'react-router-dom';
import { ProjectContext } from '../../App';
import { STATUS_CARD_COLORS } from '../../utils/constants';
import type { TaskStatus } from '../../types';

const PIE_COLORS: Record<TaskStatus, string> = {
  Pending: '#f59e0b',
  Triggered: '#0F766E',
  Acknowledged: '#8b5cf6',
  Completed: '#22c55e',
  Blocked: '#ef4444',
};

type StatusCounts = Record<TaskStatus, number>;

function PieChart({ counts, total }: { counts: StatusCounts; total: number }) {
  const radius = 80;
  const cx = 100;
  const cy = 100;

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-text-muted text-sm">
        No tasks to display
      </div>
    );
  }

  const slices: React.ReactNode[] = [];
  let startAngle = -90;

  (Object.entries(counts) as [TaskStatus, number][]).forEach(([status, count]) => {
    if (count === 0) return;
    const fraction = count / total;
    const angle = fraction * 360;
    const endAngle = startAngle + angle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;

    if (fraction >= 1) {
      slices.push(
        <circle key={status} cx={cx} cy={cy} r={radius} fill={PIE_COLORS[status]} />
      );
    } else {
      const d = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
      slices.push(<path key={status} d={d} fill={PIE_COLORS[status]} />);
    }

    startAngle = endAngle;
  });

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <svg viewBox="0 0 200 200" className="w-44 h-44 shrink-0">
        {slices}
        <circle cx={cx} cy={cy} r={45} fill="white" />
        <text x={cx} y={cy - 6} textAnchor="middle" className="text-2xl font-bold" fill="#1f2937" fontSize="22">
          {total}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill="#6b7280" fontSize="11">
          total
        </text>
      </svg>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {(Object.entries(counts) as [TaskStatus, number][]).map(([status, count]) => (
          <div key={status} className="flex items-center gap-2 text-sm">
            <span
              className="w-3 h-3 rounded-full inline-block shrink-0"
              style={{ backgroundColor: PIE_COLORS[status] }}
            />
            <span className="text-text-secondary">{status}</span>
            <span className="font-semibold text-text-primary">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, count, colorClass, onClick }: {
  label: string;
  count: number;
  colorClass: string;
  onClick: () => void;
  index: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`border rounded-card p-5 text-left shadow-card hover:shadow-card-hover transition-shadow cursor-pointer ${colorClass}`}
      aria-label={`${count} ${label} tasks`}
    >
      <p className="text-3xl font-bold">{count}</p>
      <p className="text-sm font-medium mt-1">{label}</p>
    </button>
  );
}

export default function Dashboard() {
  const { selectedProjectId } = useContext(ProjectContext);
  const { tasks, loading, error, fetchTasks } = useTaskData(selectedProjectId);
  const navigate = useNavigate();

  if (!selectedProjectId) {
    return (
      <div className="flex items-center justify-center h-full text-text-secondary">
        Select a project to view the dashboard.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-text-secondary">
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <p className="text-destructive">Error: {error}</p>
        <button
          onClick={fetchTasks}
          className="px-3 py-1.5 bg-primary text-white rounded-md text-sm hover:bg-primary-hover transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Retry
        </button>
      </div>
    );
  }

  const counts: StatusCounts = {
    Pending: 0,
    Triggered: 0,
    Acknowledged: 0,
    Completed: 0,
    Blocked: 0,
  };
  tasks.forEach((t) => {
    if (t.status in counts) counts[t.status]++;
  });

  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
    .slice(0, 8);

  return (
    <div
      className="p-6 overflow-auto"
    >
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-text-primary">Overview</h2>
        <p className="text-sm text-text-secondary mt-1">{tasks.length} total tasks</p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {(Object.entries(counts) as [TaskStatus, number][]).map(([status, count], index) => (
          <StatCard
            key={status}
            label={status}
            count={count}
            index={index}
            colorClass={STATUS_CARD_COLORS[status] || 'bg-stone-100 text-stone-800 border-stone-300'}
            onClick={() => navigate('/tasks')}
          />
        ))}
      </div>

      {/* Status Distribution Pie Chart */}
      <div className="bg-surface border border-border rounded-card shadow-card p-5 mb-8">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Status Distribution</h3>
        <PieChart counts={counts} total={tasks.length} />
      </div>

      {/* Recent Activity */}
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-3">Recent Tasks</h3>
        <div className="bg-surface border border-border rounded-card shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-alt border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">ID</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Task</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">System</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Team</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Status</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Planned Start</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentTasks.map((task) => (
                <tr key={task.id} className="hover:bg-surface-hover transition-colors">
                  <td className="px-4 py-3 text-text-secondary font-mono text-xs">
                    {task.project?.code}-{task.sequenceNumber}
                  </td>
                  <td className="px-4 py-3 font-medium text-text-primary">{task.taskName}</td>
                  <td className="px-4 py-3 text-text-secondary">{task.system}</td>
                  <td className="px-4 py-3 text-text-secondary">{task.assignedTeam || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${STATUS_CARD_COLORS[task.status] || ''}`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {task.plannedStartTime
                      ? new Date(task.plannedStartTime).toLocaleString()
                      : '-'}
                  </td>
                </tr>
              ))}
              {recentTasks.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-text-muted">
                    No tasks yet. Go to Tasks to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
