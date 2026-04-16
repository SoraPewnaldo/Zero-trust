# Backend — Node.js + Express
FROM node:20-alpine

# Create a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Install dependencies first (better layer caching, install as root)
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Switch to non-root user
RUN chown -R appuser:appgroup /app
USER appuser

# Expose backend port
EXPOSE 3001

# Use node directly (plain JS, no build step needed)
CMD ["node", "src/server.js"]
