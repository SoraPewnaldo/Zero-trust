import UAParser from 'ua-parser-js';
import crypto from 'crypto';
export class ContextDetectionService {
  /**
   * Detect context from request
   */
  static detectContext(req) {
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = this.getClientIp(req);
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    // Parse device info
    const deviceInfo = {
      platform: result.os.name,
      browser: result.browser.name,
      osVersion: result.os.version,
      browserVersion: result.browser.version
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
      deviceFingerprint
    };
  }

  /**
   * Get client IP address
   */
  static getClientIp(req) {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0];
    return ip || req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
  }

  /**
   * Generate device fingerprint
   */
  static generateDeviceFingerprint(userAgent, ipAddress) {
    return crypto.createHash('sha256').update(`${userAgent}-${ipAddress}`).digest('hex').substring(0, 16);
  }

  /**
   * Detect device type
   */
  static detectDeviceType(userAgent) {
    const corporateIndicators = ['CorporateDevice', 'MDM', 'IntuneMAM'];
    const isManaged = corporateIndicators.some(indicator => userAgent.includes(indicator));
    return isManaged ? 'managed' : 'personal';
  }

  /**
   * Detect network type based on IP
   */
  static detectNetworkType(ipAddress) {
    const corporateRanges = ['10.0.', '192.168.1.'];
    const isCorporate = corporateRanges.some(range => ipAddress.startsWith(range));
    if (isCorporate) {
      return 'corporate';
    }
    const homeRanges = ['192.168.', '10.'];
    const isHome = homeRanges.some(range => ipAddress.startsWith(range));
    return isHome ? 'home' : 'public';
  }
}