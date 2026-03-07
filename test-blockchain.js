import 'dotenv/config';
import { isBlockchainConfigured, getWalletAddress, getWalletBalance, generateDiplomaHash } from './server/ethereum.js';

async function testBlockchain() {
  console.log('🔍 Testing Blockchain Configuration...\n');

  // Test 1: Check if blockchain is configured
  const configured = isBlockchainConfigured();
  console.log('✅ Blockchain configured:', configured);

  if (!configured) {
    console.log('ℹ️  Blockchain not configured - using local mode only');
    console.log('   This is normal for development without valid Ethereum credentials\n');
    return;
  }

  // Test 2: Get wallet address
  try {
    console.log('🔑 Testing wallet...');
    const address = await getWalletAddress();
    console.log('✅ Wallet address:', address);
  } catch (error) {
    console.log('❌ Wallet error:', error.message);
  }

  // Test 3: Get wallet balance
  try {
    console.log('💰 Checking wallet balance...');
    const balance = await getWalletBalance();
    console.log('✅ Wallet balance:', balance, 'ETH');
  } catch (error) {
    console.log('❌ Balance check error:', error.message);
  }

  // Test 4: Test hash generation
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

  console.log('\n🎉 Blockchain test completed!');
}

testBlockchain().catch(console.error);