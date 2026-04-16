# ZeroIAM — Project Log & Context

> **Last updated:** 2026-04-16
> **Stack:** MERN (MongoDB, Express, React/Vite, Node.js) + Python Flask (Trust Engine)
> **CI/CD:** Jenkins pipeline (local-only, no auto-deploy until AWS is re-provisioned)
> **Dev URL:** http://localhost:5173 | **API:** http://localhost:3001 | **Trust Engine:** http://localhost:5000

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

---

## 🔲 TODO — What's Left

### 🔴 High Priority (App Core Completion)
- [ ] **Real MFA Implementation**: Replace simulation with proper TOTP (e.g. `otplib` or `speakeasy`).
- [ ] **Rate Limiting**: Add `express-rate-limit` to `/api/auth/login` to prevent brute force.
- [ ] **OSQuery Fix**: Ensure `osqueryi` is correctly running inside the `trust-engine` container or document the specific interrogation logic.

### 🟡 Medium Priority (Security & Polish)
- [ ] **Helmet.js**: Add security headers middleware for the Express backend.
- [ ] **Input Sanitation**: Escape regex filters in `getScanLogs` to prevent ReDoS.
- [ ] **Trust Engine Timestamp**: Update `main.py` to return a real ISO string instead of `"now"`.
- [ ] **Resource pages**: Complete the placeholder stubs for `/resource/internal-dashboard`, etc.
- [ ] **Admin: Edit user**: Implement PUT route for updating user roles and departments.

### 🟢 Low Priority / Future Features
- [ ] **Jenkins Jira Integration**: Set up ticket creation on pipeline failure.
- [ ] **Test Coverage**: Run `npm run test` and document current coverage.
- [ ] **User suspension**: Add route/UI to handle `status: 'suspended'`.

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
