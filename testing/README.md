# DeployFlow — Testing

Automated test suites for DeployFlow: API tests (Postman/Newman) and E2E browser tests (Playwright).

## Quick Start

### Prerequisites

- DeployFlow running (local dev or Docker)
- Node.js 18+

### API Tests (Postman/Newman)

```bash
# Install Newman CLI
npm install -g newman

# Run against local dev (API on :3001)
newman run testing/api/collections/DeployFlow.postman_collection.json \
  -e testing/api/environments/local.postman_environment.json \
  --delay-request 100

# Run against Docker (API on :3003)
newman run testing/api/collections/DeployFlow.postman_collection.json \
  -e testing/api/environments/docker.postman_environment.json \
  --delay-request 100
```

Or import into the Postman desktop app — see [testing/api/README.md](api/README.md).

### E2E Tests (Playwright)

```bash
cd testing/e2e
npm install
npx playwright install chromium

# Run against local dev
TEST_ENV=local npx playwright test

# Run against Docker
TEST_ENV=docker npx playwright test

# View report
npx playwright show-report
```

See [testing/e2e/README.md](e2e/README.md) for headed mode, debug mode, and more.

## What's Tested

### API Tests (~40 requests across 8 folders)

| Folder | Coverage |
|--------|----------|
| Health | Health check endpoint |
| Auth | Register, duplicate email, weak password, login, wrong password |
| Projects | CRUD, duplicate code, nonexistent ID |
| Tasks CRUD | Create with validation, list, get, update, delete, projectId immutability |
| Status Transitions | Full Pending -> Triggered -> Acknowledged -> Completed lifecycle, invalid transitions |
| Dependencies | Set deps, dependency gate, cycle detection, self-dependency |
| Scheduler | Status check, manual trigger |
| Acknowledge | Missing params, invalid token |
| Security | No auth header, invalid bearer, public endpoints |

### E2E Tests (~30 tests across 8 spec files)

| Spec | Coverage |
|------|----------|
| Landing | Hero, navigation links, logged-in state |
| Auth | Signup, login, wrong password, password mismatch, protected routes, logout, token persistence |
| Projects | List, create, auto-select, code uppercase, header dropdown, delete |
| Dashboard | Status cards, pie chart, recent tasks, no-project message |
| Task Grid | Add task, task count, delete selected, no-project message |
| Navigation | Sidebar links, active highlight, collapse persistence, page titles |
| Profile | User info, avatar initials, Coming Soon badge |
| Acknowledge | Missing params error, invalid token error |

## Directory Structure

```
testing/
  README.md                          # This file
  api/
    README.md                        # Postman/Newman guide
    collections/
      DeployFlow.postman_collection.json
    environments/
      local.postman_environment.json
      docker.postman_environment.json
  e2e/
    README.md                        # Playwright guide
    package.json
    playwright.config.ts
    tsconfig.json
    .env.local
    .env.docker
    src/
      fixtures/auth.fixture.ts
      helpers/api.helper.ts, constants.ts
      page-objects/                   # 10 page objects
      specs/                          # 8 spec files
```

## Environments

| Environment | API URL | Frontend URL |
|-------------|---------|-------------|
| Local Dev | http://localhost:3001 | http://localhost:3000 |
| Docker | http://localhost:3003 | http://localhost:3004 |
