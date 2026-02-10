import { describe, it, expect } from 'vitest';

describe('Health Check API', () => {
    it('should have correct environment variables', () => {
        expect(process.env.NODE_ENV).toBe('test');
        expect(process.env.JWT_SECRET).toBeDefined();
        expect(process.env.MONGODB_URI).toBeDefined();
    });

    it('should validate JWT secret is not empty', () => {
        const jwtSecret = process.env.JWT_SECRET;
        expect(jwtSecret).toBeTruthy();
        expect(jwtSecret!.length).toBeGreaterThan(10);
    });
});

describe('MongoDB Connection', () => {
    it('should have valid MongoDB URI format', () => {
        const uri = process.env.MONGODB_URI;
        expect(uri).toBeDefined();
        expect(uri).toContain('mongodb://');
    });
});
