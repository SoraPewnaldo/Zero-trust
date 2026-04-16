# Trust Engine — Python Flask (PDP)
FROM python:3.11-slim

# Install system dependencies: nmap for port scanning, curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
    nmap \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser

WORKDIR /app

# Copy and install Python dependencies first (better layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Change ownership to non-root user
RUN chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 5000

# -u forces unbuffered Python output so logs appear immediately in docker logs
CMD ["python", "-u", "main.py"]
