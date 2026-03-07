import 'dotenv/config';

console.log('🔍 Testing Blockchain Environment Configuration...\n');

console.log('ETHEREUM_RPC_URL:', process.env.ETHEREUM_RPC_URL ? '✅ Set' : '❌ Not set');
console.log('ETHEREUM_PRIVATE_KEY:', process.env.ETHEREUM_PRIVATE_KEY ? '✅ Set (' + process.env.ETHEREUM_PRIVATE_KEY.length + ' chars)' : '❌ Not set');
console.log('DIPLOMA_CONTRACT_ADDRESS:', process.env.DIPLOMA_CONTRACT_ADDRESS ? '✅ Set' : '❌ Not set');

const configured = !!(process.env.ETHEREUM_PRIVATE_KEY && process.env.DIPLOMA_CONTRACT_ADDRESS);
console.log('\n✅ Basic blockchain configuration check:', configured);

if (!configured) {
  console.log('ℹ️  Blockchain not configured - using local mode only');
  console.log('   This is normal for development');
} else {
  console.log('ℹ️  Blockchain configured - will attempt on-chain operations');

  // Check private key format
  const key = process.env.ETHEREUM_PRIVATE_KEY;
  if (key) {
    const fullKey = key.startsWith('0x') ? key : '0x' + key;
    if (fullKey.length === 66 && /^0x[0-9a-fA-F]{64}$/.test(fullKey)) {
      console.log('✅ Private key format is valid');
    } else {
      console.log('❌ Private key format is invalid (should be 0x + 64 hex characters)');
    }
  }

  // Check contract address format
  const contract = process.env.DIPLOMA_CONTRACT_ADDRESS;
  if (contract && !contract.startsWith('0x')) {
    console.log('⚠️  Contract address should start with 0x');
  } else if (contract && contract.length !== 42) {
    console.log('⚠️  Contract address length is', contract.length, 'characters (should be 42)');
  } else {
    console.log('✅ Contract address format looks valid');
  }
}

console.log('\n🎉 Environment check completed!');