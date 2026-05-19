import React, { useContext } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ProjectContext } from '../../App';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/tasks': 'Task Management',
  '/projects': 'Projects',
  '/profile': 'Profile',
};

function MenuIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

interface HeaderProps {
  onToggleMobile: () => void;
}

export default function Header({ onToggleMobile }: HeaderProps) {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'Tilli-go';
  const { projects, selectedProjectId, setSelectedProjectId, projectsLoading } =
    useContext(ProjectContext);

  const user = React.useMemo(() => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        const parsed = JSON.parse(raw) as { email?: string; name?: string; profilePicture?: string | null };
        return parsed;
      }
      const token = localStorage.getItem('token');
      if (!token) return null;
      const parts = token.split('.');
      if (!parts[1]) return null;
      const payload = JSON.parse(atob(parts[1])) as { email?: string; name?: string };
      return { email: payload.email, name: payload.name };
    } catch {
      return null;
    }
  }, []);

  return (
    <header
      className="h-14 border-b border-border bg-surface flex items-center justify-between px-4 md:px-6"
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobile}
          className="md:hidden p-1.5 rounded hover:bg-surface-hover transition-colors min-h-touch min-w-touch flex items-center justify-center cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          aria-label="Toggle menu"
        >
          <MenuIcon />
        </button>
        <h1 className="text-lg font-semibold text-text-primary">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        <select
          value={selectedProjectId || ''}
          onChange={(e) => setSelectedProjectId(e.target.value || null)}
          disabled={projectsLoading}
          aria-label="Select project"
          className="text-sm border border-border-strong rounded-md px-2 py-1.5 min-h-[44px] bg-surface cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
        >
          {projectsLoading ? (
            <option value="" disabled>Loading projects...</option>
          ) : (
            <>
              <option value="" disabled>Select Project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
            </>
          )}
        </select>
        {user && (
          <Link to="/profile" className="hidden sm:flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
            {user.profilePicture ? (
              <img src={user.profilePicture} alt="" className="w-7 h-7 rounded-full object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                {(user.name || user.email || '?').charAt(0).toUpperCase()}
              </div>
            )}
            <span>{user.email}</span>
          </Link>
        )}
      </div>
    </header>
  );
}
