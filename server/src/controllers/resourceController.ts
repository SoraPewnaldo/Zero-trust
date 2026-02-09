import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { Resource } from '../models/Resource.js';

/**
 * Get all active resources available to the user
 */
export const getResources = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userRole = req.user!.role;

        const resources = await Resource.find({
            status: 'active',
            allowedRoles: userRole,
        }).select('resourceId name description resourceType environment sensitivity requiredTrustScore mfaRequired');

        res.json({ resources });
    } catch (error) {
        console.error('Get resources error:', error);
        res.status(500).json({ error: 'Failed to get resources' });
    }
};

/**
 * Get resource by ID
 */
export const getResourceById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { resourceId } = req.params;

        const resource = await Resource.findById(resourceId);
        if (!resource) {
            res.status(404).json({ error: 'Resource not found' });
            return;
        }

        // Check if user role is allowed
        if (!resource.allowedRoles.includes(req.user!.role)) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        res.json({ resource });
    } catch (error) {
        console.error('Get resource error:', error);
        res.status(500).json({ error: 'Failed to get resource' });
    }
};
