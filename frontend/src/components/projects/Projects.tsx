import React, { useContext, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ProjectContext } from '../../App';
import { getErrorMessage } from '../../services/api';

export default function Projects() {
  const { projects, selectedProjectId, setSelectedProjectId, refreshProjects } =
    useContext(ProjectContext);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const allSelected = projects.length > 0 && selectedIds.size === projects.length;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(projects.map((p) => p.id)));
    }
  };

  const handleBatchDelete = async () => {
    const count = selectedIds.size;
    if (count === 0) return;
    const msg = `Delete ${count} project${count !== 1 ? 's' : ''}? All tasks in these projects will be permanently deleted.`;
    if (!window.confirm(msg)) return;

    setDeleting(true);
    setError(null);
    try {
      const { projectService } = await import('../../services/projectService');
      await projectService.batchDeleteProjects(Array.from(selectedIds));
      setSelectedIds(new Set());
      await refreshProjects();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const created = await refreshProjects({ name, code, description });
      if (created) setSelectedProjectId(created.id);
      setName('');
      setCode('');
      setDescription('');
      setShowForm(false);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Projects</h2>
          <p className="text-sm text-text-secondary mt-1">
            {projects.length} project{projects.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <button
              onClick={handleBatchDelete}
              disabled={deleting}
              className="px-4 py-2 min-h-touch bg-destructive text-white text-sm font-medium rounded-lg hover:bg-destructive/90 disabled:opacity-50 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2"
            >
              {deleting ? 'Deleting...' : `Delete (${selectedIds.size})`}
            </button>
          )}
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 min-h-touch bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              + New Project
            </button>
          )}
        </div>
      </div>

      {error && !showForm && (
        <p className="text-sm text-destructive bg-destructive-light p-2 rounded">{error}</p>
      )}

      {/* Create Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            onSubmit={handleCreate}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="bg-surface border border-border rounded-card shadow-card p-5 space-y-4 overflow-hidden"
          >
            <h3 className="text-sm font-semibold text-text-primary">
              Create New Project
            </h3>

            {error && (
              <p className="text-sm text-destructive bg-destructive-light p-2 rounded">
                {error}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="project-name" className="block text-sm font-medium text-text-secondary mb-1">
                  Project Name
                </label>
                <input
                  id="project-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Q4 Release"
                  className="w-full px-3 py-2 min-h-[44px] border border-border-strong rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary text-sm"
                />
              </div>
              <div>
                <label htmlFor="project-code" className="block text-sm font-medium text-text-secondary mb-1">
                  Code
                </label>
                <input
                  id="project-code"
                  type="text"
                  required
                  maxLength={20}
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. Q4-REL"
                  className="w-full px-3 py-2 min-h-[44px] border border-border-strong rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary text-sm font-mono"
                />
              </div>
            </div>

            <div>
              <label htmlFor="project-description" className="block text-sm font-medium text-text-secondary mb-1">
                Description (optional)
              </label>
              <input
                id="project-description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description"
                className="w-full px-3 py-2 min-h-[44px] border border-border-strong rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary text-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 min-h-touch bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-hover disabled:opacity-50 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                {saving ? 'Creating...' : 'Create Project'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setError(null);
                }}
                className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Project List */}
      <div className="bg-surface border border-border rounded-card shadow-card overflow-hidden">
        {/* Select All Header */}
        {projects.length > 0 && (
          <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-surface-hover/50">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded border-border-strong text-primary focus:ring-primary cursor-pointer"
              aria-label="Select all projects"
            />
            <span className="text-xs font-medium text-text-secondary">Select All</span>
          </div>
        )}
        <div className="divide-y divide-border max-h-[calc(100vh-320px)] overflow-y-auto">
          {projects.map((p) => (
            <div
              key={p.id}
              className={`flex items-center gap-3 px-5 py-4 cursor-pointer transition-colors hover:bg-surface-hover ${
                selectedProjectId === p.id ? 'bg-primary-light border-l-4 border-l-primary' : ''
              }`}
              onClick={() => setSelectedProjectId(p.id)}
            >
              <input
                type="checkbox"
                checked={selectedIds.has(p.id)}
                onChange={() => toggleSelect(p.id)}
                onClick={(e) => e.stopPropagation()}
                className="w-4 h-4 rounded border-border-strong text-primary focus:ring-primary cursor-pointer flex-shrink-0"
                aria-label={`Select project ${p.code}`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-semibold text-primary bg-primary-light px-2 py-0.5 rounded">
                    {p.code}
                  </span>
                  <span className="font-medium text-text-primary truncate">{p.name}</span>
                </div>
                {p.description && (
                  <p className="text-sm text-text-secondary mt-1 truncate">{p.description}</p>
                )}
              </div>
              {selectedProjectId === p.id && (
                <span className="text-xs font-medium text-primary flex-shrink-0">Active</span>
              )}
            </div>
          ))}
          {projects.length === 0 && (
            <div className="px-5 py-8 text-center text-text-muted text-sm">
              No projects yet. Create one to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
