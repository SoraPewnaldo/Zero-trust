# Development Dockerfile for backend (Node/Express)
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code (will be overridden by volume mount)
COPY . .

# Expose backend port
EXPOSE 3001

# Run using Node.js directly (plain JavaScript, no TypeScript compiler needed)
CMD ["npm", "run", "dev"]
