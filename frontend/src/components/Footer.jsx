import React from 'react';
import { Cloud, ShieldCheck, Cpu, Database, Server } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 text-slate-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
                <Cloud className="w-4 h-4" />
              </div>
              <span className="text-white font-bold text-base">Dynamic Cloud Queue</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Enterprise architecture prototype demonstrating horizontal scaling, Redis-backed FIFO virtual queues,
              atomic mutex inventory locks, and auto-scaling worker nodes under thundering herd conditions.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">Cloud Architecture</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center space-x-1.5">
                <Server className="w-3.5 h-3.5 text-sky-400" />
                <span>Round-Robin Load Balancer (L7)</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                <span>Auto-Scaling Worker Fleet</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <Database className="w-3.5 h-3.5 text-rose-400" />
                <span>Redis Distributed Mutex & Queue</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Conditional Atomic Decrement</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">Simulated Regions</h4>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center text-slate-300">
                <span>us-east-1a (API-1)</span>
                <span className="text-emerald-400 text-[10px]">HEALTHY</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>us-east-1b (API-2)</span>
                <span className="text-emerald-400 text-[10px]">HEALTHY</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>us-east-1c (API-3)</span>
                <span className="text-emerald-400 text-[10px]">HEALTHY</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">Academic Context</h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Built for Cloud Computing academic demonstrations. Simulates peak flash-sale concurrency with zero
              inventory leakage.
            </p>
            <div className="text-[11px] font-mono text-sky-400 bg-sky-950/40 p-2 rounded border border-sky-900/50">
              Zero Overselling Protocol: Verified
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
          <p>© 2026 Dynamic Cloud E-Commerce Flash Sale Queue. All rights reserved.</p>
          <div className="flex items-center space-x-4 mt-2 sm:mt-0">
            <span>Node.js / Express</span>
            <span>•</span>
            <span>React / Vite</span>
            <span>•</span>
            <span>Redis Queue</span>
            <span>•</span>
            <span>Socket.IO</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
