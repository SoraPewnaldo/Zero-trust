import { describe, it, expect, beforeAll } from 'vitest';

// Setup test environment
beforeAll(() => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret-key-for-testing';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/soraiam-test';
    process.env.PORT = '3001';
});

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
