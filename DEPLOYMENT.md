# ZeroIAM — AWS Deployment Guide

> Get the full stack running on AWS EC2 so every device on any network can access the demo.

---

## Architecture (Production)

```
Internet (port 80 / 443)
        │
   ┌────▼────────────────────────────────────────────┐
   │              AWS EC2 Instance                   │
   │                                                 │
   │  ┌──────────────────────────────────────────┐   │
   │  │  Frontend Container (Nginx)              │   │
   │  │  • Serves Vite static build at /         │   │
   │  │  • Proxies /api/* → backend:3001         │   │
   │  └──────────────────────────────────────────┘   │
   │              ↓ internal Docker network          │
   │  ┌───────────────┐   ┌────────────────────────┐ │
   │  │ Backend API   │   │  Trust Engine (Python) │ │
   │  │ Node.js :3001 │──▶│  Flask :5000           │ │
   │  └───────┬───────┘   └────────────────────────┘ │
   │          ↓                                      │
   │  ┌───────────────┐                              │
   │  │   MongoDB     │  (internal only, no public   │
   │  │   :27017      │   port exposed)              │
   │  └───────────────┘                              │
   └─────────────────────────────────────────────────┘
```

---

## Prerequisites

- AWS account with EC2 access
- An EC2 key pair (`.pem` file) for SSH

---

## Step 1 — Launch EC2 Instance

1. Go to **EC2 → Launch Instance**
2. **AMI**: Ubuntu Server 22.04 LTS (Free Tier eligible)
3. **Instance type**: `t3.small` (recommended) or `t2.micro` (free tier, slower builds)
4. **Key pair**: Select your existing key pair or create one
5. **Security Group** — open these inbound ports:

   | Port | Protocol | Source | Purpose |
   |------|----------|--------|---------|
   | 22   | TCP      | Your IP only | SSH access |
   | 80   | TCP      | 0.0.0.0/0 | HTTP demo access |
   | 443  | TCP      | 0.0.0.0/0 | HTTPS (optional) |

6. **Storage**: At least 20 GB (default 8 GB is not enough for Docker images)
7. Launch the instance and note the **Public IP address**

---

## Step 2 — Deploy (One Command)

SSH into the instance, then run the deploy script:

```bash
# SSH in
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>

# One-command deploy (installs Docker, clones repo, builds, seeds DB)
curl -fsSL https://raw.githubusercontent.com/SoraPewnaldo/Zero-trust/main/scripts/deploy.sh | bash
```

**That's it.** The script will:
1. Install Docker + Docker Compose
2. Clone the repository
3. Auto-generate a strong JWT secret
4. Auto-detect your public IP for CORS
5. Build all 4 Docker images (~3-5 min first time)
6. Start all containers
7. Seed the database with demo users
8. Print the live URL

### Manual Deploy (if you prefer)

```bash
# SSH in
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>

# Install Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker

# Clone repo
git clone https://github.com/SoraPewnaldo/Zero-trust.git ~/zeroiam
cd ~/zeroiam

# Set up environment
cp .env.prod.example .env.prod

# Generate a JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Or: openssl rand -hex 64

# Edit .env.prod — fill in JWT_SECRET and CORS_ORIGIN
nano .env.prod

# Build and start
docker compose -f docker-compose.prod.yml up -d --build

# Seed the database
docker compose -f docker-compose.prod.yml exec backend node src/scripts/initDb.js
```

---

## Step 3 — Access the Demo

Open in any browser:

```
http://<EC2_PUBLIC_IP>
```

### Demo Credentials

| Role | Username | Password |
|------|----------|----------|
| **Admin** | `sora` | `sora` |
| Employee | `sarah.johnson` | `password123` |
| Employee | `michael.chen` | `password123` |
| Employee | `emily.rodriguez` | `password123` |
| Employee | `david.kim` | `password123` |
| Employee | `jessica.patel` | `password123` |
| Employee | `james.wilson` | `password123` |

