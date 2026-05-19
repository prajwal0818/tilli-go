import { useCallback, useRef, useMemo, useContext, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import type { ColDef, CellValueChangedEvent, GetRowIdParams, RowClassParams } from 'ag-grid-community';

import { columnDefs } from './columnDefs';
import { useTaskData } from '../../hooks/useTaskData';
import { ProjectContext } from '../../App';
import { toast } from '../ui/Toast';
import { getErrorMessage } from '../../services/api';
import type { Task, UpdateTaskInput } from '../../types';

export default function TaskGrid() {
  const gridRef = useRef<AgGridReact<Task>>(null);
  const { selectedProjectId } = useContext(ProjectContext);
  const { tasks, loading, error, addTask, updateTask, deleteTask, fetchTasks } =
    useTaskData(selectedProjectId);

  // ── Per-row debounced updates ──────────────────────────────────────────────
  const pendingUpdates = useRef<Record<string, UpdateTaskInput>>({});
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    return () => {
      Object.values(timers.current).forEach(clearTimeout);
    };
  }, []);

  const flushUpdate = useCallback(
    async (rowId: string) => {
      const payload = pendingUpdates.current[rowId];
      if (!payload) return;
      delete pendingUpdates.current[rowId];

      try {
        await updateTask(rowId, payload);
      } catch (err: unknown) {
        toast(`Update failed: ${getErrorMessage(err)}`);
        fetchTasks();
      }
    },
    [updateTask, fetchTasks]
  );

  const onCellValueChanged = useCallback(
    (event: CellValueChangedEvent<Task>) => {
      const { data, colDef, newValue } = event;
      if (!data) return;
      const rowId = data.id;
      const field = colDef.field as keyof UpdateTaskInput | undefined;

      if (event.oldValue === event.newValue) return;
      if (!field) return;

      if (!pendingUpdates.current[rowId]) {
        pendingUpdates.current[rowId] = {};
      }
      (pendingUpdates.current[rowId] as Record<string, unknown>)[field] = newValue;

      clearTimeout(timers.current[rowId]);
      timers.current[rowId] = setTimeout(() => flushUpdate(rowId), 400);
    },
    [flushUpdate]
  );

  // ── Add Task ───────────────────────────────────────────────────────────────
  const handleAddTask = useCallback(async () => {
    if (!selectedProjectId) {
      toast('Please select a project first.', 'warning');
      return;
    }
    try {
      const created = await addTask({
        system: 'FOL',
        taskName: 'New Task',
        projectId: selectedProjectId,
      });
      setTimeout(() => {
        const api = gridRef.current?.api;
        if (!api) return;
        const rowNode = api.getRowNode(created.id);
        if (rowNode) {
          api.ensureNodeVisible(rowNode, 'bottom');
          api.startEditingCell({
            rowIndex: rowNode.rowIndex!,
            colKey: 'taskName',
          });
        }
      }, 100);
    } catch (err: unknown) {
      toast(`Failed to add task: ${getErrorMessage(err)}`);
    }
  }, [addTask, selectedProjectId]);

  // ── Delete Selected ────────────────────────────────────────────────────────
  const handleDeleteSelected = useCallback(async () => {
    const selected = gridRef.current?.api?.getSelectedRows();
    if (!selected || selected.length === 0) {
      toast('Select one or more rows first.', 'warning');
      return;
    }

    if (!window.confirm(`Delete ${selected.length} task(s)?`)) return;

    for (const row of selected) {
      try {
        await deleteTask(row.id);
      } catch (err: unknown) {
        toast(
          `Failed to delete "${row.taskName}": ${getErrorMessage(err)}`
        );
      }
    }
  }, [deleteTask]);

  // ── Grid Config ────────────────────────────────────────────────────────────
  const defaultColDef = useMemo<ColDef<Task>>(
    () => ({
      resizable: true,
      sortable: true,
      filter: true,
    }),
    []
  );

  const getRowId = useCallback((params: GetRowIdParams<Task>) => params.data.id, []);

  const rowClassRules = useMemo(() => ({
    'row-status-pending':      (params: RowClassParams<Task>) => params.data?.status === 'Pending',
    'row-status-triggered':    (params: RowClassParams<Task>) => params.data?.status === 'Triggered',
    'row-status-acknowledged': (params: RowClassParams<Task>) => params.data?.status === 'Acknowledged',
    'row-status-completed':    (params: RowClassParams<Task>) => params.data?.status === 'Completed',
    'row-status-blocked':      (params: RowClassParams<Task>) => params.data?.status === 'Blocked',
  }), []);

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!selectedProjectId) {
    return (
      <div className="flex items-center justify-center h-full text-text-secondary">
        Select a project to view tasks.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-text-secondary">
        Loading tasks...
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

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-surface">
        <button
          onClick={handleAddTask}
          className="px-3 py-1.5 min-h-touch bg-primary text-white rounded-md text-sm font-medium hover:bg-primary-hover transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          + Add Task
        </button>
        <button
          onClick={handleDeleteSelected}
          className="px-3 py-1.5 min-h-touch bg-destructive text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2"
        >
          Delete Selected
        </button>
        <span className="ml-auto text-xs text-text-muted">
          {tasks.length} task{tasks.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Grid */}
      <div className="ag-theme-alpine" style={{ flex: 1, minHeight: 0 }}>
        <AgGridReact<Task>
          ref={gridRef}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowData={tasks}
          getRowId={getRowId}
          rowClassRules={rowClassRules}
          rowSelection="multiple"
          onCellValueChanged={onCellValueChanged}
          singleClickEdit
          stopEditingWhenCellsLoseFocus
          undoRedoCellEditing
          undoRedoCellEditingLimit={20}
          animateRows
        />
      </div>
    </div>
  );
}
