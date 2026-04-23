# ZeroIAM — Project Log & Context

> **Last updated:** 2026-04-16
> **Stack:** MERN (MongoDB, Express, React/Vite, Node.js) + Python Flask (Trust Engine)
> **CI/CD:** Jenkins → AWS EC2 (`docker-compose.prod.yml`)
> **Dev URL:** http://localhost:5173 | **API:** http://localhost:3001 | **Trust Engine:** http://localhost:5000
> **Prod URL:** http://\<EC2_PUBLIC_IP\> (see DEPLOYMENT.md)

---

## 📐 Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│              Docker Dev Network                     │
│                                                     │
│  ┌──────────────┐     ┌──────────────────────────┐  │
│  │   Frontend   │────▶│     Backend (PEP)        │  │
│  │ React + Vite │     │  Node.js + Express       │  │
│  │  Port: 5173  │     │  Port: 3001              │  │
│  └──────────────┘     └──────────┬───────────────┘  │
│                                  │                  │
│                    ┌─────────────┴──┐  ┌──────────┐ │
│                    │  Trust Engine  │  │ MongoDB  │ │
│                    │  Python Flask  │  │  :27017  │ │
│                    │  (PDP) :5000   │  └──────────┘ │
│                    └────────────────┘               │
└─────────────────────────────────────────────────────┘
```

### Service → Container Map
| Service | Container | Port | Tech |
|---|---|---|---|
| Frontend | `zeroiam-frontend-dev` | 5173 | React + Vite |
| Backend API | `zeroiam-backend-dev` | 3001 | Node.js + Express |
| Trust Engine | `zeroiam-trust-engine-dev` | 5000 | Python + Flask |
| Database | `zeroiam-mongodb-dev` | 27017 | MongoDB 7.0 |

---

## 🔑 Default Test Credentials

| Role | Username | Password |
|---|---|---|
| Admin | `sora` | `sora` |
| Employee | `joe` | `password123` |
| Employee | `sarah.johnson` | `password123` |
| Employee | `michael.chen` | `password123` |

---

## 🚀 Quick Start Commands

```powershell
# Start everything
docker-compose up -d

# Seed / reset the database
docker-compose exec backend npm run init-db

# View all logs
docker-compose logs -f

# Restart a specific service
docker-compose restart backend

# Stop all containers
docker-compose down

