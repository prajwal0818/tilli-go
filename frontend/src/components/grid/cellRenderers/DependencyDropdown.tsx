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

// ── Helpers ───────────────────────────────────────────────────────────────────

interface TaskInfo {
  id: string;
  name: string;
  displayId: string;
}

/** Build a lookup of task ID → { name, displayId } from grid rows. */
function buildTaskMap(api: ICellRendererParams<Task>['api']): Map<string, TaskInfo> {
  const map = new Map<string, TaskInfo>();
  api.forEachNode((node: IRowNode<Task>) => {
    if (node.data) {
      const code = node.data.project?.code || '???';
      const seq = node.data.sequenceNumber;
      map.set(node.data.id, {
        id: node.data.id,
        name: node.data.taskName,
        displayId: `${code}-${seq}`,
      });
    }
  });
  return map;
}

// ── Cell Renderer ─────────────────────────────────────────────────────────────

export function DependencyRenderer(params: ICellRendererParams<Task, string[]>) {
  const deps = params.value || [];
  const isCompleted = params.data?.status === 'Completed';
  const applyFieldUpdate = params.context?.applyFieldUpdate as
    | ((rowId: string, field: string, value: unknown) => void)
    | undefined;

  if (deps.length === 0) {
    return <span style={{ color: '#9ca3af', fontSize: '12px' }}>None</span>;
  }

  const taskMap = buildTaskMap(params.api);

  const handleRemove = (depId: string, e: React.MouseEvent) => {
    // Prevent AG Grid from starting the cell editor
    e.stopPropagation();
    e.preventDefault();
    const newDeps = deps.filter((id) => id !== depId);
    if (applyFieldUpdate && params.data) {
      applyFieldUpdate(params.data.id, 'dependencies', newDeps);
    }
  };

  return (
    <span
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {deps.map((depId) => {
        const info = taskMap.get(depId);
        const label = info ? info.displayId : depId.slice(0, 8);
        return (
          <span
            key={depId}
            title={info ? `${info.displayId}: ${info.name}` : depId}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              padding: '1px 6px',
              background: '#e0f2fe',
              border: '1px solid #bae6fd',
              borderRadius: '10px',
              fontSize: '11px',
              color: '#0369a1',
              whiteSpace: 'nowrap',
              maxWidth: '120px',
              lineHeight: '18px',
            }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
            {!isCompleted && (
              <span
                role="button"
                onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                onClick={(e) => handleRemove(depId, e)}
                style={{
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '13px',
                  lineHeight: 1,
                  color: '#0369a1',
                  opacity: 0.6,
                  marginLeft: '1px',
                }}
                title="Remove dependency"
              >
                ×
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}

// ── Cell Editor ───────────────────────────────────────────────────────────────

interface DependencyEditorHandle {
  getValue(): string[];
  isPopup(): boolean;
}

const DependencyEditor = forwardRef<DependencyEditorHandle, ICellEditorParams<Task, string[]>>(
  (props, ref) => {
    const [selected, setSelected] = useState<Set<string>>(() => new Set(props.value || []));
    const [filter, setFilter] = useState('');
    const searchRef = useRef<HTMLInputElement>(null);
    // Ref mirrors state so getValue() always reads the latest selection,
    // regardless of React 18 state batching or render timing.
    const selectedRef = useRef<Set<string>>(new Set(props.value || []));

    const rowId = props.data!.id;
    const applyFieldUpdate = props.context?.applyFieldUpdate as
      | ((rowId: string, field: string, value: unknown) => void)
      | undefined;

    const taskMap = useMemo(() => buildTaskMap(props.api), [props.api]);

    const allTasks = useMemo<TaskInfo[]>(() => {
      const tasks: TaskInfo[] = [];
      taskMap.forEach((info) => {
        if (info.id !== props.data?.id) {
          tasks.push(info);
        }
      });
      return tasks.sort((a, b) => a.displayId.localeCompare(b.displayId));
    }, [taskMap, props.data?.id]);

    const available = useMemo(() => {
      const q = filter.toLowerCase();
      return allTasks.filter(
        (t) =>
          !selected.has(t.id) &&
          (!q || t.name.toLowerCase().includes(q) || t.displayId.toLowerCase().includes(q))
      );
    }, [allTasks, filter, selected]);

    const selectedTasks = useMemo(
      () => allTasks.filter((t) => selected.has(t.id)),
      [allTasks, selected]
    );

    useEffect(() => {
      searchRef.current?.focus();
    }, []);

    useImperativeHandle(ref, () => ({
      getValue() {
        return Array.from(selectedRef.current);
      },
      isPopup() {
        return true;
      },
    }));

    const add = (id: string) => {
      setSelected((prev) => {
        const next = new Set(prev).add(id);
        selectedRef.current = next;
        return next;
      });
    };

    const remove = (id: string) => {
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        selectedRef.current = next;
        return next;
      });
    };

    const handleDone = () => {
      const deps = Array.from(selectedRef.current);
      // Explicitly push the update through context so it persists
      // even if AG Grid's cellValueChanged doesn't fire for popup editors.
      applyFieldUpdate?.(rowId, 'dependencies', deps);
      props.stopEditing();
    };

    return (
      <div
        style={{
          background: '#fff',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          width: '280px',
          maxHeight: '360px',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'inherit',
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* ── Selected dependencies ── */}
        {selectedTasks.length > 0 && (
          <div style={{ padding: '8px 10px 4px', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#57534e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
              Selected ({selectedTasks.length})
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', paddingBottom: '6px' }}>
              {selectedTasks.map((task) => (
                <span
                  key={task.id}
                  title={`${task.displayId}: ${task.name}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 6px',
                    background: '#e0f2fe',
                    border: '1px solid #bae6fd',
                    borderRadius: '10px',
                    fontSize: '11px',
                    color: '#0369a1',
                    lineHeight: '18px',
                  }}
                >
                  <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {task.displayId}
                  </span>
                  <span
                    role="button"
                    onClick={() => remove(task.id)}
                    style={{
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '14px',
                      lineHeight: 1,
                      color: '#0369a1',
                      opacity: 0.6,
                    }}
                    title="Remove"
                  >
                    ×
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Search ── */}
        <input
          ref={searchRef}
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

        {/* ── Available tasks ── */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '2px 0', maxHeight: '180px' }}>
          {available.length === 0 && (
            <div style={{ padding: '8px 10px', color: '#9ca3af', fontSize: '13px' }}>
              {allTasks.length === 0 ? 'No other tasks in project' : 'No matching tasks'}
            </div>
          )}
          {available.map((task) => (
            <div
              key={task.id}
              onClick={() => add(task.id)}
              role="option"
              aria-selected={false}
              tabIndex={-1}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 10px',
                cursor: 'pointer',
                fontSize: '13px',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f3f4f6'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ color: '#6b7280', fontSize: '11px', fontWeight: 600, minWidth: '60px' }}>
                {task.displayId}
              </span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {task.name}
              </span>
            </div>
          ))}
        </div>

        {/* ── Done button ── */}
        <div style={{ padding: '6px 10px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={handleDone}
            style={{
              padding: '4px 14px',
              fontSize: '12px',
              fontFamily: 'inherit',
              border: 'none',
              borderRadius: '4px',
              background: '#115e59',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            Done
          </button>
        </div>
      </div>
    );
  }
);

DependencyEditor.displayName = 'DependencyEditor';

export default DependencyEditor;
