import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import api, { getErrorMessage, API_BASE_URL } from '../../services/api';
import { ProjectContext } from '../../App';
import { MICROSOFT_OAUTH_ENABLED } from '../../utils/constants';
import type { AuthResponse } from '../../types';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshProjects } = useContext(ProjectContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Show OAuth error if redirected back from failed Microsoft auth
  useEffect(() => {
    const oauthError = searchParams.get('error');
    if (oauthError) {
      const messages: Record<string, string> = {
        oauth_failed: 'Microsoft authentication failed. Please try again.',
        no_account: 'Could not retrieve your Microsoft account details.',
        no_email: 'No email address was returned from Microsoft.',
        access_denied: 'Access was denied. Please accept the required permissions.',
      };
      setError(messages[oauthError] || decodeURIComponent(oauthError));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post<AuthResponse>('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      await refreshProjects();
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleMicrosoftLogin = () => {
    window.location.href = `${API_BASE_URL}/api/auth/microsoft`;
  };

  return (
    <motion.div
      className="flex items-center justify-center min-h-screen bg-surface-alt"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
        className="w-full max-w-sm space-y-4 bg-surface p-8 rounded-card shadow-card"
      >
        <h2 className="text-xl font-bold text-center text-text-primary">Tilli-go Login</h2>

        {error && (
          <p className="text-sm text-destructive bg-destructive-light p-2 rounded">{error}</p>
        )}

        <div>
          <label htmlFor="login-email" className="block text-sm font-medium text-text-secondary mb-1">Email</label>
          <input
            id="login-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 min-h-[44px] border border-border-strong rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>

        <div>
          <label htmlFor="login-password" className="block text-sm font-medium text-text-secondary mb-1">Password</label>
          <input
            id="login-password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 min-h-[44px] border border-border-strong rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 min-h-[44px] bg-primary text-white rounded-md hover:bg-primary-hover disabled:opacity-50 transition-colors cursor-pointer font-medium focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        {MICROSOFT_OAUTH_ENABLED && (
          <>
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-surface text-text-muted">or</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleMicrosoftLogin}
              className="w-full flex items-center justify-center gap-3 py-2 min-h-[44px] border border-border-strong rounded-md hover:bg-surface-hover transition-colors cursor-pointer font-medium text-text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <svg width="18" height="18" viewBox="0 0 21 21" aria-hidden="true">
                <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
              </svg>
              Sign in with Microsoft
            </button>
          </>
        )}

        <p className="text-sm text-center text-text-secondary">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="text-primary hover:underline">Sign Up</Link>
        </p>
      </motion.form>
    </motion.div>
  );
}
