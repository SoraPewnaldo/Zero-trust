# SoraIAM Backend Server

Zero Trust Identity & Access Management Backend API

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your MongoDB connection string
```

3. Initialize database:
```bash
npm run init-db
```

4. Start development server:
```bash
npm run dev
```

## Default Credentials

After running `npm run init-db`:

- **Admin**: username: `admin` | password: `admin`
- **Employee**: username: `employee` | password: `employee`
- **Alice**: username: `alice` | password: `alice123`
- **Bob**: username: `bob` | password: `bob123`

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Verification
- `POST /api/verify/scan` - Initiate trust scan
- `POST /api/verify/mfa` - Verify MFA code
- `GET /api/verify/status/:scanId` - Get scan status

### User
- `GET /api/user/scans` - Get scan history
- `GET /api/user/devices` - Get registered devices
- `GET /api/user/stats` - Get user statistics

### Admin (requires admin role)
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/scans` - All scan logs
- `GET /api/admin/users` - All users
- `GET /api/admin/users/:userId` - User detail

### Resources
- `GET /api/resources` - List available resources
- `GET /api/resources/:resourceId` - Get resource by ID

## Environment Variables

- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3001)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRES_IN` - Token expiration time
- `CORS_ORIGIN` - Allowed CORS origin

## MongoDB Setup

### Option 1: Local MongoDB
Install MongoDB locally and use:
```
MONGODB_URI=mongodb://localhost:27017/soraiam
```

### Option 2: MongoDB Atlas (Cloud)
1. Create free account at mongodb.com/atlas
2. Create cluster
3. Get connection string
4. Update MONGODB_URI in .env

### Option 3: Docker
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run init-db` - Initialize database with default data
