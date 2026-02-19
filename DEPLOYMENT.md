# Zero-Trust Application - AWS EC2 Deployment

## Quick Start

This repository contains everything needed to deploy the Zero-Trust application to AWS EC2.

### What's Included:
- ✅ Frontend (React + Vite)
- ✅ Backend (Node.js + Express + MongoDB)
- ✅ Trust Engine (Python)
- ✅ Docker & Docker Compose configuration
- ✅ CI/CD pipeline
- ✅ Automated deployment script

---

## Deployment Options

### Option 1: Automated Deployment (Recommended)

**On your EC2 instance, run:**
```bash
curl -fsSL https://raw.githubusercontent.com/SoraPewnaldo/Zero-trust/main/deploy-aws.sh -o deploy.sh
chmod +x deploy.sh
./deploy.sh
```

This script will:
1. Install Docker & Docker Compose
2. Clone the repository
3. Generate secure credentials
4. Deploy all services
5. Initialize the database

---

### Option 2: Manual Deployment

**See the complete guide in the artifacts folder**

**Quick commands:**
```bash
# 1. Clone repository
git clone https://github.com/SoraPewnaldo/Zero-trust.git
cd Zero-trust

# 2. Create environment file
nano .env.production
# Add your configuration (see guide)

# 3. Deploy
docker-compose -f docker-compose.prod.yml up -d --build

# 4. Initialize database
docker-compose -f docker-compose.prod.yml exec backend npm run init-db
```

---

## Access Your Application

After deployment, access your application at:

- **Frontend**: `http://<YOUR-EC2-IP>:8080`
- **Backend API**: `http://<YOUR-EC2-IP>:3001/api`
- **Trust Engine**: `http://<YOUR-EC2-IP>:5000`

**Default Credentials:**
- Username: `sora`
- Password: `sora`

> ⚠️ **Change these immediately after first login!**

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  AWS EC2 Instance               │
│                                                 │
│  ┌──────────────┐  ┌──────────────┐            │
│  │   Frontend   │  │   Backend    │            │
│  │  (React)     │  │  (Node.js)   │            │
│  │  Port: 8080  │  │  Port: 3001  │            │
│  └──────────────┘  └──────────────┘            │
│                                                 │
│  ┌──────────────┐  ┌──────────────┐            │
│  │Trust Engine  │  │   MongoDB    │            │
│  │  (Python)    │  │  Port: 27017 │            │
│  │  Port: 5000  │  │              │            │
│  └──────────────┘  └──────────────┘            │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Requirements

### Minimum EC2 Instance:
- **Type**: t2.medium
- **vCPUs**: 2
- **RAM**: 4 GB
- **Storage**: 30 GB
- **OS**: Ubuntu 22.04 LTS

### Recommended for Production:
- **Type**: t3.large
- **vCPUs**: 2
- **RAM**: 8 GB
- **Storage**: 50 GB

---

## Security Group Configuration

| Type | Protocol | Port | Source | Description |
|------|----------|------|--------|-------------|
| SSH | TCP | 22 | Your IP | SSH access |
| HTTP | TCP | 80 | 0.0.0.0/0 | HTTP |
| HTTPS | TCP | 443 | 0.0.0.0/0 | HTTPS |
| Custom | TCP | 3001 | 0.0.0.0/0 | Backend API |
| Custom | TCP | 5000 | 0.0.0.0/0 | Trust Engine |
| Custom | TCP | 8080 | 0.0.0.0/0 | Frontend |

---

## Maintenance Commands

```bash
# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Stop services
docker-compose -f docker-compose.prod.yml down

# Update application
git pull && docker-compose -f docker-compose.prod.yml up -d --build

# Backup database
docker-compose -f docker-compose.prod.yml exec mongodb mongodump --out /tmp/backup
```

---

## Monitoring

### Check Service Status:
```bash
docker-compose -f docker-compose.prod.yml ps
```

### View Resource Usage:
```bash
docker stats
```

### Health Checks:
```bash
# Backend
curl http://localhost:3001/health

# Trust Engine
curl http://localhost:5000/health
```

---

## Troubleshooting

### Services not starting?
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs

# Restart specific service
docker-compose -f docker-compose.prod.yml restart backend
```

### Cannot connect to application?
1. Check EC2 Security Group rules
2. Verify services are running: `docker ps`
3. Check firewall: `sudo ufw status`

### Database connection failed?
```bash
# Check MongoDB logs
docker-compose -f docker-compose.prod.yml logs mongodb

# Test connection
docker-compose -f docker-compose.prod.yml exec mongodb mongosh --eval "db.adminCommand('ping')"
```

---

## Cost Estimate

**Monthly AWS Costs:**
- t2.medium: ~$45/month
- t3.large: ~$74/month

> 💡 Free tier available for new AWS accounts (12 months)

---

## License

MIT License - See LICENSE file for details
