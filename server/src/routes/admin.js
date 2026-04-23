import express from 'express';
import { getDashboardStats, getScanLogs, getUsers, getUserDetail, createUser, deleteUser, updateUser } from '../controllers/adminController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateToken, requireRole('super_admin', 'security_analyst', 'resource_manager'));
router.get('/stats', getDashboardStats);
router.get('/scans', getScanLogs);
router.get('/users', getUsers);
router.post('/users', createUser);
router.get('/users/:userId', getUserDetail);
router.put('/users/:userId', updateUser);
router.delete('/users/:userId', deleteUser);
export default router;