import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";

const config: HardhatUserConfig = {
  solidity: "0.8.19",
  networks: {
    sepolia: {
      url: process.env.ETHEREUM_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com",
      accounts: process.env.ETHEREUM_PRIVATE_KEY ? [process.env.ETHEREUM_PRIVATE_KEY.startsWith('0x') ? process.env.ETHEREUM_PRIVATE_KEY : '0x' + process.env.ETHEREUM_PRIVATE_KEY] : []
    }
  }
};

export default config;