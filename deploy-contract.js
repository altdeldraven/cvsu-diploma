import 'dotenv/config';
import { ethers } from 'ethers';
import { readFileSync } from 'fs';

async function deployContract() {
  console.log('🚀 Deploying DiplomaRegistry Contract...\n');

  // Check environment variables
  const rpcUrl = process.env.ETHEREUM_RPC_URL;
  const privateKey = process.env.ETHEREUM_PRIVATE_KEY;

  if (!rpcUrl || !privateKey) {
    console.log('❌ Missing ETHEREUM_RPC_URL or ETHEREUM_PRIVATE_KEY in .env');
    return;
  }

  try {
    // Create provider and wallet
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey.startsWith('0x') ? privateKey : '0x' + privateKey, provider);

    console.log('📧 Deploying from address:', wallet.address);

    // Check wallet balance
    const balance = await provider.getBalance(wallet.address);
    const balanceEth = ethers.formatEther(balance);
    console.log('💰 Wallet balance:', balanceEth, 'ETH');

    if (parseFloat(balanceEth) < 0.01) {
      console.log('❌ Insufficient funds. Need at least 0.01 ETH for deployment');
      console.log('💡 Get testnet ETH from: https://sepoliafaucet.com/');
      return;
    }

    // Load contract source
    const contractSource = readFileSync('./contracts/DiplomaRegistry.sol', 'utf8');
    console.log('📄 Contract source loaded');

    // For simplicity, we'll use a pre-compiled bytecode approach
    // In a real scenario, you'd use Hardhat or similar to compile
    console.log('⚠️  Note: This demo uses a simplified deployment approach');
    console.log('   For production, use Hardhat/Truffle for proper compilation\n');

    // Since we don't have a compiler here, let's provide instructions
    console.log('📋 To deploy the contract properly:');
    console.log('1. Install Hardhat: npm install -D hardhat @nomiclabs/hardhat-ethers ethers');
    console.log('2. Create hardhat.config.js with Sepolia network config');
    console.log('3. Create scripts/deploy.js');
    console.log('4. Run: npx hardhat run scripts/deploy.js --network sepolia');
    console.log('\n📝 Example hardhat.config.js:');

    const configExample = `
import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";

const config: HardhatUserConfig = {
  solidity: "0.8.19",
  networks: {
    sepolia: {
      url: "${rpcUrl}",
      accounts: ["0x${privateKey}"]
    }
  }
};

export default config;
`;

    console.log(configExample);

    console.log('\n📝 Example scripts/deploy.js:');

    const deployExample = `
import { ethers } from "hardhat";

async function main() {
  const DiplomaRegistry = await ethers.getContractFactory("DiplomaRegistry");
  const contract = await DiplomaRegistry.deploy();

  await contract.deployed();
  console.log("Contract deployed to:", contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
`;

    console.log(deployExample);

  } catch (error) {
    console.error('❌ Deployment preparation failed:', error.message);
  }
}

deployContract();