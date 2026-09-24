import React from 'react';
import { Users, Globe, ArrowDown, Server, Cpu, Database, CheckCircle2, Zap } from 'lucide-react';

export default function CloudArchDiagram({ activeWorkers = 3, queueDepth = 0, currentRps = 12 }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-800 gap-2">
        <div>
          <span className="text-[11px] font-mono uppercase text-sky-400 font-semibold tracking-wider">
            Architecture Topology
          </span>
          <h3 className="text-lg font-bold text-white">Distributed Flash-Sale Cloud Pipeline</h3>
        </div>
        <div className="flex items-center space-x-3 text-xs font-mono">
          <span className="flex items-center space-x-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>ALB Round-Robin Active</span>
          </span>
          <span className="text-slate-400">|</span>
          <span className="text-sky-400 font-semibold">{currentRps} req/s</span>
        </div>
      </div>

      {/* Interactive Topology Graph */}
      <div className="py-8 flex flex-col items-center space-y-6">
        {/* Tier 1: Concurrent Shopper Clients */}
        <div className="w-full max-w-md bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between shadow-inner">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Concurrent Shoppers (Thundering Herd)</div>
              <div className="text-[11px] text-slate-400 font-mono">Thousands of simultaneous "Buy Now" clicks</div>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[10px] font-mono font-bold">
            CLIENT TIER
          </span>
        </div>

        {/* Down Arrow */}
        <div className="flex items-center text-sky-400 animate-bounce">
          <ArrowDown className="w-5 h-5" />
        </div>

        {/* Tier 2: Layer 7 Application Load Balancer */}
        <div className="w-full max-w-lg bg-gradient-to-r from-sky-950/50 via-slate-900 to-indigo-950/50 border border-sky-500/30 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-bold text-white tracking-wide">Application Load Balancer (AWS ALB / L7)</span>
            </div>
            <span className="text-[10px] font-mono bg-sky-400/10 text-sky-400 px-2 py-0.5 rounded">
              Weighted Round-Robin
            </span>
          </div>

          {/* Three Virtual API Server Nodes */}
          <div className="grid grid-cols-3 gap-3">
            {['API-1 (us-east-1a)', 'API-2 (us-east-1b)', 'API-3 (us-east-1c)'].map((srv, idx) => (
              <div
                key={srv}
                className="bg-slate-950/90 border border-slate-800 hover:border-sky-500/50 rounded-lg p-2.5 text-center transition-colors"
              >
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[11px] font-bold text-slate-200">API Node {idx + 1}</span>
                </div>
                <div className="text-[9px] text-slate-400 font-mono">{srv.split(' ')[1]}</div>
                <div className="mt-1 text-[9px] text-sky-400 font-mono">10.0.{idx + 1}.{12 + idx * 30}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Down Arrow */}
        <div className="flex items-center text-indigo-400 animate-bounce">
          <ArrowDown className="w-5 h-5" />
        </div>

        {/* Tier 3: Redis Distributed Queue & Caching Layer */}
        <div className="w-full max-w-md bg-slate-950/80 border border-indigo-500/40 rounded-xl p-4 shadow-lg relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-white">Redis Virtual Queue & State Cache</span>
            </div>
            <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded">
              In-Memory FIFO
            </span>
          </div>
          <div className="flex items-center justify-between text-xs font-mono bg-slate-900 p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-400">Queue Depth:</span>
            <span className="text-amber-400 font-bold text-sm">{queueDepth} queued requests</span>
          </div>
        </div>

        {/* Down Arrow */}
        <div className="flex items-center text-emerald-400 animate-bounce">
          <ArrowDown className="w-5 h-5" />
        </div>

        {/* Tier 4: Auto-Scaling Worker Nodes */}
        <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white">Auto-Scaling Worker Fleet</span>
            </div>
            <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
              {activeWorkers} Nodes Active
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Array.from({ length: Math.min(8, activeWorkers) }).map((_, i) => (
              <div key={i} className="bg-slate-950 border border-slate-800 rounded p-2 text-center font-mono text-[10px]">
                <div className="text-emerald-400 font-semibold">Worker-{i + 1}</div>
                <div className="text-slate-400 text-[9px] mt-0.5">Atomic Mutex</div>
              </div>
            ))}
          </div>
        </div>

        {/* Down Arrow */}
        <div className="flex items-center text-amber-400">
          <ArrowDown className="w-5 h-5" />
        </div>

        {/* Tier 5: Persistence Layer (MongoDB) */}
        <div className="w-full max-w-md bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Cloud Database (MongoDB / Atlas)</div>
              <div className="text-[11px] text-slate-400 font-mono">Conditional update: remainingStock &gt; 0</div>
            </div>
          </div>
          <div className="flex items-center space-x-1 text-emerald-400 text-xs font-mono">
            <CheckCircle2 className="w-4 h-4" />
            <span>Zero Overselling</span>
          </div>
        </div>
      </div>
    </div>
  );
}
