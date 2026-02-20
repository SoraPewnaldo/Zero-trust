import bcrypt from 'bcryptjs';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { User } from '../models/User.js';
import { Resource } from '../models/Resource.js';
import { TrustPolicy } from '../models/TrustPolicy.js';

async function initializeDatabase() {
    try {
        console.log('🚀 Starting database initialization...');

        // Connect to database
        await connectDatabase();

        // Clear existing data (optional - comment out in production)
        console.log('🗑️  Clearing existing data...');
        await User.deleteMany({});
        await Resource.deleteMany({});
        await TrustPolicy.deleteMany({});

        // Create default users
        console.log('👥 Creating default users...');

        // Admin user
        const adminPassword = await bcrypt.hash('sora', 10);

        const admin = await User.create({
            username: 'sora',
            email: 'sora@soraiam.com',
            passwordHash: adminPassword,
            role: 'admin',
            firstName: 'Sora',
            lastName: 'Administrator',
            department: 'IT Security',
            status: 'active',
            mfaEnabled: false,
        });

        // Employee users
        const employees = await User.create([
            {
                username: 'sarah.johnson',
                email: 'sarah.johnson@soraiam.com',
                passwordHash: await bcrypt.hash('password123', 10),
                role: 'employee',
                firstName: 'Sarah',
                lastName: 'Johnson',
                department: 'Engineering',
                status: 'active',
                mfaEnabled: false,
            },
            {
                username: 'michael.chen',
                email: 'michael.chen@soraiam.com',
                passwordHash: await bcrypt.hash('password123', 10),
                role: 'employee',
                firstName: 'Michael',
                lastName: 'Chen',
                department: 'Engineering',
                status: 'active',
                mfaEnabled: false,
            },
            {
                username: 'emily.rodriguez',
                email: 'emily.rodriguez@soraiam.com',
                passwordHash: await bcrypt.hash('password123', 10),
                role: 'employee',
                firstName: 'Emily',
                lastName: 'Rodriguez',
                department: 'Sales',
                status: 'active',
                mfaEnabled: false,
            },
            {
                username: 'david.kim',
                email: 'david.kim@soraiam.com',
                passwordHash: await bcrypt.hash('password123', 10),
                role: 'employee',
                firstName: 'David',
                lastName: 'Kim',
                department: 'Marketing',
                status: 'active',
                mfaEnabled: false,
            },
            {
                username: 'jessica.patel',
                email: 'jessica.patel@soraiam.com',
                passwordHash: await bcrypt.hash('password123', 10),
                role: 'employee',
                firstName: 'Jessica',
                lastName: 'Patel',
                department: 'Human Resources',
                status: 'active',
                mfaEnabled: false,
            },
            {
                username: 'james.wilson',
                email: 'james.wilson@soraiam.com',
                passwordHash: await bcrypt.hash('password123', 10),
                role: 'employee',
                firstName: 'James',
                lastName: 'Wilson',
                department: 'Finance',
                status: 'active',
                mfaEnabled: false,
            },
        ]);

        console.log('✅ Created users:', [admin.username, ...employees.map(e => e.username)]);

        // Create default resources
        console.log('🔐 Creating default resources...');

        const resources = await Resource.create([
            {
                resourceId: 'internal-dashboard',
                name: 'Internal Web Dashboard',
                description: 'Company intranet and internal tools',
                resourceType: 'dashboard',
                environment: 'on-prem',
                sensitivity: 'standard',
                sensitivityScore: 3,
                requiredTrustScore: 60,
                mfaRequired: false,
                allowedRoles: ['employee', 'admin'],
                status: 'active',
                metadata: {
                    owner: 'IT Department',
                    dataClassification: 'internal',
                },
            },
            {
                resourceId: 'git-repository',
                name: 'Git Repository',
                description: 'Source code repository',
                resourceType: 'repository',
                environment: 'cloud',
                cloudProvider: 'aws',
                sensitivity: 'elevated',
                sensitivityScore: 7,
                requiredTrustScore: 70,
                mfaRequired: false,
                allowedRoles: ['employee', 'admin'],
                status: 'active',
                metadata: {
                    owner: 'Engineering',
                    dataClassification: 'confidential',
                },
            },
            {
                resourceId: 'prod-console',
                name: 'Production Cloud Console',
                description: 'AWS production environment console',
                resourceType: 'console',
                environment: 'cloud',
                cloudProvider: 'aws',
                sensitivity: 'critical',
                sensitivityScore: 10,
                requiredTrustScore: 80,
                mfaRequired: true,
                allowedRoles: ['admin'],
                status: 'active',
                metadata: {
                    owner: 'DevOps',
                    dataClassification: 'restricted',
                    complianceRequirements: ['SOC2', 'ISO27001'],
                },
            },
            {
                resourceId: 'hr-portal',
                name: 'HR Portal',
                description: 'Employee records and payroll',
                resourceType: 'dashboard',
                environment: 'cloud',
                cloudProvider: 'azure',
                sensitivity: 'elevated',
                sensitivityScore: 8,
                requiredTrustScore: 75,
                mfaRequired: false,
                allowedRoles: ['admin'],
                status: 'active',
                metadata: {
                    owner: 'Human Resources',
                    dataClassification: 'confidential',
                    complianceRequirements: ['GDPR', 'HIPAA'],
                },
            },
        ]);

        console.log('✅ Created resources:', resources.map(r => r.name));

        // Create default trust policy
        console.log('📋 Creating default trust policy...');

        const policy = await TrustPolicy.create({
            policyId: 'default-v1',
            name: 'Default Trust Policy',
            description: 'Standard zero-trust evaluation policy',
            version: '1.0.0',
            status: 'active',
            thresholds: {
                allowThreshold: 70,
                mfaThreshold: 40,
                blockThreshold: 40,
            },
            factorWeights: {
                deviceTrust: 30,
                networkSecurity: 25,
                resourceSensitivity: 20,
                userBehavior: 15,
                timeContext: 10,
            },
            deviceScoring: {
                managed: 40,
                personal: 10,
                unverified: -20,
                compromised: -50,
            },
            networkScoring: {
                corporate: 30,
                home: 15,
                public: -10,
                vpn: 20,
            },
            resourceMultipliers: {
                standard: 1.0,
                elevated: 1.3,
                critical: 1.5,
            },
            behavioralRules: {
                newDevicePenalty: -15,
                unusualLocationPenalty: -10,
                offHoursPenalty: -5,
                rapidAccessPenalty: -10,
            },
            mfaRules: {
                alwaysRequireForCritical: true,
                requireForNewDevice: true,
                requireForUnusualLocation: false,
                requireAfterDays: 30,
            },
            appliesTo: {
                roles: ['employee', 'admin'],
                resources: [],
                departments: [],
            },
            effectiveFrom: new Date(),
        });

        console.log('✅ Created trust policy:', policy.name);

        console.log('\n🎉 Database initialization complete!');
        console.log('\n📝 User credentials:');
        console.log('   Admin:           username: sora              | password: sora');
        console.log('   Sarah Johnson:   username: sarah.johnson     | password: password123');
        console.log('   Michael Chen:    username: michael.chen      | password: password123');
        console.log('   Emily Rodriguez: username: emily.rodriguez   | password: password123');
        console.log('   David Kim:       username: david.kim         | password: password123');
        console.log('   Jessica Patel:   username: jessica.patel    | password: password123');
        console.log('   James Wilson:    username: james.wilson      | password: password123');
        console.log('\n🔐 Resources created:', resources.length);
        console.log('📊 Trust policy active:', policy.policyId);

        await disconnectDatabase();
        process.exit(0);
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        process.exit(1);
    }
}

// Run initialization
initializeDatabase();
