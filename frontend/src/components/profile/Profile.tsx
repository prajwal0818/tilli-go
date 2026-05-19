import { useState, useEffect } from 'react';
import api from '../../services/api';
import type { UserSummary } from '../../types';

export default function Profile() {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<UserSummary>('/auth/me')
      .then((res) => setUser(res.data))
      .catch(() => {
        // Fallback to localStorage if /auth/me fails
        try {
          const raw = localStorage.getItem('user');
          if (raw) setUser(JSON.parse(raw) as UserSummary);
        } catch { /* ignore */ }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 text-text-secondary">No user information available.</div>
    );
  }

  const initials = (user.name || user.email)
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const infoRows = [
    { label: 'Name', value: user.name },
    { label: 'Email', value: user.email },
    { label: 'Role', value: user.role || 'USER' },
    { label: 'Auth Method', value: user.oauthProvider === 'microsoft' ? 'Microsoft' : 'Email / Password' },
    { label: 'User ID', value: user.id },
  ];

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      {/* Avatar + Name */}
      <div className="flex items-center gap-4">
        {user.profilePicture ? (
          <img
            src={user.profilePicture}
            alt={user.name}
            className="w-16 h-16 rounded-full object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-xl font-bold">
            {initials}
          </div>
        )}
        <div>
          <h2 className="text-xl font-semibold text-text-primary">{user.name}</h2>
          <p className="text-sm text-text-secondary">{user.email}</p>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-surface rounded-card shadow-card divide-y divide-border">
        {infoRows.map((row) => (
          <div
            key={row.label}
            className="flex justify-between px-6 py-4"
          >
            <span className="text-sm font-medium text-text-secondary">{row.label}</span>
            <span className="text-sm text-text-primary">{row.value}</span>
          </div>
        ))}
      </div>

      {/* Password Section — only for local auth users */}
      {user.oauthProvider !== 'microsoft' && (
        <div className="bg-surface rounded-card shadow-card px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-text-primary">Password</h3>
              <p className="text-sm text-text-secondary mt-1">Change your account password</p>
            </div>
            <span className="text-xs font-medium bg-surface-hover text-text-muted px-2 py-1 rounded">
              Coming Soon
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