### Demo Flow (show to reviewers)

1. **Login as employee** → click "Access Resource" → Trust Engine runs → see score
2. **MFA prompt** → enter any 6-digit number (e.g. `123456`) → access granted
3. **Logout** → login as `sora` (admin) → explore Admin Dashboard
4. **Admin**: view scan logs, user management, live trust score statistics

> **Note on Trust Scores in AWS**: The Windows Security Agent is not running on EC2 (it's a Linux server). The Trust Engine automatically switches to **Demo Mode** — all security checks pass, giving a score of **80/100** (Allow threshold for non-critical resources).

---

## Step 4 — SSL Certificate (Optional, for HTTPS)

> Required if you want `https://` — Chrome may warn on plain HTTP.

### Option A: Use your domain

1. Point your domain DNS A-record → EC2 Public IP
2. Wait for DNS to propagate (~5 min)

```bash
cd ~/zeroiam

# Stop Nginx to free port 80 for Certbot
docker compose -f docker-compose.prod.yml stop frontend

# Get certificate (replace with your domain + email)
docker compose -f docker-compose.prod.yml run --rm certbot \
  certonly --standalone \
  -d yourdomain.com \
  --email you@email.com \
  --agree-tos --no-eff-email

# In nginx/conf.d/zeroiam.conf:
# 1. Uncomment the HTTPS server block
# 2. Replace YOUR_DOMAIN with your actual domain
# 3. Uncomment the HTTP→HTTPS redirect block
nano ~/zeroiam/nginx/conf.d/zeroiam.conf

# Rebuild frontend image (bakes in new nginx config)
docker compose -f docker-compose.prod.yml up -d --build frontend
```

### Option B: Quick HTTPS with a free domain (no-cost demo)

Services like [nip.io](https://nip.io) or [sslip.io](https://sslip.io) give you a free domain based on IP:
- `13-233-45-67.nip.io` → resolves to `13.233.45.67`

This works with Let's Encrypt!

---

## Management Commands

```bash
cd ~/zeroiam

# View container status (all should show "healthy")
docker compose -f docker-compose.prod.yml ps

# View live logs
docker compose -f docker-compose.prod.yml logs -f

# View a specific service
docker compose -f docker-compose.prod.yml logs -f backend

# Restart a service
docker compose -f docker-compose.prod.yml restart backend

# Stop everything
docker compose -f docker-compose.prod.yml down

# Full reset (wipes data!)
docker compose -f docker-compose.prod.yml down -v

# Re-seed database
docker compose -f docker-compose.prod.yml exec backend node src/scripts/initDb.js

# Deploy latest code update
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build
```

---

## Jenkins CI/CD Integration

To trigger automatic deployment from Jenkins:

1. In Jenkins → **Manage Credentials** → Add:
   - **`ec2-ssh-key`** (SSH Private Key) — your `.pem` file
   - **`ec2-prod-host`** (Secret Text) — your EC2 public IP

2. In the Jenkins job → **Build with Parameters** → check **Deploy to Production**

The `Jenkinsfile` will SSH into EC2, pull the latest code, and rebuild the production stack automatically.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Port 80 not accessible | Check EC2 Security Group inbound rules — port 80 must allow `0.0.0.0/0` |
| Build fails (out of memory) | Upgrade to `t3.small` — `t2.micro` has 1GB RAM which may not be enough for the Node build |
| `CORS` errors in browser | Update `CORS_ORIGIN` in `.env.prod` to match your access URL, then restart backend |
| Database empty after restart | Run `docker compose -f docker-compose.prod.yml exec backend node src/scripts/initDb.js` |
| Containers not "healthy" | Check `docker compose -f docker-compose.prod.yml logs <service>` |
| Frontend shows old version | `docker compose -f docker-compose.prod.yml build --no-cache frontend && docker compose ... up -d frontend` |
