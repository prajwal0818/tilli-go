import TokenActionPage from './TokenActionPage';
import type { AcknowledgeResponse } from '../../types';

export default function AcknowledgePage() {
  return (
    <TokenActionPage<AcknowledgeResponse>
      endpoint="/acknowledge"
      loadingText="Acknowledging task..."
      errorHeading="Acknowledgement Failed"
      badgeClass="bg-amber-100 text-amber-800"
      timeLabel="Started At"
      getTime={(data) => data.actualStartTime}
      missingParamsError="Invalid acknowledgement link — missing task_id or token."
    />
  );
}
