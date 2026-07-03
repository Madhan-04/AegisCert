import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Cpu, Play, CheckCircle2, RefreshCw, Sliders, Activity, Database, Shield, Zap, Plus } from 'lucide-react';
import confetti from 'canvas-confetti';

interface VerificationJob {
  id: string;
  targetId: string;
  name: string;
  progress: number;
  stage: 'idle' | 'hashing' | 'signing' | 'consensus' | 'completed' | 'failed';
  threadId: number;
}

interface QueueTask {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  priority: 'high' | 'medium' | 'low';
}

export default function MissionControl() {
  const [jobs, setJobs] = useState<VerificationJob[]>([
    { id: 'job-1', targetId: 'CERT-2026-0001', name: 'Alex Johnson (MIT B.S.)', progress: 0, stage: 'idle', threadId: 1 },
    { id: 'job-2', targetId: 'CERT-2026-0002', name: 'Sarah Connor (MIT M.S.)', progress: 0, stage: 'idle', threadId: 2 },
    { id: 'job-3', targetId: 'CERT-DECOY-777', name: 'Decoy Trap (Mit Honey)', progress: 0, stage: 'idle', threadId: 3 },
    { id: 'job-4', targetId: 'CERT-2025-4819', name: 'David Miller (MIT B.S.)', progress: 0, stage: 'idle', threadId: 4 },
    { id: 'job-5', targetId: 'CERT-2025-2810', name: 'Emily Davis (MIT M.S.)', progress: 0, stage: 'idle', threadId: 5 }
  ]);

  const [isRunning, setIsRunning] = useState(false);
  const [activeThreads, setActiveThreads] = useState(0);
  const [throughput, setThroughput] = useState(0);

  // Background Task Queue
  const [taskQueue, setTaskQueue] = useState<QueueTask[]>([
    { id: 'tsk-881', name: 'Sync block headers with PoS ledger', status: 'completed', priority: 'high' },
    { id: 'tsk-882', name: 'Evaluate IP reputation risk logs', status: 'processing', priority: 'high' },
    { id: 'tsk-883', name: 'Verify database Merkle root digest', status: 'pending', priority: 'medium' },
    { id: 'tsk-884', name: 'Parse registrar certificate key rings', status: 'pending', priority: 'low' }
  ]);

  // Automated workflows toggles
  const [workflows, setWorkflows] = useState({
    autoApprove: true,
    forceBiometrics: false,
    autoLockout: true,
    autoMitigate: false
  });

  const handleWorkflowToggle = (key: keyof typeof workflows) => {
    setWorkflows(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      
      const admin = db.getCurrentUser();
      db.addAuditLog(
        admin?.id || 'admin',
        admin?.name || 'Admin',
        'admin',
        'WORKFLOW_SETTING_UPDATED',
        `Workflow policy toggled: ${key} = ${updated[key]}`,
        'success',
        20
      );
      return updated;
    });
  };

  const startParallelVerification = () => {
    if (isRunning) return;
    setIsRunning(true);
    setActiveThreads(5);
    setThroughput(0);

    // Reset progress
    setJobs(prev => prev.map(j => ({ ...j, progress: 0, stage: 'hashing' })));

    // Run parallel simulations
    const interval = setInterval(() => {
      setJobs(prev => {
        let allCompleted = true;
        const nextJobs = prev.map(job => {
          let nextProgress = job.progress;
          let nextStage = job.stage;

          if (job.progress < 100) {
            allCompleted = false;
            // Generate varied increments to look organic
            const increment = Math.floor(5 + Math.random() * 15);
            nextProgress = Math.min(100, job.progress + increment);

            // Determine stages depending on progress brackets
            if (nextProgress >= 100) {
              // Decoy cert fails verification in pipeline!
              if (job.targetId === 'CERT-DECOY-777') {
                nextStage = 'failed';
                
                // SOC Alert
                db.addSocEvent('critical', 'PIPELINE_DECOY_MATCH', `Pipeline Alert: Decoy certificate targeted during multi-threaded audit: ${job.targetId}`, '127.0.0.1');
                db.addFraudReport('tampered_cert', 99, `Decoy Trap: Access attempt on decoy certificate ID ${job.targetId} during pipeline scan.`);
              } else {
                nextStage = 'completed';
              }
            } else if (nextProgress >= 70) {
              nextStage = 'consensus';
            } else if (nextProgress >= 40) {
              nextStage = 'signing';
            } else {
              nextStage = 'hashing';
            }
          }

          return {
            ...job,
            progress: nextProgress,
            stage: nextStage
          };
        });

        if (allCompleted) {
          clearInterval(interval);
          setIsRunning(false);
          setActiveThreads(0);
          setThroughput(4.2); // TPS throughput
          
          confetti({
            particleCount: 50,
            spread: 40,
            colors: ['#6366F1', '#10B981']
          });

          const admin = db.getCurrentUser();
          db.addAuditLog(
            admin?.id || 'admin',
            admin?.name || 'Admin',
            'admin',
            'PARALLEL_AUDIT_COMPLETED',
            'Completed multi-threaded parallel audit sweep over 5 certificate registers',
            'success',
            15
          );
        }

        return nextJobs;
      });
    }, 400);
  };

  const addQueueTask = () => {
    const taskIds = Math.floor(100 + Math.random() * 900);
    const taskNames = [
      'Clean expired active session tokens',
      'Optimize database field level keys',
      'Purge legacy SOC dashboard log backups',
      'Scan for concurrent login travel locations'
    ];
    const priorities = ['low', 'medium', 'high'] as const;

    const newTask: QueueTask = {
      id: `tsk-${taskIds}`,
      name: taskNames[Math.floor(Math.random() * taskNames.length)],
      status: 'pending',
      priority: priorities[Math.floor(Math.random() * priorities.length)]
    };

    setTaskQueue(prev => [...prev, newTask]);

    // Simulate task processing in queue
    setTimeout(() => {
      setTaskQueue(prev => prev.map(t => t.id === newTask.id ? { ...t, status: 'processing' } : t));
      
      setTimeout(() => {
        setTaskQueue(prev => prev.map(t => t.id === newTask.id ? { ...t, status: 'completed' } : t));
      }, 1500);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 flex items-center gap-2">
          <Cpu className="w-6 h-6 text-indigo-400" />
          Mission Control Operations
        </h1>
        <p className="text-xs text-slate-400">
          Orchestrate multi-threaded tasks, trigger parallel validation runs, inspect active task queues, and set automated workflow rules.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-500 font-mono">Active Pipelines</span>
          <div className="text-xl font-black text-white mt-2 font-mono flex items-baseline gap-1">
            {activeThreads}
            <span className="text-2xs text-slate-500 font-normal">/ 8 threads</span>
          </div>
        </div>
        <div className="glass-panel border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-indigo-400 font-mono">Auditing Throughput</span>
          <div className="text-xl font-black text-indigo-400 mt-2 font-mono flex items-baseline gap-1">
            {throughput}
            <span className="text-2xs text-slate-500 font-normal">TPS</span>
          </div>
        </div>
        <div className="glass-panel border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-emerald-400 font-mono">Completed Runs</span>
          <div className="text-xl font-black text-emerald-400 mt-2 font-mono">148</div>
        </div>
        <div className="glass-panel border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-500 font-mono">Ecosystem Load</span>
          <div className="text-xl font-black text-white mt-2 font-mono">12%</div>
        </div>
      </div>

      {/* Grid: Pipelines & Side panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns: Parallel Verification Pipelines */}
        <div className="lg:col-span-2 glass-panel border border-white/10 rounded-2xl p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4.5 h-4.5 text-indigo-400" />
              Parallel Verification Thread Sweep
            </h2>
            
            <button
              onClick={startParallelVerification}
              disabled={isRunning}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 hover:scale-[1.02]"
            >
              <Play className="w-3.5 h-3.5" />
              Trigger Parallel Audit
            </button>
          </div>

          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job.id} className="p-4 bg-slate-950/40 border border-white/5 rounded-xl space-y-2.5">
                <div className="flex justify-between text-2xs font-mono">
                  <div>
                    <span className="text-slate-500 mr-2">Thread #{job.threadId}:</span>
                    <span className="text-slate-200 font-bold">{job.name}</span>
                  </div>
                  <span className={`font-bold capitalize ${
                    job.stage === 'completed' ? 'text-emerald-400' :
                    job.stage === 'failed' ? 'text-rose-400' :
                    job.stage === 'idle' ? 'text-slate-500' :
                    'text-indigo-400 animate-pulse'
                  }`}>
                    {job.stage === 'idle' ? 'Idle' : `${job.stage} (${job.progress}%)`}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      job.stage === 'completed' ? 'bg-emerald-500' :
                      job.stage === 'failed' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' :
                      'bg-indigo-500'
                    }`}
                    style={{ width: `${job.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Workflow Switches & Task Queue */}
        <div className="space-y-6">
          
          {/* Automated Workflows settings */}
          <div className="glass-panel border border-white/10 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-1.5 border-b border-white/5 pb-3">
              <Sliders className="w-4 h-4 text-indigo-400" />
              Automated Operations
            </h3>

            <div className="space-y-3.5">
              <div className="flex justify-between items-center">
                <div className="space-y-0.5 max-w-[80%]">
                  <span className="text-2xs font-bold text-slate-200 font-mono">Auto-Approve Registrations</span>
                  <p className="text-[10px] text-slate-500 leading-tight">Instantly approve university registrar applications matching registry records.</p>
                </div>
                <input
                  type="checkbox"
                  checked={workflows.autoApprove}
                  onChange={() => handleWorkflowToggle('autoApprove')}
                  className="rounded border-white/10 text-indigo-600 focus:ring-indigo-500 w-4 h-4 bg-slate-900 cursor-pointer"
                />
              </div>

              <div className="flex justify-between items-center">
                <div className="space-y-0.5 max-w-[80%]">
                  <span className="text-2xs font-bold text-slate-200 font-mono">Lock High-Risk IPs</span>
                  <p className="text-[10px] text-slate-500 leading-tight">Auto-block locations showing brute-force or travel mismatches.</p>
                </div>
                <input
                  type="checkbox"
                  checked={workflows.autoLockout}
                  onChange={() => handleWorkflowToggle('autoLockout')}
                  className="rounded border-white/10 text-indigo-600 focus:ring-indigo-500 w-4 h-4 bg-slate-900 cursor-pointer"
                />
              </div>

              <div className="flex justify-between items-center">
                <div className="space-y-0.5 max-w-[80%]">
                  <span className="text-2xs font-bold text-slate-200 font-mono">Force Biometrics on Verifiers</span>
                  <p className="text-[10px] text-slate-500 leading-tight">Require liveness facial checks for any query query checks.</p>
                </div>
                <input
                  type="checkbox"
                  checked={workflows.forceBiometrics}
                  onChange={() => handleWorkflowToggle('forceBiometrics')}
                  className="rounded border-white/10 text-indigo-600 focus:ring-indigo-500 w-4 h-4 bg-slate-900 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Background Task Queue */}
          <div className="glass-panel border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-400" />
                Background Job Queue
              </h3>
              <button
                onClick={addQueueTask}
                className="p-1 rounded bg-slate-900 border border-white/5 text-slate-400 hover:text-white transition-all"
                title="Add new worker job"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {taskQueue.map((task) => (
                <div key={task.id} className="p-2.5 bg-slate-950/40 border border-white/2 rounded-xl flex justify-between items-center text-2xs font-mono">
                  <div className="min-w-0 flex-1 pr-2">
                    <span className="text-slate-500 text-[10px] block truncate">{task.id}</span>
                    <span className="text-slate-300 font-medium truncate block leading-normal">{task.name}</span>
                  </div>
                  
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    task.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                    task.status === 'processing' ? 'bg-indigo-500/10 text-indigo-400 animate-pulse' :
                    'bg-slate-900 text-slate-500'
                  }`}>
                    {task.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
