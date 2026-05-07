/** Input for creating a new project (matches Zod createProjectSchema output) */
export interface CreateProjectDTO {
  name: string;
  code: string;
  description?: string;
}

/** Query parameters for listing projects */
export interface ProjectFilterParams {
  page?: string | number;
  limit?: string | number;
}
