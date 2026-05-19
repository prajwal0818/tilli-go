import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api, { getErrorMessage, API_BASE_URL } from '../../services/api';
import { ProjectContext } from '../../App';
import { MICROSOFT_OAUTH_ENABLED } from '../../utils/constants';
import type { AuthResponse } from '../../types';

export default function SignUp() {
  const navigate = useNavigate();
  const { refreshProjects } = useContext(ProjectContext);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post<AuthResponse>('/auth/register', { name, email, password });
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
        <h2 className="text-xl font-bold text-center text-text-primary">Create Account</h2>

        {error && (
          <p className="text-sm text-destructive bg-destructive-light p-2 rounded">{error}</p>
        )}

        <div>
          <label htmlFor="signup-name" className="block text-sm font-medium text-text-secondary mb-1">Name</label>
          <input
            id="signup-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 min-h-[44px] border border-border-strong rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>

        <div>
          <label htmlFor="signup-email" className="block text-sm font-medium text-text-secondary mb-1">Email</label>
          <input
            id="signup-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 min-h-[44px] border border-border-strong rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>

        <div>
          <label htmlFor="signup-password" className="block text-sm font-medium text-text-secondary mb-1">Password</label>
          <input
            id="signup-password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 min-h-[44px] border border-border-strong rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            placeholder="Min 8 characters"
          />
        </div>

        <div>
          <label htmlFor="signup-confirm-password" className="block text-sm font-medium text-text-secondary mb-1">Confirm Password</label>
          <input
            id="signup-confirm-password"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 min-h-[44px] border border-border-strong rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 min-h-[44px] bg-primary text-white rounded-md hover:bg-primary-hover disabled:opacity-50 transition-colors cursor-pointer font-medium focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {loading ? 'Creating account...' : 'Sign Up'}
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
              onClick={() => { window.location.href = `${API_BASE_URL}/api/auth/microsoft`; }}
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
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline">Sign In</Link>
        </p>
      </motion.form>
    </motion.div>
  );
}
