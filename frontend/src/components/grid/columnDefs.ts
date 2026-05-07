import type {
  ColDef,
  ValueFormatterParams,
  ValueGetterParams,
  EditableCallbackParams,
} from 'ag-grid-community';
import StatusRenderer from './cellRenderers/StatusDropdown';
import DateTimeEditor, { DateTimeRenderer } from './cellRenderers/DateTimePicker';
import DependencyEditor, {
  DependencyRenderer,
} from './cellRenderers/DependencyDropdown';
import { TASK_STATUSES, SYSTEMS } from '../../utils/constants';
import type { Task } from '../../types';

function dateFormatter(params: ValueFormatterParams<Task, string | null>): string {
  if (!params.value) return '';
  return new Date(params.value).toLocaleString();
}

function isEditable(params: EditableCallbackParams<Task>): boolean {
  return params.data?.status !== 'Completed';
}

function displayIdGetter(params: ValueGetterParams<Task>): string {
  const code = params.data?.project?.code || '???';
  const seq = params.data?.sequenceNumber;
  return `${code}-${seq}`;
}

export const columnDefs: ColDef<Task>[] = [
  {
    headerName: 'ID',
    valueGetter: displayIdGetter,
    width: 120,
    editable: false,
    pinned: 'left',
  },
  {
    field: 'system',
    headerName: 'System',
    width: 130,
    cellEditor: 'agSelectCellEditor',
    cellEditorParams: { values: SYSTEMS },
    editable: isEditable,
  },
  {
    field: 'taskName',
    headerName: 'Task Name',
    flex: 1,
    minWidth: 180,
    editable: isEditable,
  },
  {
    field: 'description',
    headerName: 'Description',
    flex: 1,
    minWidth: 150,
    editable: isEditable,
  },
  {
    field: 'assignedTeam',
    headerName: 'Team',
    width: 130,
    editable: isEditable,
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 150,
    cellRenderer: StatusRenderer,
    cellEditor: 'agSelectCellEditor',
    cellEditorParams: { values: TASK_STATUSES },
    editable: isEditable,
  },
  {
    field: 'dependencies',
    headerName: 'Dependencies',
    width: 200,
    cellRenderer: DependencyRenderer,
    cellEditor: DependencyEditor,
    editable: isEditable,
  },
  {
    field: 'plannedStartTime',
    headerName: 'Planned Start',
    width: 190,
    cellRenderer: DateTimeRenderer,
    cellEditor: DateTimeEditor,
    editable: isEditable,
  },
  {
    field: 'plannedEndTime',
    headerName: 'Planned End',
    width: 190,
    cellRenderer: DateTimeRenderer,
    cellEditor: DateTimeEditor,
    editable: isEditable,
  },
  {
    field: 'actualStartTime',
    headerName: 'Actual Start',
    width: 180,
    editable: false,
    valueFormatter: dateFormatter,
  },
  {
    field: 'actualEndTime',
    headerName: 'Actual End',
    width: 180,
    editable: false,
    valueFormatter: dateFormatter,
  },
  {
    field: 'notes',
    headerName: 'Notes',
    flex: 1,
    minWidth: 120,
    editable: isEditable,
  },
];
