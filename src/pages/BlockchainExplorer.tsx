import React, { useState, useEffect } from 'react';
import { blockchain, Block, Transaction, SOLIDITY_CODE, CONTRACT_ABI, CONTRACT_BYTECODE } from '../services/blockchain';
import { 
  Database, Cpu, Code2, Link, Server, FileCode, CheckCircle2, 
  ChevronRight, ArrowRight, CornerDownRight, Clock, Box, Eye
} from 'lucide-react';

export default function BlockchainExplorer() {
  const [ledger, setLedger] = useState<Block[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [activeTab, setActiveTab] = useState<'blocks' | 'code' | 'abi'>('blocks');

  useEffect(() => {
    setLedger(blockchain.getLedger());
  }, []);

  const getLatestBlock = () => {
    return ledger.length > 0 ? ledger[ledger.length - 1] : null;
  };

  const getTxCount = () => {
    return ledger.reduce((acc, block) => acc + block.transactions.length, 0);
  };

  const latestBlock = getLatestBlock();

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
          <Database className="w-8 h-8 text-indigo-400" />
          Etherscan Simulated Block Explorer
        </h1>
        <p className="text-sm text-slate-400">
          Inspect block parameters, EVM gas usages, verified Solidity source codes, and transaction payload ABIs.
        </p>
      </div>

      {/* Network Header Cards */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-3">
          <span className="text-3xs font-extrabold text-slate-500 uppercase tracking-widest block">CONTRACT DEPLOYED</span>
          <div className="text-xs font-mono font-bold text-white break-all flex items-center gap-1.5 select-all">
            <Link className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            0x4f46e5cd1d287a980f1a6b7e8d9c0a9b8c7e8f9a
          </div>
          <span className="text-3xs font-semibold text-emerald-400 uppercase tracking-wider block mt-1">Status: Active & Synced</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-3">
          <span className="text-3xs font-extrabold text-slate-500 uppercase tracking-widest block">LATEST BLOCK HEIGHT</span>
          <div className="text-3xl font-extrabold text-white font-mono flex items-center gap-1.5">
            <Box className="w-6 h-6 text-primary" />
            #{latestBlock ? latestBlock.number : '...'}
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-3">
          <span className="text-3xs font-extrabold text-slate-500 uppercase tracking-widest block">Consensus transactions</span>
          <div className="text-3xl font-extrabold text-white font-mono flex items-center gap-1.5">
            <Cpu className="w-6 h-6 text-accent" />
            {getTxCount()} TXs
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-3">
          <span className="text-3xs font-extrabold text-slate-500 uppercase tracking-widest block">EVM GAS PARAMETERS</span>
          <div className="text-lg font-bold text-slate-300 font-mono">
            Gas limit: 30.0M
            <span className="block text-2xs text-slate-500">Base Gas: 25 Gwei</span>
          </div>
        </div>
      </section>

      {/* Tabs Selector */}
      <div className="flex border-b border-white/5">
        <button
          onClick={() => setActiveTab('blocks')}
          className={`px-6 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${activeTab === 'blocks' ? 'border-primary text-white' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          Consensus Blocks & TXs
        </button>
        <button
          onClick={() => setActiveTab('code')}
          className={`px-6 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${activeTab === 'code' ? 'border-primary text-white' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          Verified Solidity Source Code
        </button>
        <button
          onClick={() => setActiveTab('abi')}
          className={`px-6 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${activeTab === 'abi' ? 'border-primary text-white' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          Smart Contract ABI Config
        </button>
      </div>

      {/* Dynamic Tab Renderer */}
      <div className="space-y-6">
        
        {/* TAB 1: BLOCKS */}
        {activeTab === 'blocks' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Block List card */}
            <div className="lg:col-span-6 glass-panel p-6 rounded-3xl border border-white/5 space-y-5">
              <h3 className="font-extrabold text-white text-base">Consensus Blocks Ledger</h3>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {[...ledger].reverse().map((block) => (
                  <div 
                    key={block.number} 
                    onClick={() => setSelectedBlock(block)}
                    className={`p-4 bg-slate-950/60 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${selectedBlock?.number === block.number ? 'border-primary shadow-lg shadow-primary/5 bg-slate-950' : 'border-white/5 hover:border-white/10 hover:bg-slate-900/60'}`}
                  >
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                        <Box className="w-3.5 h-3.5 text-indigo-400" />
                        Block #{block.number}
                      </div>
                      <p className="text-3xs text-slate-500 font-sans flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(block.timestamp).toLocaleString()}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary-light text-3xs font-mono font-bold uppercase">
                        {block.transactions.length} TXs
                      </span>
                      <p className="text-3xs text-slate-500 font-mono mt-1">Gas: {block.gasUsed} used</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Block details card */}
            <div className="lg:col-span-6 space-y-6">
              {selectedBlock ? (
                <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-6 animate-fadeIn">
                  <div className="pb-3 border-b border-white/5 flex justify-between items-center">
                    <h3 className="font-extrabold text-white text-base">Block Details: #{selectedBlock.number}</h3>
                    <span className="text-emerald-400 font-semibold flex items-center gap-0.5 text-2xs uppercase tracking-wider font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      consensus synced
                    </span>
                  </div>

                  <div className="space-y-3 font-mono text-2xs text-slate-400 leading-relaxed">
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-slate-500">Block Hash:</span>
                      <span className="text-white text-right break-all select-all font-bold max-w-[280px]">{selectedBlock.hash}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-slate-500">Parent Hash:</span>
                      <span className="text-slate-400 text-right break-all select-all max-w-[280px]">{selectedBlock.parentHash}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-slate-500">Nonce:</span>
                      <span className="text-white font-bold">{selectedBlock.nonce}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-slate-500">Difficulty:</span>
                      <span className="text-slate-400">{selectedBlock.difficulty}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-slate-500">Validator Miner Address:</span>
                      <span className="text-slate-500 text-right break-all select-all max-w-[280px]">{selectedBlock.miner}</span>
                    </div>
                  </div>

                  {/* Block transactions list */}
                  <div className="space-y-3 pt-3 border-t border-white/5">
                    <span className="block text-2xs font-extrabold text-slate-500 uppercase tracking-widest">Transactions in Block ({selectedBlock.transactions.length})</span>
                    {selectedBlock.transactions.length === 0 ? (
                      <p className="text-slate-500 text-xs italic">No transactions contained in this block.</p>
                    ) : (
                      selectedBlock.transactions.map((tx) => (
                        <div 
                          key={tx.hash} 
                          onClick={() => setSelectedTx(tx)}
                          className="p-3 bg-slate-950/60 rounded-xl border border-white/5 hover:border-indigo-500/20 hover:bg-slate-950 flex justify-between items-center cursor-pointer font-mono text-3xs"
                        >
                          <div className="space-y-1 max-w-[250px]">
                            <div className="text-indigo-300 font-bold break-all">{tx.hash.substring(0, 24)}...</div>
                            <div className="text-slate-500 flex items-center gap-1 font-sans">
                              <span>From:</span>
                              <span className="truncate max-w-[120px]">{tx.from}</span>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <span className={`px-1.5 py-0.5 rounded text-3xs font-bold uppercase tracking-wider ${
                              tx.type === 'ISSUE' ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400' :
                              tx.type === 'REVOKE' ? 'bg-rose-500/10 border border-rose-500/25 text-rose-400' :
                              'bg-amber-500/10 border border-amber-500/25 text-amber-400'
                            }`}>
                              {tx.type}
                            </span>
                            <div className="text-slate-500 font-sans mt-1">Gas: {tx.gasUsed}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="glass-panel p-12 rounded-3xl border border-white/5 text-center text-slate-500 text-sm">
                  Select a block from the ledger history to view details and transactions.
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 2: SOLIDER SOURCE CODE */}
        {activeTab === 'code' && (
          <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                <FileCode className="w-5 h-5 text-indigo-400" />
                AcademicCredentialRegistry.sol
              </h3>
              <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-3xs font-bold uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                solc v0.8.20 verified
              </span>
            </div>

            <pre className="p-5 bg-slate-950/80 rounded-2xl border border-white/5 text-xs text-indigo-200 overflow-x-auto font-mono max-h-[500px] overflow-y-auto leading-relaxed select-text">
              <code>{SOLIDITY_CODE}</code>
            </pre>

            <div className="p-4 bg-slate-900/60 rounded-xl border border-white/5 text-3xs text-slate-500 leading-relaxed font-mono">
              <span className="block text-2xs text-slate-400 font-bold mb-1">CONTRACT METADATA & COMPILER ARTIFACTS:</span>
              <div>Solidity Compiler Version: solc v0.8.20+commit.a1b2c3d4</div>
              <div>Optimizer Enabled: True (Runs: 200)</div>
              <div>Metadata Checksum: SHA-256 (0x34fba3d20a4f46e5cd1d287a980f1a6b7e8d9c0a9b8c7e8f9a)</div>
            </div>
          </div>
        )}

        {/* TAB 3: CONTRACT ABI CONFIG */}
        {activeTab === 'abi' && (
          <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-6 animate-fadeIn">
            <div className="pb-3 border-b border-white/5 flex justify-between items-center">
              <h3 className="font-extrabold text-white text-base">Application Binary Interface (ABI) JSON config</h3>
              <span className="text-2xs font-semibold text-slate-500 uppercase tracking-widest font-mono">EVM gateway payload interface</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <pre className="p-4 bg-slate-950/80 rounded-2xl border border-white/5 text-2xs text-indigo-300 font-mono max-h-[420px] overflow-y-auto leading-relaxed select-text">
                <code>{JSON.stringify(CONTRACT_ABI, null, 2)}</code>
              </pre>

              <div className="space-y-4">
                <h4 className="font-extrabold text-white text-xs uppercase tracking-widest text-slate-400">Bytecode representation</h4>
                <pre className="p-3 bg-slate-950/40 rounded-xl border border-white/5 text-3xs text-slate-500 font-mono max-h-[220px] overflow-y-auto break-all leading-normal select-all">
                  {CONTRACT_BYTECODE}
                </pre>
                <div className="p-4 bg-slate-900/60 rounded-xl border border-white/5 text-3xs text-slate-400 leading-relaxed space-y-2">
                  <p className="font-bold text-white uppercase tracking-wider text-2xs">EVM Method Signatures Map:</p>
                  <div className="flex gap-2">
                    <span className="font-mono text-indigo-400 font-bold shrink-0">0x34fba3d2</span>
                    <span>registerCertificate(string,string,bytes32)</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-mono text-indigo-400 font-bold shrink-0">0xa8247df6</span>
                    <span>updateCertificateStatus(string,uint8,string)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Transaction Details Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm px-6">
          <div className="glass-panel border border-white/10 rounded-3xl p-6 max-w-xl w-full space-y-5 animate-scaleUp text-xs select-text">
            
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <h4 className="font-extrabold text-white text-base flex items-center gap-1.5">
                <Code2 className="w-5 h-5 text-indigo-400" />
                Transaction Receipt
              </h4>
              <button onClick={() => setSelectedTx(null)} className="text-slate-400 hover:text-white font-sans text-sm font-semibold">
                Exit Receipt
              </button>
            </div>

            <div className="space-y-3 font-mono text-3xs text-slate-400 leading-relaxed">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-slate-500">Transaction Hash:</span>
                <span className="text-white text-right break-all select-all font-bold max-w-[340px]">{selectedTx.hash}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-slate-500">Sender (From):</span>
                <span className="text-slate-400 text-right break-all max-w-[340px]">{selectedTx.from}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-slate-500">Contract Recipient (To):</span>
                <span className="text-indigo-300 text-right break-all max-w-[340px]">{selectedTx.to}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-slate-500">Tx Gas Limit / Gas Used:</span>
                <span className="text-white">{selectedTx.gasLimit} / {selectedTx.gasUsed}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-slate-500">Tx Value:</span>
                <span className="text-emerald-400 font-bold">{selectedTx.value}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-slate-500">Block height:</span>
                <span className="text-indigo-300 font-bold">#{selectedTx.blockNumber}</span>
              </div>
            </div>

            {/* Input Data Payload Box */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <span className="block text-2xs font-extrabold text-slate-500 uppercase tracking-widest font-mono">EVM INPUT DATA PAYLOAD:</span>
              <pre className="p-3 bg-slate-950 rounded-xl border border-white/5 text-3xs text-slate-400 font-mono max-h-[120px] overflow-y-auto break-all leading-normal">
                {selectedTx.inputData}
              </pre>
              <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5 text-3xs text-slate-400 space-y-1.5 leading-relaxed font-sans">
                <span className="font-bold text-white block uppercase tracking-wider">Decoded Payload Parameters:</span>
                <div>Method: <span className="font-mono text-indigo-400 font-semibold">{selectedTx.type === 'ISSUE' ? 'registerCertificate' : 'updateCertificateStatus'}</span></div>
                <div>Certificate ID: <span className="font-mono text-white font-semibold">{selectedTx.certId}</span></div>
                <div>Hash Parameter: <span className="font-mono text-white font-semibold">{selectedTx.certHash}</span></div>
                <div>Student Name Parameter: <span className="text-white font-semibold">{selectedTx.studentName}</span></div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
