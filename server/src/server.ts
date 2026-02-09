import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { connectDatabase } from './config/database.js';
import { errorHandler } from './middleware/errorHandler.js';

// Import routes
import authRoutes from './routes/auth.js';
import verificationRoutes from './routes/verification.js';
import adminRoutes from './routes/admin.js';
import userRoutes from './routes/user.js';
import resourceRoutes from './routes/resources.js';

const app = express();

// Middleware
app.use(cors({
    origin: config.cors.origin,
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/verify', verificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/resources', resourceRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const startServer = async () => {
    try {
        // Connect to database
        await connectDatabase();

        // Start listening
        app.listen(config.port, () => {
            console.log('\n🚀 SoraIAM Backend Server');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`📡 Server running on port ${config.port}`);
            console.log(`🌍 Environment: ${config.env}`);
            console.log(`🔗 API URL: http://localhost:${config.port}`);
            console.log(`🗄️  MongoDB: Connected`);
            console.log(`🔐 CORS Origin: ${config.cors.origin}`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('\n📚 Available endpoints:');
            console.log('   POST   /api/auth/login');
            console.log('   POST   /api/auth/logout');
            console.log('   GET    /api/auth/me');
            console.log('   POST   /api/verify/scan');
            console.log('   POST   /api/verify/mfa');
            console.log('   GET    /api/verify/status/:scanId');
            console.log('   GET    /api/admin/stats');
            console.log('   GET    /api/admin/scans');
            console.log('   GET    /api/admin/users');
            console.log('   GET    /api/admin/users/:userId');
            console.log('   GET    /api/user/scans');
            console.log('   GET    /api/user/devices');
            console.log('   GET    /api/user/stats');
            console.log('   GET    /api/resources');
            console.log('\n✅ Server ready to accept requests\n');
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Handle shutdown gracefully
process.on('SIGTERM', () => {
    console.log('\n⚠️  SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n⚠️  SIGINT received, shutting down gracefully...');
    process.exit(0);
});

// Start the server
startServer();
