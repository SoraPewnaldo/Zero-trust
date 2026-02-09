# SoraIAM - Zero Trust Identity and Access Management

![SoraIAM](https://img.shields.io/badge/SoraIAM-Zero%20Trust%20IAM-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Version](https://img.shields.io/badge/version-1.0.0-orange)

**SoraIAM** is an enterprise-grade Zero Trust Identity and Access Management platform that provides continuous verification, context-aware access control, and real-time trust scoring for modern organizations.

## 🚀 Features

- **Zero Trust Architecture**: Never trust, always verify approach to security
- **Real-time Trust Scoring**: Dynamic trust evaluation based on multiple factors
- **Context-Aware Access Control**: Intelligent access decisions based on user, device, location, and behavior
- **Continuous Verification**: Ongoing authentication and authorization checks
- **Device Fingerprinting**: Advanced device identification and tracking
- **Behavioral Analytics**: User behavior monitoring and anomaly detection
- **Admin Dashboard**: Comprehensive management interface for administrators
- **User Dashboard**: Self-service portal for end users
- **Audit Logging**: Complete audit trail of all access decisions
- **Multi-Factor Authentication**: Enhanced security with MFA support

## 📋 Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [User Credentials](#user-credentials)
- [API Documentation](#api-documentation)
- [Docker Deployment](#docker-deployment)
- [Project Structure](#project-structure)
- [Contributing](#contributing)

## 🏗️ Architecture

SoraIAM follows a modern microservices architecture with the following components:

```
┌─────────────────┐
│   React Frontend │
│   (Port 8080)    │
└────────┬─────────┘
         │
         ▼
┌─────────────────┐
│   Nginx Proxy   │
│   (Port 80)     │
└────────┬─────────┘
         │
         ▼
┌─────────────────┐
│  Express.js API │
│   (Port 3001)   │
└────────┬─────────┘
         │
         ▼
┌─────────────────┐
│    MongoDB      │
│   (Port 27017)  │
└─────────────────┘
```

### Key Components

- **Frontend**: React + TypeScript + Vite + shadcn/ui + Tailwind CSS
- **Backend**: Node.js + Express.js + TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based authentication with refresh tokens
- **Trust Engine**: Real-time trust score calculation based on multiple factors

## 🛠️ Tech Stack

### Frontend
- **React 18.3.1** - UI library
- **TypeScript 5.8.3** - Type-safe JavaScript
- **Vite 5.4.19** - Build tool and dev server
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **shadcn/ui** - High-quality React components
- **React Router 6.30.1** - Client-side routing
- **TanStack Query 5.83.0** - Data fetching and caching
- **Recharts 2.15.4** - Charts and data visualization
- **Lucide React** - Icon library

### Backend
- **Node.js** - JavaScript runtime
- **Express.js 4.21.2** - Web framework
- **TypeScript 5.8.3** - Type safety
- **MongoDB** - NoSQL database
- **Mongoose 8.9.4** - MongoDB ODM
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Zod** - Schema validation
- **Winston** - Logging

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Reverse proxy and load balancer
- **GitHub Actions** - CI/CD (optional)

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (v9 or higher) - Comes with Node.js
- **MongoDB** (v6 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **Docker** (optional, for containerized deployment) - [Download](https://www.docker.com/products/docker-desktop)
- **Git** - [Download](https://git-scm.com/downloads)

## 🔧 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/SoraPewnaldo/Zero-trust.git
cd Zero-trust
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Install Backend Dependencies

```bash
cd server
npm install
cd ..
```

### 4. Set Up Environment Variables

Create a `.env` file in the `server` directory:

```bash
cd server
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/soraiam

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:8080

# Trust Score Thresholds
TRUST_SCORE_HIGH=80
TRUST_SCORE_MEDIUM=50
TRUST_SCORE_LOW=30
```

## ⚙️ Configuration

### Frontend Configuration

The frontend is configured via `vite.config.ts`:

```typescript
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  // ... other configurations
});
```

### Backend Configuration

The backend configuration is managed through environment variables and `server/src/config/index.ts`.

## 🚀 Running the Application

### Development Mode

#### Option 1: Run Both Frontend and Backend Together

```bash
npm run dev:all
```

This command starts both the frontend (port 8080) and backend (port 3001) concurrently.

#### Option 2: Run Frontend and Backend Separately

**Terminal 1 - Frontend:**
```bash
npm run dev
```

**Terminal 2 - Backend:**
```bash
cd server
npm run dev
```

### Initialize Database

Before first use, initialize the database with sample data:

```bash
cd server
npm run init-db
```

This creates:
- Admin user (sora/sora)
- 6 employee users
- Sample trust policies
- Sample resources

### Production Mode

#### Build the Application

```bash
# Build frontend
npm run build

# Build backend
cd server
npm run build
```

#### Run Production Build

```bash
# Start backend
cd server
npm start

# Serve frontend (use a static file server)
npx serve -s dist -p 8080
```

## 👥 User Credentials

### Admin Account
- **Username**: `sora`
- **Password**: `sora`
- **Role**: Administrator
- **Access**: Full system access, user management, policy configuration

### Employee Accounts

All employee accounts use the password: `password123`

| Username | Department | Role |
|----------|-----------|------|
| sarah.johnson | Engineering | Employee |
| michael.chen | Engineering | Employee |
| emily.rodriguez | Sales | Employee |
| david.kim | Marketing | Employee |
| jessica.patel | Human Resources | Employee |
| james.wilson | Finance | Employee |

### Application URLs

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/health

## 📚 API Documentation

### Authentication Endpoints

#### POST `/api/auth/login`
Login with username and password.

**Request:**
```json
{
  "username": "sora",
  "password": "sora"
}
```

**Response:**
```json
{
  "token": "jwt-token",
  "refreshToken": "refresh-token",
  "user": {
    "id": "user-id",
    "username": "sora",
    "role": "admin"
  }
}
```

#### POST `/api/auth/refresh`
Refresh access token using refresh token.

#### POST `/api/auth/logout`
Logout and invalidate tokens.

### Verification Endpoints

#### POST `/api/verification/verify`
Perform verification check for a user.

**Request:**
```json
{
  "userId": "user-id",
  "deviceId": "device-id",
  "location": {
    "ip": "192.168.1.1",
    "country": "US"
  }
}
```

#### GET `/api/verification/status/:userId`
Get verification status for a user.

### User Endpoints

#### GET `/api/users`
Get all users (admin only).

#### GET `/api/users/:id`
Get user by ID.

#### PUT `/api/users/:id`
Update user information.

## 🐳 Docker Deployment

### Development with Docker

```bash
docker-compose -f docker-compose.dev.yml up
```

This starts:
- Frontend (http://localhost:8080)
- Backend (http://localhost:3001)
- MongoDB (mongodb://localhost:27017)

### Production with Docker

```bash
docker-compose up -d
```

This starts:
- Nginx reverse proxy (http://localhost:80)
- Frontend container
- Backend container
- MongoDB container

### Docker Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild containers
docker-compose up -d --build

# Remove all containers and volumes
docker-compose down -v
```

## 📁 Project Structure

```
Zero-trust/
├── src/                          # Frontend source code
│   ├── components/               # React components
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── admin/                # Admin-specific components
│   │   └── user/                 # User-specific components
│   ├── contexts/                 # React contexts
│   ├── hooks/                    # Custom React hooks
│   ├── lib/                      # Utility functions
│   │   └── api.ts                # API client
│   ├── pages/                    # Page components
│   ├── App.tsx                   # Main app component
│   └── main.tsx                  # Entry point
├── server/                       # Backend source code
│   ├── src/
│   │   ├── config/               # Configuration files
│   │   ├── controllers/          # Route controllers
│   │   ├── middleware/           # Express middleware
│   │   ├── models/               # Mongoose models
│   │   ├── routes/               # API routes
│   │   ├── services/             # Business logic
│   │   ├── scripts/              # Utility scripts
│   │   ├── types/                # TypeScript types
│   │   └── index.ts              # Server entry point
│   ├── package.json
│   └── tsconfig.json
├── public/                       # Static assets
├── docker-compose.yml            # Production Docker config
├── docker-compose.dev.yml        # Development Docker config
├── Dockerfile                    # Production Dockerfile
├── Dockerfile.dev                # Development Dockerfile
├── nginx.conf                    # Nginx configuration
├── package.json                  # Frontend dependencies
├── vite.config.ts                # Vite configuration
├── tailwind.config.ts            # Tailwind configuration
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # This file
```

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **CORS Protection**: Configurable CORS policies
- **Rate Limiting**: API rate limiting (configurable)
- **Input Validation**: Zod schema validation
- **SQL Injection Prevention**: MongoDB parameterized queries
- **XSS Protection**: React's built-in XSS protection
- **HTTPS Support**: SSL/TLS ready

## 🧪 Testing

```bash
# Run frontend tests
npm test

# Run backend tests
cd server
npm test

# Run tests in watch mode
npm run test:watch
```

## 📊 Monitoring and Logging

- **Winston Logger**: Structured logging with multiple transports
- **Request Logging**: HTTP request/response logging
- **Error Tracking**: Comprehensive error logging
- **Audit Logs**: User action tracking in database

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**SoraPewnaldo**
- GitHub: [@SoraPewnaldo](https://github.com/SoraPewnaldo)
- Twitter: [@SoraPewnaldo](https://twitter.com/SoraPewnaldo)

## 🙏 Acknowledgments

- Built with [React](https://reactjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)

## 📞 Support

For support, email support@soraiam.com or open an issue in the GitHub repository.

---

**Made with ❤️ by SoraPewnaldo**
