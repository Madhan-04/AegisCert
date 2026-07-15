// Real-world Smart Contract & EVM Explorer Simulation Layer
import { db } from './db';

export interface Transaction {
  hash: string;
  blockNumber: number;
  timestamp: string;
  from: string;
  to: string;
  value: string; // "0 ETH"
  gasUsed: number;
  gasPrice: string; // Gwei
  gasLimit: number;
  status: '0x1' | '0x0'; // 0x1: Success, 0x0: Revert
  certId: string;
  certHash: string;
  studentName: string;
  type: 'ISSUE' | 'REVOKE' | 'SUSPEND' | 'ACTIVATE';
  inputData: string; // EVM Bytecode input call ABI encoded
}

export interface Block {
  number: number;
  hash: string;
  parentHash: string;
  timestamp: string;
  transactions: Transaction[];
  nonce: string;
  difficulty: string;
  gasUsed: number;
  gasLimit: number;
  miner: string;
}

// Solidity Verified Contract Source Code
export const SOLIDITY_CODE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AcademicCredentialRegistry {
    address public owner;
    
    enum Status { Draft, Pending, Issued, Active, Suspended, Revoked, Expired }
    
    struct Certificate {
        string certId;
        string studentName;
        bytes32 docHash;
        address issuer;
        uint256 issueTimestamp;
        Status status;
    }
    
    mapping(string => Certificate) private certificates;
    mapping(bytes32 => bool) private registeredHashes;
    
    event CertificateRegistered(string indexed certId, bytes32 indexed docHash, address indexed issuer);
    event CertificateStatusChanged(string indexed certId, Status indexed newStatus, string reason);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the system owner");
        _;
    }
    
    modifier onlyIssuer(string memory certId) {
        require(certificates[certId].issuer == msg.sender || msg.sender == owner, "Unauthorized issuer");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    function registerCertificate(
        string memory _certId,
        string memory _studentName,
        bytes32 _docHash
    ) external {
        require(certificates[_certId].docHash == bytes32(0), "Certificate ID already registered");
        require(!registeredHashes[_docHash], "Document hash already mapped to another certificate");
        
        certificates[_certId] = Certificate({
            certId: _certId,
            studentName: _studentName,
            docHash: _docHash,
            issuer: msg.sender,
            issueTimestamp: block.timestamp,
            status: Status.Active
        });
        
        registeredHashes[_docHash] = true;
        
        emit CertificateRegistered(_certId, _docHash, msg.sender);
    }
    
    function updateCertificateStatus(
        string memory _certId,
        Status _newStatus,
        string memory _reason
    ) external onlyIssuer(_certId) {
        require(certificates[_certId].docHash != bytes32(0), "Certificate not found");
        certificates[_certId].status = _newStatus;
        
        emit CertificateStatusChanged(_certId, _newStatus, _reason);
    }
    
    function verifyCertificate(
        string memory _certId,
        bytes32 _docHash
    ) external view returns (bool isValid, Status status, uint256 timestamp) {
        Certificate memory cert = certificates[_certId];
        if (cert.docHash == bytes32(0)) {
            return (false, Status.Draft, 0);
        }
        
        bool hashMatch = cert.docHash == _docHash;
        bool statusActive = cert.status == Status.Active;
        
        return (hashMatch && statusActive, cert.status, cert.issueTimestamp);
    }
}`;

// Mock ABI bytecode representation
export const CONTRACT_ABI = [
  { "inputs": [], "stateMutability": "nonpayable", "type": "constructor" },
  { "anonymous": false, "inputs": [{ "indexed": true, "name": "certId", "type": "string" }, { "indexed": true, "name": "docHash", "type": "bytes32" }, { "indexed": true, "name": "issuer", "type": "address" }], "name": "CertificateRegistered", "type": "event" },
  { "inputs": [{ "name": "_certId", "type": "string" }, { "name": "_studentName", "type": "string" }, { "name": "_docHash", "type": "bytes32" }], "name": "registerCertificate", "type": "function" },
  { "inputs": [{ "name": "_certId", "type": "string" }, { "name": "_newStatus", "type": "uint8" }, { "name": "_reason", "type": "string" }], "name": "updateCertificateStatus", "type": "function" }
];

export const CONTRACT_BYTECODE = "0x608060405234801561001057600080fd5b50610f76806100206000396000f3fe608060405234801561001057600080fd5b50600436106100415760003560e01c806334fba3d2146100465780638b693e50146100f0578063a8247df614610140575b600080fd5b600035...000000000000000000000000";

// Real SHA-256 implementation via Web Crypto API
export async function sha256(str: string): Promise<string> {
  const cryptoObj = typeof window !== 'undefined' && window.crypto ? window.crypto : (typeof globalThis !== 'undefined' && globalThis.crypto ? globalThis.crypto : null);

  if (!cryptoObj || !cryptoObj.subtle) {
    // Fallback simple hash for non-browser environments
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += hex + ((hash * (i + 1)) & 0xffffff).toString(16).padStart(8, '0');
    }
    return result.slice(0, 64);
  }

  const msgUint8 = new TextEncoder().encode(str);
  const hashBuffer = await cryptoObj.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Initial Genesis Block
const DEFAULT_LEDGER: Block[] = [
  {
    number: 14920821,
    hash: '0x0000e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    parentHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
    timestamp: '2026-06-20T08:00:00Z',
    transactions: [],
    nonce: '0xf8c238bd3810a012',
    difficulty: '14,839,209,129 Ghash',
    gasUsed: 0,
    gasLimit: 30000000,
    miner: '0x1D2a980f1a6B7E8D9c0A9b8C7e8F9a0b1C2d3E4f'
  }
];

export const blockchain = {
  sha256,
  
  getLedger: (): Block[] => {
    const list = db.getBlockchainLedger();
    if (list.length === 0) {
      db.setBlockchainLedger(DEFAULT_LEDGER);
      return DEFAULT_LEDGER;
    }
    return list;
  },

  setLedger: (ledger: Block[]) => {
    db.setBlockchainLedger(ledger);
  },

  // Mine a transaction into a new block, mimicking EVM RPC calls
  mineTransaction: async (
    txData: {
      type: 'ISSUE' | 'REVOKE' | 'SUSPEND' | 'ACTIVATE';
      certId: string;
      certHash: string;
      studentName: string;
      issuerAddress: string;
      issuerName: string;
    },
    onProgress: (nonce: number, currentHash: string) => void
  ): Promise<Block> => {
    const ledger = blockchain.getLedger();
    const lastBlock = ledger[ledger.length - 1];
    
    const blockNumber = lastBlock.number + 1;
    const timestamp = new Date().toISOString();
    const parentHash = lastBlock.hash;
    
    // ABI encoding simulation
    let methodSignature = '0x';
    if (txData.type === 'ISSUE') {
      methodSignature = '0x34fba3d2'; // registerCertificate(string,string,bytes32) ABI method prefix
    } else {
      methodSignature = '0xa8247df6'; // updateCertificateStatus(string,uint8,string) ABI method prefix
    }
    const inputData = `${methodSignature}${encryptABI(txData.certId, txData.certHash)}`;

    const secureArray = new Uint32Array(1);
    crypto.getRandomValues(secureArray);
    const txHash = '0x' + await sha256(blockNumber + timestamp + parentHash + txData.certId + secureArray[0].toString());

    const transaction: Transaction = {
      hash: txHash,
      blockNumber,
      timestamp,
      from: txData.issuerAddress,
      to: '0x4f46e5cd1d287a980f1a6b7e8d9c0a9b8c7e8f9a', // Contract Address
      value: '0 ETH',
      gasUsed: txData.type === 'ISSUE' ? 84291 : 47219,
      gasPrice: '25', // Gwei
      gasLimit: 150000,
      status: '0x1',
      certId: txData.certId,
      certHash: txData.certHash,
      studentName: txData.studentName,
      type: txData.type,
      inputData
    };

    let nonceVal = 0;
    const difficultyPrefix = '00'; 
    const baseContent = blockNumber + timestamp + parentHash + JSON.stringify(transaction);

    let done = false;
    let newBlock: Block | null = null;

    while (!done) {
      for (let i = 0; i < 75; i++) {
        const testHash = await sha256(baseContent + nonceVal);
        if (testHash.startsWith(difficultyPrefix)) {
          done = true;
          
          newBlock = {
            number: blockNumber,
            hash: '0x' + testHash,
            parentHash,
            timestamp,
            transactions: [transaction],
            nonce: '0x' + nonceVal.toString(16),
            difficulty: '14,839,281,992 Ghash',
            gasUsed: transaction.gasUsed,
            gasLimit: 30000000,
            miner: '0x2D1a980F1a6b7e8d9c0a9B8C7E8f9A0B1c2d3E4f'
          };

          const currentLedger = blockchain.getLedger();
          currentLedger.push(newBlock);
          blockchain.setLedger(currentLedger);
          break;
        }
        nonceVal++;
      }

      if (!done) {
        const blockHash = '0x' + await sha256(baseContent + nonceVal);
        onProgress(nonceVal, blockHash);
        // yield to browser thread
        await new Promise((resolve) => setTimeout(resolve, 30));
      }
    }

    return newBlock!;
  },

  // Verification API using smart contract simulations
  verifyOnChain: async (certId: string, certHash: string): Promise<{
    isVerified: boolean;
    status: 'draft' | 'pending' | 'issued' | 'active' | 'suspended' | 'revoked' | 'expired';
    block?: Block;
    tx?: Transaction;
    isTampered: boolean;
  }> => {
    const ledger = blockchain.getLedger();
    
    // Find the latest transaction for this certId
    let latestTx: Transaction | undefined;
    let blockOfTx: Block | undefined;
    
    // Search backward to find latest state
    for (let i = ledger.length - 1; i >= 0; i--) {
      const block = ledger[i];
      const tx = block.transactions.find(t => t.certId === certId);
      if (tx) {
        latestTx = tx;
        blockOfTx = block;
        break;
      }
    }

    if (!latestTx) {
      return { isVerified: false, status: 'draft', isTampered: false };
    }

    // Check if tampered: compare provided hash against on-chain transaction hash
    const isTampered = latestTx.certHash !== certHash;
    
    // Determine status from on-chain history (or latest tx type)
    let state: 'draft' | 'pending' | 'issued' | 'active' | 'suspended' | 'revoked' | 'expired' = 'active';
    if (latestTx.type === 'REVOKE') {
      state = 'revoked';
    } else if (latestTx.type === 'SUSPEND') {
      state = 'suspended';
    }

    const isVerified = !isTampered && state === 'active';

    return {
      isVerified,
      status: state,
      block: blockOfTx,
      tx: latestTx,
      isTampered
    };
  }
};

// ABI encoding simulator
function encryptABI(certId: string, certHash: string): string {
  // Convert text fields into padded 32-byte hex blocks representing EVM input data
  const paddedId = certId.padEnd(32, '_');
  let hexResult = '';
  for (let i = 0; i < paddedId.length; i++) {
    hexResult += paddedId.charCodeAt(i).toString(16);
  }
  return hexResult + certHash.slice(0, 32);
}