# Stop + wipe MongoDB data (full reset)
docker-compose down -v
```

---

## 🎓 Capstone Spec Gap Analysis

> Source: `Important/Capstone.txt`
> **Title:** Automated Trust Scoring Engine for Zero Trust Access in Hybrid Cloud Environments

### Section 5 — Frontend (React.js)
| Requirement | Status | Notes |
|---|---|---|
| Login Page | ✅ Done | `/login` — JWT auth, role-based redirect |
| Device Scan Trigger Page | ✅ Done | `/verify` — `EmployeeVerify.jsx` |
| Trust Score Dashboard | ✅ Done | Score shown with full factors breakdown |
| Access Decision Display | ✅ Done | Allow / MFA Required / Blocked UI states |
| Scan History Logs | ✅ Done | `/employee` shows scan history |
| Score ≥ 80 → ALLOW | ✅ Done | `verificationController.js` |
| Score 60–79 → MFA Required | ⚠️ Check | Spec says 60–79, code uses DB policy threshold — confirm `mfaThreshold = 60` in TrustPolicy |
| Score < 60 → BLOCK | ✅ Done | Implemented |

### Section 6 — Backend (Node.js + Express)
| Requirement | Status | Notes |
|---|---|---|
| Receive access requests from frontend | ✅ Done | `POST /api/verify/scan` |
| Communicate with Python Trust Engine | ✅ Done | `axios.post` to Trust Engine |
| Apply Zero Trust access policies | ✅ Done | Dynamic gatekeeper with `TrustPolicy` model |
| Store scan results in MongoDB | ✅ Done | `ScanResult` + `AuditLog` collections |
| Return access decisions to frontend | ✅ Done | JSON with decision + factors |

### Section 7 — Python Trust Engine
| Requirement | Status | Notes |
|---|---|---|
| Execute OSQuery checks | ⚠️ Partial | Falls back to **probabilistic simulation** if `osqueryi` not installed |
| Perform Nmap port scans | ⚠️ Partial | Nmap installed in Docker, falls back to random if scan fails inside container |
| Evaluate device health | ✅ Done | All 5 health factors evaluated |
| Calculate trust score | ✅ Done | Deterministic 0–100 model |
| Return access decision | ✅ Done | Returns `trust_score` + `details` JSON |

### Section 8 — Trust Scoring Model
| Criterion | Points | Status |
|---|---|---|
| Firewall Enabled | 25 | ✅ |
| Antivirus Running | 25 | ✅ |
| OS Updated | 20 | ✅ |
| Safe Network Ports | 20 | ✅ |
| Recent Device Scan | 10 | ✅ (always passes in real-time) |

### Section 9 — Database (MongoDB)
| Requirement | Status | Notes |
|---|---|---|
| Store trust logs | ✅ Done | `ScanResult` collection |
| Auditing | ✅ Done | Every login, scan, logout, MFA event in `AuditLog` |
| Compliance support | ✅ Done | `complianceFlags`, `retentionUntil` fields exist |
| Continuous monitoring | ✅ Done | Admin dashboard live stats |

### Section 10 — Docker Containerization
| Requirement | Status | Notes |
|---|---|---|
| Frontend container | ✅ Done | `zeroiam-frontend-dev` |
| Backend container | ✅ Done | `zeroiam-backend-dev` |
| Trust Engine container | ✅ Done | `zeroiam-trust-engine-dev` |
| MongoDB container | ✅ Done | `zeroiam-mongodb-dev` |
| Docker Compose orchestration | ✅ Done | `docker-compose.yml` |

### Section 11 — CI/CD Pipeline
| Requirement | Status | Notes |
|---|---|---|
| Code push triggers pipeline | ✅ Done | Jenkins webhook on `main` branch |
| Automated build + lint + test | ✅ Done | Backend + Frontend validation stages |
| Docker image creation | ✅ Done | `Build Docker Images` stage |
| Service deployment | ⏳ Pending | To be implemented during final deployment stage |

---

### 🚨 Critical Gaps for Submission

1. **OSQuery not reliably running in Docker** — Container falls back to random values. Task: Install `osqueryi` in the Docker image or properly mount host binaries.

2. **MFA is simulated** — Any 6-digit code is accepted. Task: Implement real TOTP as requested in TODO.

---

## ✅ DONE — Session History

### Session 1 — 2026-04-14: Initial Setup
- [x] Cloned repository: `https://github.com/SoraPewnaldo/Zero-trust.git`
- [x] Confirmed MERN stack + Python Trust Engine + Docker Compose
- [x] Analyzed Jenkinsfile, Dockerfiles, nginx.conf, and all compose files
- [x] Docker containers confirmed healthy

### Session 2 — 2026-04-15: Project Recovery & CI Restore
- [x] Fixed Jenkinsfile syntax: removed erroneous leading 4-space indent on `pipeline {` block
- [x] Fixed `docker-compose.yml` port mapping: `5173:8080` → `5173:5173` (Vite exposes 5173)
- [x] Removed obsolete `version: '3.8'` from both docker-compose files
- [x] Jenkins pipeline restored — user instructed to create job at `http://localhost:8080` pointing to GitHub repo
- [x] **Deploy to Production stage REMOVED** from Jenkinsfile — to be re-added properly once AWS is re-provisioned

### Session 3 — 2026-04-16: Cleanup & Codebase Optimization
- [x] **Pruned dead/extra files** from project root:
  - Removed: `aakhya_test.js`, `bun.lockb`, `strip-ts.mjs`, `zeroiam-key.pem`
  - Removed: `docker-compose.prod.yml`, `Dockerfile.prod`, `nginx.conf`, `setup-env.sh`, `DEPLOYMENT.md`
  - Removed: `server/Dockerfile.dev`, `server/tsconfig.json`, `server/postcss.config.js`
