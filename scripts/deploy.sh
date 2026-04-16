#!/bin/bash
# ============================================================
# ZeroIAM — AWS EC2 One-Command Deploy Script
# ============================================================
# Run this on a fresh Ubuntu 22.04 EC2 instance:
#   curl -fsSL https://raw.githubusercontent.com/SoraPewnaldo/Zero-trust/main/scripts/deploy.sh | bash
# Or after cloning:
#   bash scripts/deploy.sh
# ============================================================

set -euo pipefail

# ── Colors ─────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

info()    { echo -e "${CYAN}[INFO]${NC}  $1"; }
success() { echo -e "${GREEN}[OK]${NC}    $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

echo ""
echo -e "${CYAN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║       ZeroIAM — AWS Deploy Script         ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════╝${NC}"
echo ""

# ── 1. Update system ───────────────────────────────────────
info "Updating system packages..."
sudo apt-get update -qq && sudo apt-get upgrade -y -qq
success "System updated"

# ── 2. Install Docker ──────────────────────────────────────
if command -v docker &>/dev/null; then
    success "Docker already installed ($(docker --version))"
else
    info "Installing Docker..."
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker "$USER"
    success "Docker installed"
fi

# ── 3. Install Docker Compose plugin ───────────────────────
if docker compose version &>/dev/null 2>&1; then
    success "Docker Compose already installed"
else
    info "Installing Docker Compose plugin..."
    sudo apt-get install -y -qq docker-compose-plugin
    success "Docker Compose installed"
fi

# ── 4. Clone / update repository ───────────────────────────
REPO_DIR="$HOME/zeroiam"
REPO_URL="https://github.com/SoraPewnaldo/Zero-trust.git"

if [ -d "$REPO_DIR/.git" ]; then
    info "Repository exists — pulling latest changes..."
    cd "$REPO_DIR"
    git pull
    success "Repository updated"
else
    info "Cloning repository..."
    git clone "$REPO_URL" "$REPO_DIR"
    cd "$REPO_DIR"
    success "Repository cloned to $REPO_DIR"
fi

# ── 5. Set up production environment ───────────────────────
cd "$REPO_DIR"

if [ -f ".env.prod" ]; then
    warn ".env.prod already exists — skipping generation (edit manually if needed)"
else
    info "Generating .env.prod from template..."

    # Detect public IP
    PUBLIC_IP=$(curl -s --max-time 5 https://api.ipify.org 2>/dev/null || echo "YOUR_EC2_IP")

    # Generate a strong JWT secret
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))" 2>/dev/null \
        || openssl rand -hex 64 2>/dev/null \
        || cat /dev/urandom | tr -dc 'a-f0-9' | fold -w 128 | head -n 1)

    cp .env.prod.example .env.prod
    sed -i "s|<CHANGE_THIS_TO_A_STRONG_64_CHAR_HEX_SECRET>|${JWT_SECRET}|g" .env.prod
    sed -i "s|<YOUR_EC2_PUBLIC_IP_OR_DOMAIN>|${PUBLIC_IP}|g" .env.prod

    success ".env.prod created with auto-generated JWT secret"
    info "  Public IP detected: ${PUBLIC_IP}"
    warn "  Review .env.prod and update CORS_ORIGIN if the IP is wrong: nano .env.prod"
fi

# ── 6. Build and start containers ──────────────────────────
info "Building Docker images (this takes ~3-5 minutes first time)..."
docker compose -f docker-compose.prod.yml build --no-cache

info "Starting all containers..."
docker compose -f docker-compose.prod.yml up -d

# ── 7. Wait for backend to be healthy ──────────────────────
info "Waiting for backend to be ready..."
MAX_WAIT=90
WAITED=0
until curl -sf http://localhost:3001/health > /dev/null 2>&1; do
    sleep 3
    WAITED=$((WAITED + 3))
    if [ "$WAITED" -ge "$MAX_WAIT" ]; then
        error "Backend did not become healthy within ${MAX_WAIT}s. Check: docker compose -f docker-compose.prod.yml logs backend"
    fi
    echo -n "."
done
echo ""
success "Backend is healthy"

# ── 8. Seed the database ───────────────────────────────────
info "Seeding database with demo users and resources..."
docker compose -f docker-compose.prod.yml exec backend node src/scripts/initDb.js
success "Database seeded"

# ── 9. Summary ─────────────────────────────────────────────
PUBLIC_IP=$(curl -s --max-time 5 https://api.ipify.org 2>/dev/null || echo "YOUR_EC2_IP")

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          ZeroIAM is LIVE!                             ║${NC}"
echo -e "${GREEN}╠═══════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║  Frontend:    http://${PUBLIC_IP}                     ║${NC}"
echo -e "${GREEN}║  API Health:  http://${PUBLIC_IP}/health               ║${NC}"
echo -e "${GREEN}╠═══════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║  Admin Login:    sora / sora                          ║${NC}"
echo -e "${GREEN}║  Employee Login: sarah.johnson / password123          ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo "  View logs:     docker compose -f docker-compose.prod.yml logs -f"
echo "  Stop:          docker compose -f docker-compose.prod.yml down"
echo "  Restart:       docker compose -f docker-compose.prod.yml restart"
echo "  Reset DB:      docker compose -f docker-compose.prod.yml exec backend node src/scripts/initDb.js"
echo "  Check health:  docker compose -f docker-compose.prod.yml ps"
echo ""
