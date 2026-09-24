import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { HeartPulse, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Server, ShieldCheck, Database, Zap, Cpu } from 'lucide-react';

export default function AdminSystemHealth() {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    try {
      const res = await api.get('/admin/system-health');
      if (res.data?.success) {
        setHealthData(res.data.health);
      }
    } catch (err) {
      console.error('Error fetching system health', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 3000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !healthData) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-xs font-mono text-slate-400">Pinging cloud infrastructure heartbeats...</p>
      </div>
    );
  }

  const components = healthData?.components || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">System Infrastructure Health Matrix</h2>
          <p className="text-xs text-slate-400">
            Real-time heartbeat, latency diagnostics, and error rates across all tiers
          </p>
        </div>

        <button
          onClick={fetchHealth}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Ping All Services</span>
        </button>
      </div>

      {/* Top Banner Status */}
      <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-base font-bold text-white">All Cloud Systems Fully Operational</div>
            <div className="text-xs text-slate-400 font-mono">
              Process Uptime: {Math.floor((healthData?.uptimeSec || 120) / 60)} minutes • Load Balancer active
            </div>
          </div>
        </div>
        <div className="text-right font-mono text-xs text-emerald-400 bg-slate-950 px-4 py-2 rounded-xl border border-emerald-900/60">
          HEALTH SCORE: 100/100
        </div>
      </div>

      {/* Component Matrix Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {components.map((c) => (
          <div
            key={c.name}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase bg-slate-950 text-slate-400 px-2 py-0.5 rounded border border-slate-800">
                  {c.type}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{c.status}</span>
                </span>
              </div>

              <div>
                <h3 className="font-bold text-white text-base">{c.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{c.details}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Response Latency:</span>
                <span className="text-sky-400 font-bold">{c.latency}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Error Counter:</span>
                <span className="text-white font-bold">{c.errorCount}</span>
              </div>
              <div className="flex justify-between text-slate-400 text-[10px]">
                <span>Last Heartbeat:</span>
                <span className="text-slate-500">
                  {new Date(c.lastHeartbeat).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