- [x] **Security Fix (CRITICAL):** Removed `attemptedPassword` field from failed login AuditLog entries — plaintext passwords were being stored in MongoDB on every failed login
- [x] **Performance Fix:** Replaced `await import()` dynamic imports in hot-path request handlers (`verificationController.js`, `adminController.js`) with proper static top-level imports
- [x] **Code Quality:** Removed all `DEBUG: console.log()` statements from `adminController.js` that were dumping full JSON payloads on every scan log request
- [x] **Mongoose Warnings Fixed (all 4 models):** Removed duplicate manual `.index()` calls for fields that already have `unique: true` in the schema:
  - `User.js` — removed `username` and `email` duplicate indexes
  - `ScanResult.js` — removed `scanId` duplicate index
  - `AuditLog.js` — removed `eventId` duplicate index
  - `TrustPolicy.js` — removed `policyId` duplicate index
- [x] Server restarted — boots **zero warnings**, all 4 containers healthy
- [x] **Production Enterprise Agent**: Re-engineered the Python Trust Engine to query a native Windows Agent. 
  - Compiled the Python script into a standalone `ZeroIAM_Agent.exe` via PyInstaller to demonstrate real-world enterprise MDM distribution.
  - Implemented real `.ps1` and WMI queries for Firewall, Antivirus, and OS status. 
  - Added actual `nmap` port scanning via the Docker Trust Engine targeting `host.docker.internal`.
- [x] **Admin Polish**: Implemented the final backend feature: `PUT /api/admin/users/:userId` route for admin dashboard user editing.

### Session 4 — 2026-04-16: Production Hardening
- [x] **Config Security**: `config/index.js` now validates `JWT_SECRET` is not an insecure default and hard-exits in production if so. JWT expiry tightened from 24h → 8h.
- [x] **MongoDB Injection Protection**: Added `express-mongo-sanitize` middleware — strips `$where`, `$gt` etc. from all request bodies.
- [x] **Body Size Limit**: Express `json()` and `urlencoded()` now enforce `256kb` limit (prevents payload flooding).
- [x] **Centralized Trust Engine Config**: Removed hardcoded `process.env.TRUST_ENGINE_URL` from `verificationController.js`; all Trust Engine config now flows through `config.trustEngine`.
- [x] **Proper Graceful Shutdown**: Backend now stores `http.Server` reference; `SIGTERM`/`SIGINT` close the HTTP server cleanly, disconnect MongoDB, then exit. Added 10s force-exit guard.
- [x] **Uncaught Exception Guards**: Added `uncaughtException` and `unhandledRejection` handlers to surface silent crash scenarios.
- [x] **Docker Health Checks**: All 4 services now have `healthcheck` defined. Frontend/Backend depend via `condition: service_healthy`. Added `restart: unless-stopped` for resilience.
- [x] **Dockerfile Hardening**: All 3 Dockerfiles upgraded from Node 18 → Node 20 LTS / Python 3.9 → 3.11-slim. All use `npm ci` (reproducible) and run as non-root user.
- [x] **Python Requirements Pinned**: `flask==3.0.3`, `requests==2.32.3`, `psutil==5.9.8` — reproducible builds.
- [x] **updateUser Bug Fixed**: `adminController.js` was using `user.isActive` (field doesn’t exist); fixed to correct `user.status` field. Added allow-list validation to prevent privilege escalation.
- [x] **Trust Engine DB Name Aligned**: `server/.env` and `docker-compose.yml` now both use `zeroiam_dev`.
- [x] **MFA Validation Hardened**: Accepts only pure 6-digit numeric codes (regex); rejects alphabetic strings.
- [x] **index.html Cleaned**: Removed TODO comment, improved page title and OG metadata.
- [x] **USER_CREDENTIALS.md Fixed**: Wrong Frontend URL (port 8080 → 5173) corrected.
- [x] **\.gitignore Updated**: Added PyInstaller dist/build/exe/spec exclusions.
- [x] **server/.env.example Updated**: All new config keys documented with generation instructions.

As of 2026-04-17 (Early morning), the system has been further enhanced with real-time per-user metrics and administrative controls.

