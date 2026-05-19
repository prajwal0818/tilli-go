import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface NavItem {
  to: string;
  label: string;
  icon: React.FC;
}

function DashboardIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}

function ProjectsIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function TasksIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}

const EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
  { to: '/projects', label: 'Projects', icon: ProjectsIcon },
  { to: '/tasks', label: 'Tasks', icon: TasksIcon },
  { to: '/profile', label: 'Profile', icon: ProfileIcon },
];

interface SidebarProps {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
}

export default function Sidebar({ isCollapsed, isMobileOpen, onToggleCollapse, onCloseMobile }: SidebarProps) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('selectedProjectId');
    navigate('/login');
  };

  return (
    <motion.aside
      className={`
        border-r border-stone-700 bg-stone-900 text-white flex flex-col
        md:relative md:translate-x-0
        fixed inset-y-0 left-0 z-30
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
      animate={{ width: isCollapsed ? 64 : 224 }}
      transition={{ duration: 0.3, ease: EASE }}
    >
      {/* Brand + Desktop Toggle */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-stone-700">
        <motion.span
          className="text-lg font-bold tracking-tight overflow-hidden whitespace-nowrap"
          animate={{ opacity: isCollapsed ? 0 : 1, width: isCollapsed ? 0 : 'auto' }}
          transition={{ duration: 0.2, ease: EASE }}
        >
          Tilli-go
        </motion.span>
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex items-center justify-center p-1.5 rounded hover:bg-stone-800 transition-colors focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <motion.svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            animate={{ rotate: isCollapsed ? 180 : 0 }}
            transition={{ duration: 0.3, ease: EASE }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </motion.svg>
        </button>
      </div>

      {/* Navigation */}
      <nav aria-label="Main navigation" className="flex-1 py-4 px-2 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/dashboard'}
            onClick={onCloseMobile}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900 ${
                isActive
                  ? 'bg-primary text-white'
                  : 'text-stone-300 hover:bg-stone-800 hover:text-white'
              } ${isCollapsed ? 'justify-center' : ''}`
            }
            title={isCollapsed ? item.label : undefined}
          >
            {({ isActive }) => (
              <>
                <item.icon aria-hidden="true" />
                <motion.span
                  className="overflow-hidden whitespace-nowrap"
                  animate={{ opacity: isCollapsed ? 0 : 1, width: isCollapsed ? 0 : 'auto' }}
                  transition={{ duration: 0.2, ease: EASE }}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.label}
                </motion.span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-stone-700">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-stone-300 hover:bg-stone-800 hover:text-white transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900 ${
            isCollapsed ? 'justify-center' : ''
          }`}
          aria-label="Logout"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <motion.span
            className="overflow-hidden whitespace-nowrap"
            animate={{ opacity: isCollapsed ? 0 : 1, width: isCollapsed ? 0 : 'auto' }}
            transition={{ duration: 0.2, ease: EASE }}
          >
            Logout
          </motion.span>
        </button>
      </div>
    </motion.aside>
  );
}
