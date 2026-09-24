import React, { useEffect, useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  Server,
  Cpu,
  Database,
  Layers,
  Activity,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Globe,
  Radio,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function AdminCloudMonitoring() {
  const { socket } = useSocket();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Traffic simulation state
  const [simUserCount, setSimUserCount] = useState(100);
  const [simRunning, setSimRunning] = useState(false);
  const [simProgress, setSimProgress] = useState(null);
  const [simResult, setSimResult] = useState(null);

  // Accordion for Cloud Concepts
  const [expandedConcept, setExpandedConcept] = useState('elasticity');

  const fetchMetrics = async () => {
    try {
      const res = await api.get('/admin/metrics');
      if (res.data?.success) {
        setMetrics(res.data.metrics);
      }
    } catch (err) {
      console.error('Error fetching telemetry metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();

    if (!socket) return;
    socket.emit('join:admin');

    const handleTelemetry = (data) => {
      setMetrics(data);
    };

    const handleSimProgress = (p) => {
      setSimProgress(p);
    };

    const handleSimCompleted = (r) => {
      setSimRunning(false);
      setSimResult(r);
      fetchMetrics();
    };

    socket.on('admin:telemetry_stream', handleTelemetry);
    socket.on('admin:simulation_progress', handleSimProgress);
    socket.on('admin:simulation_completed', handleSimCompleted);

    return () => {
      socket.emit('leave:admin');
      socket.off('admin:telemetry_stream', handleTelemetry);
      socket.off('admin:simulation_progress', handleSimProgress);
      socket.off('admin:simulation_completed', handleSimCompleted);
    };
  }, [socket]);

  // Trigger high traffic simulation safely on backend
  const handleStartSimulation = async () => {
    setSimRunning(true);
    setSimProgress({ percentage: 0, injected: 0, total: simUserCount });
    setSimResult(null);

    try {
      const res = await api.post('/admin/simulation/start', {
        userCount: simUserCount,
      });
      if (!res.data.success) {
        alert(res.data.message || 'Simulation could not be started');
        setSimRunning(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error triggering traffic burst');
      setSimRunning(false);
    }
  };

  if (loading && !metrics) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-xs font-mono text-slate-400">Loading Cloud Telemetry Graphs & Nodes...</p>
      </div>
    );
  }

  const chartData = metrics?.chartHistory || [];
  const lb = metrics?.loadBalancer || { instances: [], recentRouting: [] };
  const workers = metrics?.workers || { activeWorkers: 2, workers: [], scalingHistory: [] };

  const cloudConcepts = [
    {
      id: 'elasticity',
      title: '1. Elasticity & Horizontal Auto-Scaling',
      desc: 'The capability of a cloud system to adapt dynamically to workload changes by provisioning and de-provisioning worker resources automatically. When our queue length exceeds 50 items, the scaler launches additional worker nodes (up to 8). When traffic subsides, workers are decommissioned down to 2 nodes to save idle compute costs.',
    },
    {
      id: 'loadbalancing',
      title: '2. Layer 7 Load Balancing & Reverse Proxy',
      desc: 'Client HTTP requests first hit our simulated Application Load Balancer (ALB). Utilizing a Round-Robin algorithm across Availability Zones (API-1, API-2, API-3), the ingress traffic is uniformly distributed, preventing server core saturation and single points of failure (SPOF).',
    },
    {
      id: 'queueing',
      title: '3. Queue-Based Architecture (Decoupling)',
      desc: 'Instead of directly hammering the transactional database with thousands of concurrent checkout queries (which would cause lock contention or connection pool exhaustion), purchase requests enter a fast in-memory Redis FIFO queue. Workers pull tasks asynchronously at a controlled throughput.',
    },
    {
      id: 'concurrency',
      title: '4. Concurrency Control & Mutex Locking',
      desc: 'To prevent overselling limited inventory (e.g. 10 laptops requested by 1,000 users), workers perform atomic conditional decrements (`remainingStock > 0`). If stock is exhausted, remaining queue entries receive an immediate SOLD_OUT rejection, mathematically guaranteeing that inventory never drops below 0.',
    },
    {
      id: 'faulttolerance',
      title: '5. Fault Tolerance & Dead-Letter Retries',
      desc: 'If a worker node crashes or network latency delays order creation, the queue entry retry counter increments. Once retries exceed threshold (2), the item is flagged as FAILED without blocking the queue. Furthermore, a background reaper releases temporary 120-second stock reservations if payment is neglected.',
    },
    {
      id: 'caching',
      title: '6. In-Memory Caching (Redis)',
      desc: 'Flash sale metadata, real-time stock levels, and queue position lookups are resolved in memory at sub-millisecond speeds (< 2ms) rather than querying disk storage on every user refresh.',
    },
    {
      id: 'stateless',
      title: '7. Stateless REST API Design',
      desc: 'All backend API nodes (API-1, API-2, API-3) remain stateless. User identity is encapsulated in signed JWT bearer tokens. Any API instance can handle any incoming request seamlessly, allowing frictionless horizontal auto-scaling without sticky session dependencies.',
    },
    {
      id: 'monitoring',
      title: '8. Real-Time Telemetry & Observability',
      desc: 'Continuous metrics collection (CPU %, RAM %, RPS, latency, queue length) emitted through WebSockets gives administrators instant visibility into infrastructure bottlenecks during peak traffic storms.',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Cloud Simulation Trigger Box */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping" />
              <h2 className="text-xl font-bold text-white">Cloud High-Traffic Load Generator</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Simulate high-concurrency thundering herd requests to demonstrate virtual queue buffering & auto-scaler scaling
            </p>
          </div>

          {/* Traffic Level Selector */}
          <div className="flex items-center space-x-2">
            {[100, 500, 1000, 5000].map((count) => (
              <button
                key={count}
                onClick={() => setSimUserCount(count)}
                disabled={simRunning}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                  simUserCount === count
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {count} Users
              </button>
            ))}

            <button
              onClick={handleStartSimulation}
              disabled={simRunning}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center space-x-2 transition-all shadow-lg shadow-sky-500/25 disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{simRunning ? 'BURSTING...' : 'START TRAFFIC SIMULATION'}</span>
            </button>
          </div>
        </div>

        {/* Live Simulation Progress */}
        {simRunning && simProgress && (
          <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-sky-400 font-bold flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                <span>Injecting Simulated Shoppers: {simProgress.injected} / {simProgress.total}</span>
              </span>
              <span className="text-white font-bold">{simProgress.percentage}%</span>
            </div>
            <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-sky-500 to-indigo-500 h-full transition-all duration-300"
                style={{ width: `${simProgress.percentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Simulation Result Banner */}
        {simResult && (
          <div className="bg-emerald-950/40 border border-emerald-500/40 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
              <div>
                <div className="font-bold text-white text-sm">Simulation Completed Successfully!</div>
                <div className="text-slate-300">
                  Injected {simResult.injectedCount} shoppers in {simResult.durationSec}s at{' '}
                  <strong className="text-emerald-400">{simResult.rps} req/sec</strong>.
                </div>
              </div>
            </div>
            <div className="text-slate-400 text-[11px]">
              Workers processed requests without database crashes.
            </div>
          </div>
        )}
      </div>

      {/* Real-time Telemetry Graphs (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graph 1: Host CPU & Memory Utilization */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-mono text-sky-400 uppercase font-semibold">Instance Health</span>
              <h3 className="font-bold text-white text-sm">CPU & Memory Utilization (%)</h3>
            </div>
            <div className="flex items-center space-x-3 text-xs font-mono">
              <span className="text-sky-400">● CPU</span>
              <span className="text-purple-400">● RAM</span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                />
                <Area type="monotone" dataKey="cpu" stroke="#0284c7" fillOpacity={1} fill="url(#cpuGrad)" />
                <Area type="monotone" dataKey="memory" stroke="#a855f7" fillOpacity={1} fill="url(#memGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graph 2: Requests Per Second (RPS) & Queue Pressure */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-mono text-emerald-400 uppercase font-semibold">Queue Pipeline</span>
              <h3 className="font-bold text-white text-sm">Throughput (RPS) vs Queue Depth</h3>
            </div>
            <div className="flex items-center space-x-3 text-xs font-mono">
              <span className="text-emerald-400">● RPS</span>
              <span className="text-amber-400">● Queue Depth</span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                />
                <Line
                  type="monotone"
                  dataKey="rps"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="queueLength"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Load Balancing Simulation & Auto-Scaling Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Load Balancer Activity */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4 text-sky-400" />
              <h3 className="font-bold text-white text-sm">Load Balancer (Round-Robin Distribution)</h3>
            </div>
            <span className="text-[10px] font-mono bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded">
              L7 Virtual Routing
            </span>
          </div>

          {/* Node Cards */}
          <div className="grid grid-cols-3 gap-3">
            {lb.instances.map((inst) => (
              <div key={inst.id} className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{inst.id}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
                <div className="text-[10px] text-slate-400 font-mono">{inst.ip}</div>
                <div className="text-base font-black text-sky-400 font-mono pt-1">
                  {inst.totalRequests}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  Share: <strong className="text-slate-300">{inst.sharePercentage}</strong>
                </div>
              </div>
            ))}
          </div>

          {/* Live Packet Ingress */}
          <div className="space-y-2 pt-2">
            <div className="text-xs font-mono text-slate-400 flex items-center justify-between">
              <span>Live Ingress Routing Log:</span>
              <span className="text-[10px] text-emerald-400">Round-Robin Active</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800/80 font-mono text-[11px] space-y-1.5 max-h-36 overflow-y-auto">
              {lb.recentRouting?.length === 0 ? (
                <div className="text-slate-500">No requests handled yet.</div>
              ) : (
                lb.recentRouting?.map((r) => (
                  <div key={r.id} className="flex justify-between items-center text-slate-400 hover:text-white">
                    <span className="text-sky-400">{r.method} {r.path}</span>
                    <span className="text-slate-500">→</span>
                    <span className="text-emerald-400 font-bold bg-slate-900 px-1.5 py-0.5 rounded">
                      {r.routedTo}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Auto-Scaling Simulation & Worker Pool */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-white text-sm">Auto-Scaling Elasticity Engine</h3>
            </div>
            <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded">
              Current Fleet: {workers.activeWorkers} Nodes
            </span>
          </div>

          {/* Active Worker Nodes Display */}
          <div className="space-y-2">
            <div className="text-xs font-mono text-slate-400 flex justify-between">
              <span>Dynamic Worker Node Pool:</span>
              <span>Min {workers.minWorkers} — Max {workers.maxWorkers}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {workers.workers?.map((w) => (
                <div
                  key={w.id}
                  className={`p-2.5 rounded-xl border text-center font-mono text-xs transition-colors ${
                    w.status === 'BUSY'
                      ? 'bg-amber-950/40 border-amber-500/50 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="font-bold">{w.id}</div>
                  <div className="text-[10px] mt-0.5 font-semibold">
                    {w.status === 'BUSY' ? '⚡ BUSY' : 'IDLE'}
                  </div>
                  <div className="text-[9px] text-slate-500 mt-1">Jobs: {w.processedCount}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Auto-Scaling Events Log */}
          <div className="space-y-2 pt-2">
            <div className="text-xs font-mono text-slate-400">Auto-Scaling Event Stream:</div>
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800/80 font-mono text-[11px] space-y-2 max-h-36 overflow-y-auto">
              {workers.scalingHistory?.length === 0 ? (
                <div className="text-slate-500">
                  Auto-scaler steady state (Queue below scale-up threshold). Trigger high traffic to scale up.
                </div>
              ) : (
                workers.scalingHistory?.map((ev) => (
                  <div
                    key={ev.id}
                    className={`p-1.5 rounded ${
                      ev.type === 'SCALE_UP'
                        ? 'bg-sky-950/60 text-sky-300 border border-sky-800/40'
                        : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    <div className="font-bold">{ev.message}</div>
                    <div className="text-[9px] text-slate-500">{new Date(ev.timestamp).toLocaleTimeString()}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cloud Computing Concepts Explanatory Panel (Section 29) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="flex items-center space-x-2 pb-4 border-b border-slate-800">
          <BookOpen className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="text-lg font-bold text-white">Academic Cloud Computing Concepts</h3>
            <p className="text-xs text-slate-400">
              Theoretical architectural principles demonstrated by this project
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cloudConcepts.map((concept) => {
            const isExpanded = expandedConcept === concept.id;
            return (
              <div
                key={concept.id}
                onClick={() => setExpandedConcept(isExpanded ? null : concept.id)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                  isExpanded
                    ? 'bg-slate-950 border-indigo-500/50 shadow-lg'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-xs">{concept.title}</h4>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-indigo-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  )}
                </div>
                {isExpanded && (
                  <p className="text-xs text-slate-300 leading-relaxed mt-3 pt-3 border-t border-slate-800 font-sans">
                    {concept.desc}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