### Session 5 — 2026-04-17: Final Polish & Audit Fixes
- [x] **MFA UI Cleanup**: Removed the hardcoded "123456" test hint from the verify modal.
- [x] **Admin Analytics Fix**: Rewrote `getUsers` backend using MongoDB aggregation to join per-user scan results (total scans, avg score, last scan).
- [x] **User Management**: Implemented "Suspend / Activate" toggle buttons in the Admin Dashboard linked to the `status` field.
- [x] **GitHub Sync**: Pushed final hardened state to repository.

---

## 🔲 TODO — What's Left

### 🔴 High Priority (App Core Completion)
- [ ] **Real MFA Implementation**: Replace TOTP simulation with `otplib` + per-user `mfaSecret` from User model.
- [x] **Rate Limiting**: `express-rate-limit` on all routes
- [x] **OSQuery Fix**: `windows_agent.py` passes real Windows security telemetry into Docker.
- [x] **MongoDB Injection Protection**: `express-mongo-sanitize` added.

### 🟡 Medium Priority (Security & Polish)
- [x] **Helmet.js**: Security headers middleware active.
- [x] **Input Sanitation**: RegEx escaping in `getScanLogs` prevents ReDoS.
- [x] **Trust Engine Timestamp**: Returns real ISO timestamp.
- [ ] **Resource pages**: Complete placeholder stubs for `/resource/internal-dashboard`, etc.

### 🟢 Low Priority / Future Features
- [ ] **Jenkins Jira Integration**: Set up ticket creation on pipeline failure.
- [ ] **Test Coverage**: Run `npm run test` and document current coverage.
- [x] **User suspension UI**: Added Suspend/Activate toggle in Admin Dashboard.

### 🚀 Final Stage: Deployment (Last Priority)
- [ ] **AWS Reprovisioning**: Re-create EC2 key pair and restore SSH access.
- [ ] **Production Compose**: Restore and optimize `docker-compose.prod.yml`.
- [ ] **Production Nginx**: Restore `nginx.conf` with SSL for `sorapew.tech`.
- [ ] **SSL Certificates**: Re-issue Let's Encrypt certs via Certbot.
- [ ] **Jenkins Production Stage**: Re-add the deploy stage to `Jenkinsfile`.

---

## 🗂️ File Structure (Clean)

```
Capsttone/
├── src/                        ← React + Vite Frontend
│   ├── pages/                  ← Route-level page components
│   ├── components/             ← Shared UI components
│   ├── contexts/               ← AuthContext
│   ├── hooks/                  ← Custom hooks
│   └── lib/                    ← API utils
├── server/                     ← Node.js + Express Backend
│   ├── src/
│   │   ├── controllers/        ← Route handlers
│   │   ├── models/             ← Mongoose schemas
│   │   ├── routes/             ← Express routers
│   │   ├── middleware/         ← auth, errorHandler
│   │   ├── services/           ← trustEvaluation, contextDetection
│   │   ├── scripts/            ← initDb.js
│   │   └── server.js           ← Entry point
│   ├── Dockerfile
│   ├── .env                    ← Local dev env (localhost DB)
│   └── package.json
├── trust_engine/               ← Python Flask Microservice
│   ├── main.py                 ← /scan endpoint + scoring logic
│   ├── requirements.txt
│   └── Dockerfile
├── docker-compose.yml          ← Dev stack (4 services)
├── Dockerfile                  ← Frontend dev image
├── Jenkinsfile                 ← CI pipeline (local only)
├── vite.config.ts
├── tailwind.config.js
└── PROJECT_LOG.md              ← This file
```

---

## 🔧 Known Working State

As of 2026-04-16, the following is confirmed working:
- All 4 Docker containers start clean with zero errors/warnings
- Database seeds correctly with 8 users and 6 resources
- Login works for both `admin` and `employee` roles
- Trust Engine receives scan requests and responds with scores
- Admin dashboard stats, scan logs, and user management endpoints all functional
- Jenkins pipeline runs Checkout → Backend Validation → Frontend Validation → Build Docker Images → Clean Images
