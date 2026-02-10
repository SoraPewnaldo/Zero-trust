#!/bin/bash

# Zero-Trust Application - Quick Deployment Script for AWS EC2
# This script automates the deployment process

set -e  # Exit on error

echo "🚀 Zero-Trust Application Deployment Script"
echo "==========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    print_error "Please do not run this script as root"
    exit 1
fi

# Step 1: Update system
echo "Step 1: Updating system packages..."
sudo apt update && sudo apt upgrade -y
print_success "System updated"

# Step 2: Install Docker
echo ""
echo "Step 2: Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    print_success "Docker installed"
else
    print_warning "Docker already installed"
fi

# Step 3: Install Docker Compose
echo ""
echo "Step 3: Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    print_success "Docker Compose installed"
else
    print_warning "Docker Compose already installed"
fi

# Step 4: Install Git
echo ""
echo "Step 4: Installing Git..."
if ! command -v git &> /dev/null; then
    sudo apt install git -y
    print_success "Git installed"
else
    print_warning "Git already installed"
fi

# Step 5: Clone repository
echo ""
echo "Step 5: Cloning repository..."
APP_DIR="/home/$USER/apps"
mkdir -p $APP_DIR
cd $APP_DIR

if [ -d "Zero-trust" ]; then
    print_warning "Repository already exists, pulling latest changes..."
    cd Zero-trust
    git pull
else
    git clone https://github.com/SoraPewnaldo/Zero-trust.git
    cd Zero-trust
    print_success "Repository cloned"
fi

# Step 6: Create environment file
echo ""
echo "Step 6: Creating environment configuration..."

if [ ! -f ".env.production" ]; then
    # Generate secrets
    JWT_SECRET=$(openssl rand -base64 32)
    MONGO_PASSWORD=$(openssl rand -base64 24)
    
    # Get EC2 public IP
    EC2_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
    
    cat > .env.production << EOF
# MongoDB
MONGODB_URI=mongodb://mongodb:27017/soraiam
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=$MONGO_PASSWORD

# Backend
NODE_ENV=production
PORT=3001
JWT_SECRET=$JWT_SECRET
CORS_ORIGIN=http://$EC2_IP:8080

# Trust Engine
TRUST_ENGINE_URL=http://trust-engine:5000

# Frontend
VITE_API_URL=http://$EC2_IP:3001/api
EOF
    
    print_success "Environment file created"
    print_warning "MongoDB Password: $MONGO_PASSWORD"
    print_warning "JWT Secret: $JWT_SECRET"
    print_warning "Please save these credentials securely!"
else
    print_warning "Environment file already exists, skipping..."
fi

# Step 7: Deploy application
echo ""
echo "Step 7: Deploying application..."
docker-compose -f docker-compose.prod.yml up -d --build
print_success "Application deployed"

# Step 8: Wait for services to start
echo ""
echo "Step 8: Waiting for services to start..."
sleep 10

# Step 9: Initialize database
echo ""
echo "Step 9: Initializing database..."
docker-compose -f docker-compose.prod.yml exec -T backend npm run init-db || print_warning "Database initialization may have failed, check logs"
print_success "Database initialized"

# Step 10: Display status
echo ""
echo "Step 10: Checking service status..."
docker-compose -f docker-compose.prod.yml ps

# Get EC2 public IP
EC2_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)

echo ""
echo "==========================================="
print_success "Deployment Complete!"
echo "==========================================="
echo ""
echo "Your application is now running at:"
echo "  Frontend:     http://$EC2_IP:8080"
echo "  Backend API:  http://$EC2_IP:3001/api"
echo "  Trust Engine: http://$EC2_IP:5000"
echo ""
echo "Default Login Credentials:"
echo "  Username: sora"
echo "  Password: sora"
echo ""
print_warning "IMPORTANT: Change default credentials after first login!"
echo ""
echo "Useful Commands:"
echo "  View logs:    docker-compose -f docker-compose.prod.yml logs -f"
echo "  Restart:      docker-compose -f docker-compose.prod.yml restart"
echo "  Stop:         docker-compose -f docker-compose.prod.yml down"
echo "  Update:       cd $APP_DIR/Zero-trust && git pull && docker-compose -f docker-compose.prod.yml up -d --build"
echo ""
print_warning "Note: You may need to log out and back in for Docker group changes to take effect"
echo ""
