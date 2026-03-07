import 'dotenv/config';
import { isBlockchainConfigured, generateDiplomaHash } from './server/ethereum.ts';

console.log('🔍 Testing Blockchain Configuration...\n');

// Test 1: Check if blockchain is configured
const configured = isBlockchainConfigured();
console.log('✅ Blockchain configured:', configured);

// Test 2: Test hash generation
console.log('\n🔐 Testing diploma hash generation...');
const testData = {
  studentId: 123,
  course: 'Computer Science',
  certificateId: 'CERT-TEST123',
  studentName: 'John Doe',
  graduationYear: 2024
};
const hash = generateDiplomaHash(testData);
console.log('✅ Generated hash:', hash);
console.log('   Hash length:', hash.length, '(should be 66 chars: 0x + 64)');

console.log('\n🎉 Basic blockchain test completed!');