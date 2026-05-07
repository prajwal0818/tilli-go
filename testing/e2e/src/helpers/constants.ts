/** Shared test constants */

export const API_URL = process.env.API_URL || 'http://localhost:3001';
export const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

export const TEST_PASSWORD = 'TestPass1234';

export function uniqueEmail(): string {
  return `e2e-${Date.now()}-${Math.floor(Math.random() * 1000)}@example.com`;
}

export function uniqueName(): string {
  return `E2E User ${Date.now()}`;
}

export function uniqueProjectCode(): string {
  return `E2E${Date.now()}`.slice(0, 20);
}

export function uniqueProjectName(): string {
  return `E2E Project ${Date.now()}`;
}

export const TASK_STATUSES = ['Pending', 'Triggered', 'Acknowledged', 'Completed', 'Blocked'] as const;
export const SYSTEMS = ['FOL', 'SAP GW', 'Fiserv'] as const;
