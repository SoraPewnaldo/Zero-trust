import express from 'express';
import { getScanHistory, getDevices, getUserStats } from '../controllers/userController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All user routes require authentication
router.use(authenticateToken);

router.get('/scans', getScanHistory);
router.get('/devices', getDevices);
router.get('/stats', getUserStats);

export default router;
