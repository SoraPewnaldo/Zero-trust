# Development Dockerfile for Vite Frontend
FROM node:18-alpine

WORKDIR /app

# Install dependencies first for better caching
COPY package*.json ./
RUN npm install

# Copy source code (will be overridden by volume mount in compose, but good for standalone testing)
COPY . .

# Expose Vite's default port
EXPOSE 5173

# Start Vite in dev mode with host exposed for Docker
CMD ["npm", "run", "dev", "--", "--host"]
