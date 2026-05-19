import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './Header';
import Sidebar from './Sidebar';

export default function MainLayout() {
  const location = useLocation();

  // Desktop collapse state (persisted)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const stored = localStorage.getItem('sidebarCollapsed');
    return stored === 'true';
  });

  // Mobile open state (not persisted)
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Persist collapse state
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(isCollapsed));
  }, [isCollapsed]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, []);

  const toggleCollapse = () => setIsCollapsed((prev) => !prev);
  const toggleMobile = () => setIsMobileOpen((prev) => !prev);

  return (
    <div className="flex h-screen bg-surface-alt">
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={toggleMobile}
          aria-hidden="true"
          role="presentation"
        />
      )}

      <Sidebar
        isCollapsed={isCollapsed}
        isMobileOpen={isMobileOpen}
        onToggleCollapse={toggleCollapse}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Header onToggleMobile={toggleMobile} />
        <main className="flex-1 flex flex-col overflow-hidden bg-surface-alt">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
