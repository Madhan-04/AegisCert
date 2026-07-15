import { describe, it, expect, vi } from 'vitest';

// Mock localStorage and sessionStorage globally
const mockStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    clear: () => { store = {}; },
    removeItem: (key: string) => { delete store[key]; }
  };
});

globalThis.localStorage = mockStorage() as any;
globalThis.sessionStorage = mockStorage() as any;

// Import blockchain after setting up storage mocks
import { blockchain } from '../services/blockchain';

describe('Blockchain Cryptographic Services', () => {
  it('should compute real SHA-256 async hashes correctly using SubtleCrypto', async () => {
    const text = 'AegisCert-Security-Ledger-Hash-Verification';
    const hash = await blockchain.sha256(text);
    
    // Check correct format (64-character lowercase hex string)
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    
    // Compare against pre-computed known hash
    const expected = 'fcbe4abb8814f6bfc0a48342efc3570b24a5dc5b05e4de347c9a4d806449f63e';
    expect(hash).toBe(expected);
  });

  it('should simulate mining block transaction correctly', async () => {
    const onProgress = vi.fn();
    const mockTx = {
      type: 'ISSUE' as const,
      certId: 'CERT-2026-UNITTEST',
      certHash: '0x32ba5f8a8519e917d23d8c119e34a0283c74828f',
      studentName: 'Jane Doe',
      issuerAddress: '0x1D2a980f1a6B7E8D9c0A9b8C7e8F9a0b1C2d3E4f',
      issuerName: 'AegisCert Academic Node'
    };

    const block = await blockchain.mineTransaction(mockTx, onProgress);
    
    expect(block).toBeDefined();
    expect(block.number).toBeGreaterThan(14920821);
    expect(block.transactions.length).toBe(1);
    expect(block.transactions[0].certId).toBe('CERT-2026-UNITTEST');
    expect(block.hash.startsWith('0x00')).toBe(true);
  });
});
