
# Use python slim image
FROM python:3.9-slim

# Install system dependencies
# nmap is required for port scanning
# osquery is not easily installed in slim debian without adding repos, 
# so we rely on the fallback simulation or install it if critical.
# For now, just nmap.
RUN apt-get update && apt-get install -y \
    nmap \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements
COPY requirements.txt .

# Install python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 5000

# Run the application
CMD ["python", "main.py"]
