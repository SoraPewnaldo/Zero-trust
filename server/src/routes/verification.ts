import express from 'express';
import { initiateScan, verifyMFA, getScanStatus } from '../controllers/verificationController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All verification routes require authentication
router.post('/scan', authenticateToken, initiateScan);
router.post('/mfa', authenticateToken, verifyMFA);
router.get('/status/:scanId', authenticateToken, getScanStatus);

export default router;
