# DeployFlow — Playwright E2E Tests

End-to-end browser tests for DeployFlow using Playwright.

## Prerequisites

- Node.js 18+
- DeployFlow frontend and backend running (local dev or Docker)

## Setup

```bash
cd testing/e2e
npm install
npx playwright install chromium
```

## Running Tests

### Against Local Dev (frontend :3000, API :3001)

```bash
TEST_ENV=local npx playwright test
```

### Against Docker (frontend :3004, API :3003)

```bash
TEST_ENV=docker npx playwright test
```

### Other Modes

```bash
# Headed mode (visible browser)
TEST_ENV=local npx playwright test --headed

# Specific spec file
TEST_ENV=local npx playwright test src/specs/auth.spec.ts

# Debug mode (step through with inspector)
TEST_ENV=local npx playwright test --debug

# Playwright UI mode (interactive)
TEST_ENV=local npx playwright test --ui

# View HTML report
npx playwright show-report
```

## Test Structure

```
src/
  fixtures/
    auth.fixture.ts       # Registers user via API, injects JWT into localStorage
  page-objects/
    landing.page.ts       # Landing page (public)
    login.page.ts         # Login page
    signup.page.ts        # Sign up page
    dashboard.page.ts     # Dashboard with status cards, pie chart
    projects.page.ts      # Project list and creation
    task-grid.page.ts     # AG Grid task editor
    profile.page.ts       # User profile
    acknowledge.page.ts   # Email acknowledgement page
    sidebar.component.ts  # Sidebar navigation
    header.component.ts   # Header with project dropdown
  helpers/
    api.helper.ts         # Direct fetch() wrapper for test setup/teardown
    constants.ts          # Shared test constants and utilities
  specs/
    landing.spec.ts       # Landing page tests (public)
    auth.spec.ts          # Signup, login, logout, protected routes
    projects.spec.ts      # Project CRUD, auto-selection
    dashboard.spec.ts     # Status cards, pie chart, recent tasks
    task-grid.spec.ts     # AG Grid add/delete tasks
    navigation.spec.ts    # Sidebar navigation, collapse, page titles
    profile.spec.ts       # User info, avatar, Coming Soon badge
    acknowledge.spec.ts   # Error cases (missing params, invalid token)
```

## Configuration

| Setting | Value | Reason |
|---------|-------|--------|
| `workers` | 1 | App is stateful — parallel tests cause race conditions |
| `fullyParallel` | false | Tests share state (registered user, projects) |
| Auth strategy | API register + inject JWT | Faster than UI login for every test |
| Test data | Timestamp-based unique names | Avoids conflicts without cleanup |

## Environment Files

- `.env.local` — `BASE_URL=http://localhost:3000`, `API_URL=http://localhost:3001`
- `.env.docker` — `BASE_URL=http://localhost:3004`, `API_URL=http://localhost:3003`

Set `TEST_ENV=local` or `TEST_ENV=docker` to select the environment.

## Notes

- **Auth fixture**: Creates a unique user per test worker via direct API call, then injects the JWT token into `localStorage`. No UI login needed for most tests.
- **AG Grid tests**: Use 600ms waits after mutations to account for the 400ms debounce.
- **Acknowledge tests**: Only error cases are automated (missing params, invalid token). Happy path requires a worker-generated HMAC token.
- **Cleanup**: Tests create unique data per run — no cleanup step needed.
