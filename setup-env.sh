#!/bin/bash
cd ~/apps/Zero-trust

# Generate secrets
JWT_SECRET=$(openssl rand -base64 32)
MONGO_PASS=$(openssl rand -base64 24)

# Create environment file
cat > .env.production << EOF
# MongoDB
MONGODB_URI=mongodb://mongodb:27017/soraiam
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=$MONGO_PASS

# Backend  
NODE_ENV=production
PORT=3001
JWT_SECRET=$JWT_SECRET
CORS_ORIGIN=http://13.233.151.217:8080

# Trust Engine
TRUST_ENGINE_URL=http://trust-engine:5000

# Frontend
VITE_API_URL=http://13.233.151.217:3001/api
EOF

echo "✓ Environment file created"
echo "MongoDB Password: $MONGO_PASS"
echo "JWT Secret: $JWT_SECRET"
