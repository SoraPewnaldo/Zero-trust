# Capstone Project: ZeroIAM (Zero Trust Architecture Platform)

![ZeroIAM](https://img.shields.io/badge/ZeroIAM-Zero%20Trust%20IAM-blue)
![Stack](https://img.shields.io/badge/stack-MERN-blueviolet)
![Architecture](https://img.shields.io/badge/architecture-Microservices-orange)
![CI/CD](https://img.shields.io/badge/deployment-Jenkins%20%7C%20AWS-green)

**ZeroIAM** is an enterprise-grade Identity and Access Management (IAM) platform developed as a comprehensive Capstone Project. It serves as a practical implementation and demonstration of **Zero Trust Architecture (ZTA)** principles in modern web applications.

Rather than relying on traditional perimeter-based security (a VPN or firewall), ZeroIAM enforces a "Never Trust, Always Verify" model. Access to resources is granted dynamically based on real-time continuous evaluation of both the user's identity and their device's security posture.

---

## 🏛️ Project Motivation & Zero Trust Principles

Traditional network security models operated on the assumption that anyone inside the corporate network was trusted. In the era of remote work, BYOD (Bring Your Own Device), and cloud migrations, this perimeter has dissolved.

ZeroIAM was built to demonstrate the core tenets of NIST SP 800-207 (Zero Trust Architecture):

1. **Continuous Verification**: Identity and device health are verified upon every single access request, regardless of where the request originates.
2. **Context-Aware Access**: Decisions are based on a dynamically calculated "Trust Score" rather than static roles.
3. **Least Privilege Enforcement**: Users are only granted access to the specific resources they explicitly require at that exact moment.

---

## 🏗️ System Architecture & Workflow

The platform operates as a distributed system, segregating responsibilities into a classic Policy Enforcement Point (PEP) and Policy Decision Point (PDP) model.

```mermaid
graph TD
    User((User & Device)) -->|Requests Access| PEP[Express Backend / PEP]
    PEP -->|Queries Context| DB[(MongoDB)]
    PEP -->|Requests Evaluation| PDP[Python Trust Engine / PDP]

    subgraph "Context Engine"
        PDP -->|Scans OS Health| OS[Firewall, Updates, Ports]
        PDP -->|Calculates Math| Score[Trust Score Output]
    end

    Score -->|Returns Score| PEP
    PEP -->|Decision| Result{Allow, Deny, or MFA?}

    Result -->|Allow| Resource[Target Resource]
    Result -->|Deny| Block[Access Denied Route]
    Result -->|MFA| OTP[Prompt for 2FA]
```

### 1. The Frontend (React/Vite)

Built with React and Tailwind CSS, the frontend serves as the user-facing portal. It features two distinct views:

- **Employee Portal**: Where users initiate Trust Scans to request access to corporate web resources.
- **Admin Dashboard**: A centralized console providing a global security map, live audit logs, and controls to manage Trust Policies (thresholds) and employee access.

### 2. The Backend / Policy Enforcement Point (Node.js & Express)

The backend acts as the gatekeeper. Built on the MERN stack (MongoDB, Express, React, Node.js), it handles:

- **Authentication**: Issuing and verifying JSON Web Tokens (JWT) for session management.
- **Routing**: Intercepting resource requests and acting as the PEP. It halts requests and calls the Trust Engine before proceeding.
- **Policy Enforcement**: Comparing the calculated Trust Score against the resource's required sensitivity threshold to enforce Allow, Deny, or MFA (Multi-Factor Authentication) actions.

### 3. The Trust Engine / Policy Decision Point (Python)

A lightweight microservice built with Flask. When the backend requests an evaluation, the Python Trust Engine:

- Simulates/Scans the host's operating system posture (checking if firewalls are active, OS updates are pending, or insecure ports are open).
- Ingests this telemetry and calculates a cumulative **Trust Score** (0-100).
- Returns this context payload back to the Node.js backend for final enforcement.

### 4. Database (MongoDB)

A non-relational database used to store:

- `Users`: Credentials, roles (Admin/Employee), and MFA secrets.
- `Resources`: The corporate assets being protected, along with their sensitivity levels (Low, Medium, Critical).
- `AuditLogs`: Immutable records of every access attempt, the calculated trust score, and the final decision (Allow/Block) for compliance tracking.

---

## 🚀 CI/CD Pipeline & AWS Deployment

To simulate a real-world enterprise deployment lifecycle, ZeroIAM utilizes an automated Jenkins CI/CD pipeline integrated with AWS EC2.

1. **Source Control Integration**: Pushes to the `main` branch trigger a GitHub Webhook sent to Jenkins.
2. **Automated Validation**:
   - Jenkins clones the codebase and runs `npm run lint` on the React frontend.
   - Jenkins executes an isolated `vitest` suite against the Node.js backend models to guarantee business logic integrity before deployment.
3. **Containerization**: If tests pass, Docker and `docker-compose` build isolated images for the Frontend (served via Nginx), the Backend, the Trust Engine, and a MongoDB container.
4. **Live Deployment**: Jenkins securely SSHs into the active AWS EC2 instance (`15.207.15.101`), pulls down older containers, purges stale images, and spins up the newly built network.

---

## 🔐 Security Deep Dive: The Trust Score Algorithm

Access is not binary; it is fluid. The Trust Engine evaluates multiple vectors:

- **Base Score**: Everyone starts at a baseline.
- **Positive Context**: Using a registered corporate device, having an active firewall, or connecting from an allowed geolocation adds points.
- **Negative Context**: Outdated OS patches or risky open ports dock points.

**Enforcement Logic:**

- **Score > 80**: Transparent access granted (Allow).
- **Score 50-79**: Suspicious context. Access heavily restricted; user is forced to solve a dynamic Multi-Factor Authentication (OTP) challenge to proceed.
- **Score < 50**: High risk. Access immediately Denied; security teams are alerted via the Audit Log.

---

## 📖 Installation & Local Development

For reviewers wishing to test the application locally:

```bash
# 1. Clone & Install
git clone https://github.com/SoraPewnaldo/Zero-trust.git
cd Zero-trust
npm install && cd server && npm install

# 2. Boot Data & Dev Servers
npm run init-db
npm run dev:all
```

- **Live Portal**: `http://localhost:5173`
- **Admin**: `sora` / `password123`
- **Employee**: `joe` / `password123`

---

**Capstone Team (Maintainers):** SoraPewnaldo, Aakhya Chhauhan, Ritik Arora, Jivaj Arora
