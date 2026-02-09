import UAParser from 'ua-parser-js';

export interface DetectedContext {
    deviceType: 'managed' | 'personal';
    networkType: 'corporate' | 'home' | 'public';
    ipAddress: string;
    userAgent: string;
    deviceInfo: {
        platform?: string;
        browser?: string;
        osVersion?: string;
        browserVersion?: string;
    };
    deviceFingerprint: string;
}

export class ContextDetectionService {
    /**
     * Detect context from request
     */
    static detectContext(req: any): DetectedContext {
        const userAgent = req.headers['user-agent'] || '';
        const ipAddress = this.getClientIp(req);
        const parser = new UAParser(userAgent);
        const result = parser.getResult();

        // Parse device info
        const deviceInfo = {
            platform: result.os.name,
            browser: result.browser.name,
            osVersion: result.os.version,
            browserVersion: result.browser.version,
        };

        // Generate device fingerprint (simplified)
        const deviceFingerprint = this.generateDeviceFingerprint(userAgent, ipAddress);

        // Detect device type (simplified - in production, check against device registry)
        const deviceType = this.detectDeviceType(userAgent);

        // Detect network type based on IP (simplified)
        const networkType = this.detectNetworkType(ipAddress);

        return {
            deviceType,
            networkType,
            ipAddress,
            userAgent,
            deviceInfo,
            deviceFingerprint,
        };
    }

    /**
     * Get client IP address
     */
    private static getClientIp(req: any): string {
        return (
            req.headers['x-forwarded-for']?.split(',')[0] ||
            req.headers['x-real-ip'] ||
            req.connection?.remoteAddress ||
            req.socket?.remoteAddress ||
            'unknown'
        );
    }

    /**
     * Generate device fingerprint
     */
    private static generateDeviceFingerprint(userAgent: string, ipAddress: string): string {
        // Simplified fingerprint - in production, use more sophisticated methods
        const crypto = require('crypto');
        return crypto
            .createHash('sha256')
            .update(`${userAgent}-${ipAddress}`)
            .digest('hex')
            .substring(0, 16);
    }

    /**
     * Detect device type
     * In production, check against device registry
     */
    private static detectDeviceType(userAgent: string): 'managed' | 'personal' {
        // Simplified logic - check for corporate device indicators
        // In production, maintain a device registry
        const corporateIndicators = ['CorporateDevice', 'MDM', 'IntuneMAM'];
        const isManaged = corporateIndicators.some((indicator) =>
            userAgent.includes(indicator)
        );
        return isManaged ? 'managed' : 'personal';
    }

    /**
     * Detect network type based on IP
     * In production, use IP geolocation and corporate IP ranges
     */
    private static detectNetworkType(ipAddress: string): 'corporate' | 'home' | 'public' {
        // Simplified logic - check against corporate IP ranges
        // In production, maintain corporate IP whitelist

        // Example corporate IP ranges (replace with actual ranges)
        const corporateRanges = ['10.0.', '192.168.1.'];

        const isCorporate = corporateRanges.some((range) => ipAddress.startsWith(range));

        if (isCorporate) {
            return 'corporate';
        }

        // Check for common home network ranges
        const homeRanges = ['192.168.', '10.'];
        const isHome = homeRanges.some((range) => ipAddress.startsWith(range));

        return isHome ? 'home' : 'public';
    }
}
