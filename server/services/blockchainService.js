import crypto from 'crypto';
import { run, all, get } from '../db.js';

export function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

export async function getLedger() {
  return all('SELECT * FROM blockchain_ledger WHERE deletedAt IS NULL ORDER BY number ASC');
}

export async function mineTransaction(txData, operator) {
  const lastBlock = await get('SELECT * FROM blockchain_ledger ORDER BY number DESC LIMIT 1');
  const number = (lastBlock ? lastBlock.number : 0) + 1;
  const parentHash = lastBlock ? lastBlock.hash : '0x0000000000000000000000000000000000000000000000000000000000000000';
  const timestamp = new Date().toISOString();

  // Create real tx hash
  const txHash = '0x' + sha256(number + timestamp + parentHash + txData.certId + crypto.randomUUID());
  
  const transaction = {
    hash: txHash,
    blockNumber: number,
    timestamp,
    from: txData.issuerAddress || '0x1D2a980f1a6B7E8D9c0A9b8C7e8F9a0b1C2d3E4f',
    to: '0x4f46e5cd1d287a980f1a6b7e8d9c0a9b8c7e8f9a',
    value: '0 ETH',
    gasUsed: txData.type === 'ISSUE' ? 84291 : 47219,
    gasPrice: '25',
    gasLimit: 150000,
    status: '0x1',
    certId: txData.certId,
    certHash: txData.certHash,
    studentName: txData.studentName,
    type: txData.type,
    inputData: `0x34fba3d2${crypto.randomUUID().replace(/-/g, '')}`
  };

  // Proof of work simulation matching standard prefixes
  let nonceVal = 0;
  const difficultyPrefix = '00';
  const baseContent = number + timestamp + parentHash + JSON.stringify(transaction);
  let finalHash = '';

  // Non-blocking simple synchronous search limit to prevent stack lock
  for (let i = 0; i < 50000; i++) {
    const testHash = sha256(baseContent + nonceVal);
    if (testHash.startsWith(difficultyPrefix)) {
      finalHash = testHash;
      break;
    }
    nonceVal++;
  }

  // Fallback if difficulty takes too long to find
  if (!finalHash) {
    finalHash = sha256(baseContent + nonceVal);
  }

  const blockHash = '0x' + finalHash;
  const nonce = '0x' + nonceVal.toString(16);

  await run(
    'INSERT INTO blockchain_ledger (number, hash, parentHash, timestamp, transactions, nonce, difficulty, gasUsed, gasLimit, miner, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [number, blockHash, parentHash, timestamp, JSON.stringify([transaction]), nonce, '14,839,281,992 Ghash', transaction.gasUsed, 30000000, '0x2D1a980F1a6b7e8d9c0a9B8C7E8f9A0B1c2d3E4f', operator || 'system']
  );

  return {
    number,
    hash: blockHash,
    parentHash,
    timestamp,
    transactions: [transaction],
    nonce,
    difficulty: '14,839,281,992 Ghash',
    gasUsed: transaction.gasUsed,
    gasLimit: 30000000,
    miner: '0x2D1a980F1a6b7e8d9c0a9B8C7E8f9A0B1c2d3E4f'
  };
}
