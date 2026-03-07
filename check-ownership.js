import 'dotenv/config';
import { ethers } from 'ethers';
import { readFileSync } from 'fs';

async function checkContractOwnership() {
  console.log('🔍 Checking Contract Ownership...\n');

  // Check environment variables
  const rpcUrl = process.env.ETHEREUM_RPC_URL;
  const privateKey = process.env.ETHEREUM_PRIVATE_KEY;
  const contractAddress = process.env.DIPLOMA_CONTRACT_ADDRESS;

  if (!rpcUrl || !privateKey || !contractAddress) {
    console.log('❌ Missing environment variables');
    return;
  }

  try {
    // Load ABI
    const abi = JSON.parse(readFileSync('./server/contracts/DiplomaRegistryABI.json', 'utf8'));

    // Create provider and wallet
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey.startsWith('0x') ? privateKey : '0x' + privateKey, provider);

    console.log('📧 Wallet Address:', wallet.address);
    console.log('🏠 Contract Address:', contractAddress);

    // First check if contract exists by getting code
    const code = await provider.getCode(contractAddress);
    if (code === '0x') {
      console.log('❌ No contract deployed at this address');
      return;
    }
    console.log('✅ Contract exists at address');

    // Create contract instance
    const contract = new ethers.Contract(contractAddress, abi, provider);

    // Try to get contract owner
    try {
      const owner = await contract.owner();
      console.log('👑 Contract Owner:', owner);

      // Compare addresses (case insensitive)
      const isOwner = owner.toLowerCase() === wallet.address.toLowerCase();

      console.log('\n' + (isOwner ? '✅' : '❌') + ` Wallet ${isOwner ? 'OWNS' : 'does NOT own'} the contract`);

      if (!isOwner) {
        console.log('\n💡 To fix this:');
        console.log('1. Use a private key that owns this contract');
        console.log('2. Deploy a new contract with this wallet as owner');
        console.log('3. Transfer ownership of the existing contract');
      }
    } catch (ownerError) {
      console.log('⚠️ Could not get owner (contract might not have owner() function):', ownerError.message);
    }

    // Try a simple function call to verify contract works
    try {
      const testResult = await contract.isDiplomaRegistered('TEST-123');
      console.log('✅ Contract responds to function calls');
    } catch (callError) {
      console.log('❌ Contract function call failed:', callError.message);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkContractOwnership();