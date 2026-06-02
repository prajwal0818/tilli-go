import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../services/api';

const STATUS = { LOADING: 'loading', SUCCESS: 'success', ERROR: 'error' } as const;
type PageStatus = (typeof STATUS)[keyof typeof STATUS];

interface TokenActionConfig<T> {
  /** API endpoint path (e.g. '/acknowledge' or '/complete') */
  endpoint: string;
  /** Text shown while the API call is in progress */
  loadingText: string;
  /** Heading shown on error */
  errorHeading: string;
  /** Tailwind classes for the status badge */
  badgeClass: string;
  /** Label for the time field row */
  timeLabel: string;
  /** Extract the time value from the response */
  getTime: (data: T) => string | null;
  /** Error text when params are missing */
  missingParamsError: string;
}

interface BaseResponse {
  message: string;
  taskId: string;
  taskName: string;
  status: string;
}

export default function TokenActionPage<T extends BaseResponse>({
  endpoint,
  loadingText,
  errorHeading,
  badgeClass,
  timeLabel,
  getTime,
  missingParamsError,
}: TokenActionConfig<T>) {
  const [searchParams] = useSearchParams();
  const taskId = searchParams.get('task_id');
  const token = searchParams.get('token');

  const [status, setStatus] = useState<PageStatus>(STATUS.LOADING);
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!taskId || !token) {
      setStatus(STATUS.ERROR);
      setError(missingParamsError);
      return;
    }

    let cancelled = false;

    api
      .get<T>(endpoint, { params: { task_id: taskId, token } })
      .then((res) => {
        if (!cancelled) {
          setStatus(STATUS.SUCCESS);
          setData(res.data);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setStatus(STATUS.ERROR);
          const msg =
            err instanceof Error ? err.message : 'Something went wrong';
          setError(msg);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [taskId, token, endpoint, missingParamsError]);

  const timeValue = data ? getTime(data) : null;

  return (
    <div className="flex items-center justify-center min-h-screen bg-surface-alt">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="bg-surface rounded-card shadow-card p-8 w-full max-w-[420px] text-center"
      >
        <h1 className="text-sm font-semibold text-text-secondary tracking-widest uppercase mb-6">
          Tilli-go
        </h1>

        {status === STATUS.LOADING && (
          <div className="flex flex-col items-center gap-4">
            <motion.div
              className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <p className="text-sm text-text-secondary">{loadingText}</p>
          </div>
        )}

        {status === STATUS.SUCCESS && data && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="w-12 h-12 rounded-full bg-accent-light text-emerald-800 flex items-center justify-center text-2xl font-bold">
              &#10003;
            </div>
            <h2 className="text-lg font-semibold text-text-primary">{data.message}</h2>
            <table className="w-full text-left mt-2">
              <tbody>
                <tr>
                  <td className="px-3 py-2 text-sm text-text-secondary font-medium border-b border-border">Task</td>
                  <td className="px-3 py-2 text-sm text-text-primary border-b border-border">{data.taskName}</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-sm text-text-secondary font-medium border-b border-border">Status</td>
                  <td className="px-3 py-2 text-sm border-b border-border">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${badgeClass}`}>
                      {data.status}
                    </span>
                  </td>
                </tr>
                {timeValue && (
                  <tr>
                    <td className="px-3 py-2 text-sm text-text-secondary font-medium border-b border-border">{timeLabel}</td>
                    <td className="px-3 py-2 text-sm text-text-primary border-b border-border">
                      {new Date(timeValue).toLocaleString()}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </motion.div>
        )}

        {status === STATUS.ERROR && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="w-12 h-12 rounded-full bg-destructive-light text-red-800 flex items-center justify-center text-2xl font-bold">
              &#10007;
            </div>
            <h2 className="text-lg font-semibold text-red-800">{errorHeading}</h2>
            <p className="text-sm text-text-secondary">{error}</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
