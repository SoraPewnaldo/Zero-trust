# Product Requirements Document (PRD)
## SoraIAM — Zero Trust Identity & Access Management

---

### 1. Overview

SoraIAM is a Zero Trust access management platform that enforces continuous identity and device verification before granting access to hybrid cloud resources. Every access request — regardless of user role — is evaluated in real-time based on contextual signals, trust scoring, and step-up authentication.

---

### 2. Problem Statement

Traditional perimeter-based security grants broad access after a single login. In hybrid cloud environments (on-prem + cloud), this creates risk — compromised credentials or untrusted devices can access sensitive resources unchecked. SoraIAM eliminates implicit trust by requiring verification for every access attempt.

---

### 3. Target Users

| Role | Description |
|------|-------------|
| **Employee** | Requests access to resources; must pass verification gate before accessing dashboard |
| **Admin** | Monitors all employee activity, scan history, trust scores, and device posture |

---

### 4. Core Features

#### 4.1 Universal Verification Gate
- **All users** (employees and admins) must pass a trust scan before accessing any dashboard
- Post-verification, users are routed to their role-specific dashboard

#### 4.2 Context-Aware Trust Evaluation
Auto-detected contextual attributes influence trust scoring:

| Attribute | Values | Detection |
|-----------|--------|-----------|
| Device Type | Managed / Personal | Auto-detected |
| Network Type | Corporate / Home / Public Wi-Fi | Auto-detected |

#### 4.3 Hybrid Cloud Resource-Based Access
Users select a target resource before verification:

| Resource | Sensitivity | Environment |
|----------|-------------|-------------|
| Internal Web Dashboard | Standard | On-prem |
| Git Repository | Elevated | Cloud-hosted |
| Production Cloud Console | Critical | AWS/Azure/GCP |

Higher-sensitivity resources require higher trust scores.

#### 4.4 Trust Scoring & Decisions

```
User Requests Access
  → Auto-Detect Context
  → Select Target Resource
  → Compute Trust Score (0–100)
  → Score Evaluation:
      ≥ 70  → ✓ Allow → Proceed to Dashboard
      40–69 → ⚠ MFA Required → Step-Up MFA → (Verified) → Allow
      < 40  → ✗ Blocked
```

**Decision Factors** (displayed to user):
- Device trust status (managed vs personal)
- Network security level
- Resource sensitivity multiplier
- Role-based baseline score

#### 4.5 MFA Step-Up Authentication
- Triggered when trust score falls in the MFA-required range
- Simulated TOTP/push verification
- On success, access is granted and scan record updated

#### 4.6 Admin Dashboard
- **Overview**: Aggregate stats (total scans, allow/deny rates, avg trust score)
- **Scan Logs**: Filterable table of all verification attempts across users
- **User Detail View**: Per-employee deep dive including:
  - Device info & posture
  - Historical scan timeline with decision factors
  - Security recommendations

#### 4.7 Employee Dashboard
- Personal scan history and trust score trends
- Current device/network context visibility
- Access status per resource

---

### 5. Access Flow

```
User → Login → Verify Gate (all roles)
  → Auto-detect device & network
  → Select target resource
  → Compute trust score
  → If Score ≥ 70: Allow → Route to role dashboard
  → If Score 40–69: Request MFA → Complete MFA → Allow
  → If Score < 40: Blocked → Retry option
```

---

### 6. Data Model (Key Entities)

| Entity | Key Fields |
|--------|------------|
| **User** | id, username, role |
| **ScanResult** | id, userId, trustScore, decision, resource, factors[], mfaVerified, context, timestamp |
| **AccessContext** | deviceType, networkType |
| **DecisionFactor** | name, status (pass/warn/fail), impact score |

---

### 7. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Scan latency | < 2 seconds |
| MFA verification | < 3 seconds |
| UI responsiveness | Mobile + Desktop |
| Session security | Re-verification required per session |

---

### 8. Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| UI Components | shadcn/ui, Lucide icons |
| State | React Context (Auth), React Query |
| Routing | React Router v6 |
| Backend | Mock API (simulated — ready for real backend integration) |

---

### 9. Future Enhancements

- **Session timeout** — force re-verification after inactivity
- **Location detection** — on-prem vs cloud as additional context signal
- **Persistent backend** — replace mock API with real database + auth + edge functions
- **Audit log export** — downloadable compliance reports for admins
- **Risk-adaptive policies** — configurable trust thresholds per resource/role

---

### 10. Success Metrics

| Metric | Definition |
|--------|------------|
| Verification completion rate | % of users passing verification on first attempt |
| MFA step-up rate | % of scans requiring additional authentication |
| Block rate | % of access attempts denied |
| Avg trust score | Mean score across all scans |
