import dotenv from 'dotenv';
dotenv.config();

const INSECURE_JWT_SECRETS = [
  'fallback-secret-key',
  'your-super-secret-jwt-key-change-this-in-production',
  'dev_secret_key_change_in_prod',
  'secret',
  'changeme'
];

const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';

if (process.env.NODE_ENV === 'production' && INSECURE_JWT_SECRETS.includes(jwtSecret)) {
  console.error('❌ FATAL: JWT_SECRET is set to an insecure default value in production! Refusing to start.');
  process.exit(1);
}

if (INSECURE_JWT_SECRETS.includes(jwtSecret)) {
  console.warn('⚠️  WARNING: JWT_SECRET is using an insecure default. Set a strong secret in .env before deploying.');
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/zeroiam'
  },
  jwt: {
    secret: jwtSecret,
    expiresIn: process.env.JWT_EXPIRES_IN || '8h'
  },
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()) : ['http://localhost:5173']
  },
  trustEngine: {
    url: process.env.TRUST_ENGINE_URL || 'http://127.0.0.1:5000/scan',
    timeout: parseInt(process.env.TRUST_ENGINE_TIMEOUT || '8000', 10)
  },
  // Express body size limits
  bodyLimit: '256kb'
};