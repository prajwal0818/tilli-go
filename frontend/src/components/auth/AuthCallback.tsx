import { useEffect, useState, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ProjectContext } from '../../App';

type CallbackState = 'loading' | 'success' | 'error';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshProjects } = useContext(ProjectContext);
  const [state, setState] = useState<CallbackState>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      setState('error');
      const messages: Record<string, string> = {
        oauth_failed: 'Microsoft authentication failed. Please try again.',
        no_account: 'Could not retrieve your Microsoft account details.',
        no_email: 'No email address was returned from Microsoft.',
        access_denied: 'You denied access. Please try again and accept the permissions.',
      };
      setErrorMessage(messages[error] || decodeURIComponent(error));
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    if (token) {
      localStorage.setItem('token', token);

      try {
        const payload = JSON.parse(atob(token.split('.')[1]!));
        localStorage.setItem(
          'user',
          JSON.stringify({
            id: payload.sub,
            email: payload.email,
            name: payload.name || payload.email,
            role: payload.role,
          }),
        );
        setState('success');
        refreshProjects().then(() => {
          navigate('/dashboard');
        });
      } catch {
        setState('error');
        setErrorMessage('Invalid token received');
        setTimeout(() => navigate('/login'), 3000);
      }
    } else {
      setState('error');
      setErrorMessage('No authentication data received');
      setTimeout(() => navigate('/login'), 3000);
    }
  }, [searchParams, navigate, refreshProjects]);

  return (
    <motion.div
      className="flex items-center justify-center min-h-screen bg-surface-alt"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="w-full max-w-sm bg-surface p-8 rounded-card shadow-card text-center space-y-4">
        {state === 'loading' && (
          <>
            <div className="mx-auto w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-text-secondary">Completing sign-in...</p>
          </>
        )}

        {state === 'success' && (
          <>
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-text-primary font-medium">Sign-in successful</p>
            <p className="text-sm text-text-secondary">Redirecting to dashboard...</p>
          </>
        )}

        {state === 'error' && (
          <>
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-text-primary font-medium">Sign-in failed</p>
            <p className="text-sm text-destructive">{errorMessage}</p>
            <p className="text-xs text-text-secondary">Redirecting to login...</p>
          </>
        )}
      </div>
    </motion.div>
  );
}
