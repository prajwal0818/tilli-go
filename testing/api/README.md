# DeployFlow — Postman API Tests

API test collection for DeployFlow with 8 test folders and ~40 requests.

## Prerequisites

- DeployFlow backend running (local dev or Docker)
- [Newman CLI](https://www.npmjs.com/package/newman) for command-line execution (optional)
- [Postman desktop app](https://www.postman.com/downloads/) for GUI execution (optional)

## Collection Structure

| # | Folder | Requests | Key Assertions |
|---|--------|----------|----------------|
| 00 | Health | 1 | 200, `{status:"ok"}` |
| 01 | Auth | 5 | Register, duplicate, weak password, login, wrong password |
| 02 | Projects | 7 | CRUD, duplicate code, nonexistent ID |
| 03 | Tasks CRUD | 9 | Create, validation errors, list, get, update, delete |
| 04 | Status Transitions | 6 | Full lifecycle, invalid transitions, completed immutability |
| 05 | Dependencies | 8 | Set deps, cycle detection, self-dep, trigger blocked |
| 06 | Scheduler | 2 | Status and manual trigger |
| 07 | Acknowledge | 2 | Missing params, invalid token |
| 08 | Security | 3 | No auth, invalid bearer, health no auth |

**Run folders in order** — later folders depend on variables set by earlier ones.

## Running with Newman (CLI)

```bash
npm install -g newman
```

### Local Dev (API on :3001)

```bash
newman run collections/DeployFlow.postman_collection.json \
  -e environments/local.postman_environment.json \
  --delay-request 100
```

### Docker (API on :3003)

```bash
newman run collections/DeployFlow.postman_collection.json \
  -e environments/docker.postman_environment.json \
  --delay-request 100
```

### From project root

```bash
newman run testing/api/collections/DeployFlow.postman_collection.json \
  -e testing/api/environments/local.postman_environment.json \
  --delay-request 100
```

## Importing into Postman Desktop

1. **File > Import** — select `collections/DeployFlow.postman_collection.json`
2. **File > Import** — select the environment file (`environments/local.postman_environment.json` or `docker`)
3. Select the environment from the dropdown (top right)
4. Click **Run collection** to execute all folders in order

## Environment Variables

Both environment files share the same variable keys. Only `baseUrl` and `frontendUrl` differ.

| Variable | Description | Set By |
|----------|-------------|--------|
| `baseUrl` | API base URL | Pre-configured |
| `frontendUrl` | Frontend URL | Pre-configured |
| `token` | JWT auth token | Auth > Register/Login |
| `testEmail` | Unique email per run | Auth > Register pre-request |
| `testPassword` | Test password | Pre-configured (`TestPass1234`) |
| `testName` | Test user name | Pre-configured |
| `projectId_alpha` | Alpha project ID | Projects > Create ALPHA |
| `projectId_beta` | Beta project ID | Projects > Create BETA |
| `taskId_1` … `taskId_C` | Task IDs | Tasks CRUD / Dependencies |

## Notes

- **Unique emails**: Each run generates a unique email via `Date.now()` to avoid conflicts
- **Unique project codes**: Each run generates unique codes (`ALPHA-{timestamp}`, `BETA-{timestamp}`)
- **Acknowledge happy path**: Requires a worker-generated HMAC token — only error cases are automated
- **Rate limiting**: Auth endpoints have rate limits (5 register/min, 10 login/min) — add `--delay-request 200` if hitting limits
