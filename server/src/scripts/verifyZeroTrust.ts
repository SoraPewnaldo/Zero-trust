
import axios from 'axios';

const API_URL = 'http://127.0.0.1:3001/api';
const PYTHON_PDP_URL = 'http://127.0.0.1:5000/scan';

async function verifyZeroTrust() {
    try {
        console.log('🚀 Starting Verification of Real Zero Trust Engine...');

        // 1. Verify Python PDP is Running
        console.log('🛡️  Checking Python Trust Engine (PDP)...');
        try {
            const pdpRes = await axios.post(PYTHON_PDP_URL, { test: true });
            console.log('✅ Python PDP is ONLINE');
            console.log(`   - Score: ${pdpRes.data.trust_score}`);
            console.log(`   - OS Version: ${pdpRes.data.details.os_version}`);
        } catch (e: any) {
            console.error('❌ Python PDP is OFFLINE or Erroring:', e.message);
            process.exit(1);
        }

        // 2. Login as User
        console.log('🔑 Logging in as user...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            username: 'sarah.johnson',
            password: 'password123'
        });
        const token = loginRes.data.token;
        const headers = { Authorization: `Bearer ${token}` };
        console.log('✅ User logged in successfully');

        // 3. Get Resources
        console.log('📋 Fetching resources...');
        const resourcesRes = await axios.get(`${API_URL}/resources`, { headers });
        let resources = resourcesRes.data;
        if (resources.resources) resources = resources.resources; // Handle { resources: [] } wrapper

        if (!Array.isArray(resources)) {
            console.error('❌ Resources response is not an array:', resources);
            process.exit(1);
        }

        const prodResource = resources.find((r: any) => r.name === 'Production Cloud Console');
        const repoResource = resources.find((r: any) => r.name === 'Git Repository');

        if (!prodResource) console.warn('⚠️  Production Console resource not found');

        // 4. Test Scan (Gatekeeper -> PDP)
        console.log('🔍 Initiating Trust Scan (PEP -> PDP Check)...');

        const scanTarget = prodResource || repoResource || resources[0];
        console.log(`   Targeting: ${scanTarget.name} (${scanTarget._id})`);

        const scanRes = await axios.post(`${API_URL}/verify/scan`, {
            resourceId: scanTarget._id
        }, { headers });

        const result = scanRes.data;
        console.log('✅ Scan Completed!');
        console.log(`   - Trust Score: ${result.trustScore}`);
        console.log(`   - Decision: ${result.decision}`);
        console.log(`   - Reason: ${result.decisionReason}`);
        console.log(`   - Engine Used: ${result.factors.some((f: any) => f.name === 'Trust Engine Offline') ? '❌ OFFLINE FALLBACK' : '✅ PYTHON ENGINE'}`);

        if (result.factors.some((f: any) => f.name === 'Trust Engine Offline')) {
            console.error('❌ PEP fell back to offline mode. Integration failed.');
            process.exit(1);
        }

        console.log('🎉 End-to-End Zero Trust Verification PASSED!');

    } catch (error: any) {
        console.error('❌ Verification failed:', error.response?.data || error.message);
        process.exit(1);
    }
}

verifyZeroTrust();
