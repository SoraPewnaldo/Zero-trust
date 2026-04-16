# Frontend — Vite/React (Development)
FROM node:20-alpine

# Create a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Install dependencies first for better layer caching
COPY package*.json ./
RUN npm install

# Copy source code (overridden by volume mount in compose, kept for standalone use)
COPY . .

# Change ownership
RUN chown -R appuser:appgroup /app
USER appuser

# Expose Vite's default port
EXPOSE 5173

# Start Vite in dev mode with host exposed for Docker access
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
