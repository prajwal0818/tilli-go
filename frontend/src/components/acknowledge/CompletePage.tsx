import TokenActionPage from './TokenActionPage';
import type { CompleteResponse } from '../../types';

export default function CompletePage() {
  return (
    <TokenActionPage<CompleteResponse>
      endpoint="/complete"
      loadingText="Completing task..."
      errorHeading="Completion Failed"
      badgeClass="bg-emerald-100 text-emerald-800"
      timeLabel="Completed At"
      getTime={(data) => data.actualEndTime}
      missingParamsError="Invalid completion link — missing task_id or token."
    />
  );
}
