# Deployment Guide for SoraIAM

This guide explains how to host your SoraIAM application on a Virtual Private Server (VPS) like DigitalOcean, Linode, AWS EC2, or Hetzner.

Your application is containerized with Docker, which makes deployment straightforward.

## Prerequisites

1.  **A VPS Server**: Recommended specs: 2 vCPUs, 4GB RAM (to run MongoDB, Node, Python, and React build comfortably). OS: Ubuntu 22.04 LTS.
2.  **Domain Name** (Optional but recommended): e.g., `myapp.com`.
3.  **Git Repository**: Your code should be pushed to GitHub/GitLab.

## Step 1: Prepare the Server

Connect to your server via SSH:
```bash
ssh root@your-server-ip
```

Update packages and install Docker:
```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Start Docker
systemctl start docker
systemctl enable docker

# Install Docker Compose (if not included)
apt install -y docker-compose-plugin
```

## Step 2: Deploy the Application

1.  **Clone the Repository**:
    ```bash
    git clone https://your-github-repo-url.git app
    cd app
    ```

2.  **Configure Environment Variables**:
    Create a `.env` file for production secrets.
    ```bash
    nano .env
    ```
    Paste your configuration (adjust values for production):
    ```env
    # Backend
    PORT=3001
    NODE_ENV=production
    MONGODB_URI=mongodb://admin:securepassword@mongodb:27017/soraiam?authSource=admin
    # Generate a strong secret: openssl rand -base64 32
    JWT_SECRET=your-production-secret-key-here
    JWT_EXPIRES_IN=24h
    CORS_ORIGIN=http://your-domain.com

    # Database
    MONGO_INITDB_ROOT_USERNAME=admin
    MONGO_INITDB_ROOT_PASSWORD=securepassword
    ```

    **Important**: Update `docker-compose.yml` environment variables to use these values or reference the `.env` file if needed. Currently, `docker-compose.yml` has some hardcoded defaults—ensure you override `MONGO_INITDB_ROOT_PASSWORD` and `MONGODB_URI` to match. 

3.  **Start the Services**:
    Build and run the containers in the background.
    ```bash
    docker compose up -d --build
    ```

4.  **Verify Status**:
    Check if all containers are running:
    ```bash
    docker compose ps
    ```
    View logs if something fails:
    ```bash
    docker compose logs -f
    ```

## Step 3: Access the Application

Your application is now running on port **80**.
- **Frontend**: `http://your-server-ip`
- **Backend API**: `http://your-server-ip/api` (managed by Nginx proxy)

## Step 4: Setup SSL (HTTPS) with Nginx on Host (Recommended)

To serve your app securely over HTTPS with a domain:

1.  **Install Nginx on the host**:
    ```bash
    apt install -y nginx certbot python3-certbot-nginx
    ```

2.  **Configure Nginx Reverse Proxy**:
    Create a config file: `/etc/nginx/sites-available/soraiam`
    ```bash
    nano /etc/nginx/sites-available/soraiam
    ```
    Content:
    ```nginx
    server {
        # Replace with your domain
        server_name your-domain.com;

        location / {
            # Points to your Docker Frontend container running on port 80
            proxy_pass http://localhost:80;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
    ```

3.  **Enable Site**:
    ```bash
    ln -s /etc/nginx/sites-available/soraiam /etc/nginx/sites-enabled/
    nginx -t
    systemctl reload nginx
    ```

4.  **Get SSL Cert**:
    ```bash
    certbot --nginx -d your-domain.com
    ```

Now your app is secure at `https://your-domain.com`!

## Architectural Changes Made (Why this works)

- **Relative API Paths**: I updated `src/lib/api.ts` to use relative paths (`/api`). This allows the frontend to talk to the backend on the same domain, avoiding CORS issues entirely.
- **Nginx Proxy**: I added a production proxy to `nginx.conf` so any request to `/api` is seamlessly forwarded to the backend container.
- **Vite Proxy**: I configured `vite.config.ts` to proxy requests locally, so your development environment mirrors production.
