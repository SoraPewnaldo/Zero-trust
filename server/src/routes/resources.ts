import express from 'express';
import { getResources, getResourceById } from '../controllers/resourceController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All resource routes require authentication
router.use(authenticateToken);

router.get('/', getResources);
router.get('/:resourceId', getResourceById);

export default router;
