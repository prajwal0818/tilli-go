import {
  useState,
  useMemo,
  forwardRef,
  useImperativeHandle,
  useEffect,
  useRef,
} from 'react';
import type { ICellRendererParams, ICellEditorParams, IRowNode } from 'ag-grid-community';
import type { Task } from '../../../types';

// ── Cell Renderer ─────────────────────────────────────────────────────────────

export function DependencyRenderer(params: ICellRendererParams<Task, string[]>) {
  const deps = params.value || [];
  if (deps.length === 0) {
    return <span style={{ color: '#9ca3af' }}>None</span>;
  }

  const names: string[] = [];
  params.api.forEachNode((node: IRowNode<Task>) => {
    if (node.data && deps.includes(node.data.id)) {
      names.push(node.data.taskName);
    }
  });

  return (
    <span style={{ fontSize: '12px' }} title={names.join(', ')}>
      {names.join(', ')}
    </span>
  );
}

// ── Cell Editor ───────────────────────────────────────────────────────────────

interface DependencyEditorHandle {
  getValue(): string[];
  isPopup(): boolean;
}

interface DepOption {
  id: string;
  name: string;
}

const DependencyEditor = forwardRef<DependencyEditorHandle, ICellEditorParams<Task, string[]>>(
  (props, ref) => {
    const [selected, setSelected] = useState<Set<string>>(() => new Set(props.value || []));
    const [filter, setFilter] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const allTasks = useMemo<DepOption[]>(() => {
      const tasks: DepOption[] = [];
      props.api.forEachNode((node: IRowNode<Task>) => {
        if (node.data && node.data.id !== props.data?.id) {
          tasks.push({ id: node.data.id, name: node.data.taskName });
        }
      });
      return tasks.sort((a, b) => a.name.localeCompare(b.name));
    }, [props.api, props.data?.id]);

    const filtered = useMemo(() => {
      if (!filter) return allTasks;
      const q = filter.toLowerCase();
      return allTasks.filter((t) => t.name.toLowerCase().includes(q));
    }, [allTasks, filter]);

    useEffect(() => {
      containerRef.current?.querySelector<HTMLInputElement>('input[type=text]')?.focus();
    }, []);

    useImperativeHandle(ref, () => ({
      getValue() {
        return Array.from(selected);
      },
      isPopup() {
        return true;
      },
    }));

    const toggle = (id: string) => {
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    };

    return (
      <div
        ref={containerRef}
        style={{
          background: '#fff',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          width: '260px',
          maxHeight: '300px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <input
          type="text"
          placeholder="Search tasks..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            padding: '8px 10px',
            border: 'none',
            borderBottom: '1px solid #e5e7eb',
            outline: 'none',
            fontSize: '13px',
          }}
        />
        <div style={{ overflowY: 'auto', flex: 1, padding: '4px 0' }}>
          {filtered.length === 0 && (
            <div style={{ padding: '8px 10px', color: '#9ca3af', fontSize: '13px' }}>
              No tasks found
            </div>
          )}
          {filtered.map((task) => (
            <label
              key={task.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 10px',
                cursor: 'pointer',
                fontSize: '13px',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#f3f4f6'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <input
                type="checkbox"
                checked={selected.has(task.id)}
                onChange={() => toggle(task.id)}
              />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {task.name}
              </span>
            </label>
          ))}
        </div>
        <div
          style={{
            padding: '6px 10px',
            borderTop: '1px solid #e5e7eb',
            fontSize: '12px',
            color: '#6b7280',
          }}
        >
          {selected.size} selected
        </div>
      </div>
    );
  }
);

DependencyEditor.displayName = 'DependencyEditor';

export default DependencyEditor;
