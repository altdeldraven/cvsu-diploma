import { ethers } from "ethers";
import { createHash } from "crypto";
import DiplomaRegistryABI from "./contracts/DiplomaRegistryABI.json";

const SEPOLIA_RPC_URL = process.env.ETHEREUM_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";

let provider: ethers.JsonRpcProvider | null = null;
let wallet: ethers.Wallet | null = null;
let contract: ethers.Contract | null = null;

function getProvider(): ethers.JsonRpcProvider {
  if (!provider) {
    provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
  }
  return provider;
}

function getWallet(): ethers.Wallet | null {
  if (!wallet) {
    let privateKey = process.env.ETHEREUM_PRIVATE_KEY;
    if (!privateKey) {
      console.warn("[Ethereum] ETHEREUM_PRIVATE_KEY not set — blockchain writes disabled");
      return null;
    }
    if (!privateKey.startsWith("0x")) {
      privateKey = "0x" + privateKey;
    }
    wallet = new ethers.Wallet(privateKey, getProvider());
  }
  return wallet;
}

let cachedContractAddress: string | null = null;

function getContract(): ethers.Contract | null {
  let contractAddress = process.env.DIPLOMA_CONTRACT_ADDRESS;
  if (!contractAddress) {
    console.warn("[Ethereum] DIPLOMA_CONTRACT_ADDRESS not set — blockchain features disabled");
    return null;
  }
  if (!contractAddress.startsWith("0x")) {
    contractAddress = "0x" + contractAddress;
  }
  if (!contract || cachedContractAddress !== contractAddress) {
    cachedContractAddress = contractAddress;
    const w = getWallet();
    if (w) {
      contract = new ethers.Contract(contractAddress, DiplomaRegistryABI, w);
    } else {
      contract = new ethers.Contract(contractAddress, DiplomaRegistryABI, getProvider());
    }
  }
  return contract;
}

export function generateDiplomaHash(data: {
  studentId: number;
  course: string;
  certificateId: string;
  studentName: string;
  graduationYear?: number;
}): string {
  const payload = JSON.stringify({
    studentId: data.studentId,
    course: data.course,
    certificateId: data.certificateId,
    studentName: data.studentName,
    graduationYear: data.graduationYear,
  });
  return "0x" + createHash("sha256").update(payload).digest("hex");
}

export async function registerDiplomaOnChain(
  certificateId: string,
  diplomaHash: string
): Promise<{ txHash: string; success: boolean; error?: string }> {
  try {
    const c = getContract();
    if (!c) {
      return { txHash: "", success: false, error: "Blockchain not configured" };
    }

    const w = getWallet();
    if (!w) {
      return { txHash: "", success: false, error: "Wallet not configured" };
    }

    // Check if current wallet is the contract owner
    const contractOwner = await c.owner();
    if (contractOwner.toLowerCase() !== w.address.toLowerCase()) {
      console.warn(`[Ethereum] Current wallet (${w.address}) is not the contract owner (${contractOwner}). Skipping blockchain registration.`);
      return { txHash: "", success: false, error: "Wallet is not contract owner" };
    }

    const hashBytes = diplomaHash.startsWith("0x") ? diplomaHash : "0x" + diplomaHash;
    const bytes32Hash = ethers.zeroPadValue(hashBytes, 32);

    const tx = await c.registerDiploma(certificateId, bytes32Hash);
    console.log(`[Ethereum] Transaction sent: ${tx.hash}`);

    const receipt = await tx.wait();
    console.log(`[Ethereum] Transaction confirmed in block ${receipt.blockNumber}`);

    return { txHash: tx.hash, success: true };
  } catch (error: any) {
    console.error(`[Ethereum] Failed to register diploma: ${error.message}`);
    return { txHash: "", success: false, error: error.message };
  }
}

export async function verifyDiplomaOnChain(
  certificateId: string
): Promise<{ exists: boolean; hash: string | null; timestamp: number | null; error?: string }> {
  try {
    const c = getContract();
    if (!c) {
      return { exists: false, hash: null, timestamp: null, error: "Blockchain not configured" };
    }

    const result = await c.verifyDiploma(certificateId);
    const exists = result[2];
    
    if (!exists) {
      return { exists: false, hash: null, timestamp: null };
    }

    return {
      exists: true,
      hash: result[0],
      timestamp: Number(result[1]),
    };
  } catch (error: any) {
    console.error(`[Ethereum] Failed to verify diploma: ${error.message}`);
    return { exists: false, hash: null, timestamp: null, error: error.message };
  }
}

export function isBlockchainConfigured(): boolean {
  if (!(process.env.ETHEREUM_PRIVATE_KEY && process.env.DIPLOMA_CONTRACT_ADDRESS)) {
    return false;
  }
  try {
    getWallet();
    return true;
  } catch (error) {
    console.warn("[Ethereum] Invalid blockchain configuration:");
    return false;
  }
}

export async function getWalletAddress(): Promise<string | null> {
  const w = getWallet();
  if (!w) return null;
  return w.address;
}

export async function getWalletBalance(): Promise<string | null> {
  try {
    const w = getWallet();
    if (!w) return null;
    const balance = await getProvider().getBalance(w.address);
    return ethers.formatEther(balance);
  } catch {
    return null;
  }
}
