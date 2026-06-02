-- CreateIndex
CREATE INDEX "tasks_assigned_user_id_idx" ON "tasks"("assigned_user_id");

-- CreateIndex
CREATE INDEX "task_dependencies_task_id_idx" ON "task_dependencies"("task_id");

-- CreateIndex
CREATE INDEX "task_dependencies_depends_on_task_id_idx" ON "task_dependencies"("depends_on_task_id");

-- CreateIndex
CREATE INDEX "audit_logs_task_id_idx" ON "audit_logs"("task_id");
