import express from 'express';
import {
    getDashboardStats,
    getScanLogs,
    getUsers,
    getUserDetail,
} from '../controllers/adminController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateToken, requireRole('admin'));

router.get('/stats', getDashboardStats);
router.get('/scans', getScanLogs);
router.get('/users', getUsers);
router.get('/users/:userId', getUserDetail);

export default router;
