import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';
import {
  Users,
  Zap,
  Activity,
  ShoppingBag,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Play,
  TrendingUp,
  Server,
  Cpu,
  Layers,
  Clock,
  ArrowRight,
} from 'lucide-react';

export default function AdminDashboard() {
  const { socket } = useSocket();
  const [metrics, setMetrics] = useState(null);
  const [flashSale, setFlashSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resettingStock, setResettingStock] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  const fetchDashboardData = async () => {
    try {
      const [metricsRes, saleRes] = await Promise.all([
        api.get('/admin/metrics'),
        api.get('/flash-sales/active'),
      ]);

      if (metricsRes.data?.success) {
        setMetrics(metricsRes.data.metrics);
      }
      if (saleRes.data?.success) {
        setFlashSale(saleRes.data.flashSale);
      }
    } catch (err) {
      console.error('Error fetching admin overview', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    if (!socket) return;
    socket.emit('join:admin');

    const handleTelemetry = (data) => {
      setMetrics(data);
    };

    socket.on('admin:telemetry_stream', handleTelemetry);

    return () => {
      socket.emit('leave:admin');
      socket.off('admin:telemetry_stream', handleTelemetry);
    };
  }, [socket]);

  // Demo shortcut: Reset inventory to 10
  const handleResetStock = async () => {
    if (!flashSale) return;
    setResettingStock(true);
    setResetMessage('');
    try {
      const saleId = flashSale._id || flashSale.id;
      const res = await api.post(`/flash-sales/${saleId}/reset-stock`, { stock: 10 });
      if (res.data?.success) {
        setFlashSale(res.data.flashSale);
        setResetMessage('Stock successfully reset to 10 units for demonstration!');
        setTimeout(() => setResetMessage(''), 4000);
      }
    } catch (err) {
      alert('Failed to reset stock');
    } finally {
      setResettingStock(false);
    }
  };

  if (loading && !metrics) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-xs font-mono text-slate-400">Loading telemetry cluster...</p>
      </div>
    );
  }

  const s = metrics?.summary || {};

  return (
    <div className="space-y-8">
      {/* Top Banner Actions */}
      <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-1 text-center md:text-left">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-mono font-bold">
            <Zap className="w-3 h-3 text-indigo-400 fill-indigo-400" />
            <span>COLLEGE DEMO BENCHMARK</span>
          </div>
          <h2 className="text-2xl font-black text-white">Dynamic Flash Sale Orchestrator</h2>
          <p className="text-xs text-slate-400 max-w-xl">
            Simulate 100+ simultaneous purchase requests against 10 inventory units to verify zero overselling and
            auto-scaling elasticity.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleResetStock}
            disabled={resettingStock || !flashSale}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 text-xs font-bold font-mono flex items-center space-x-2 transition-all"
          >
            <RotateCcw className={`w-4 h-4 ${resettingStock ? 'animate-spin' : ''}`} />
            <span>RESET STOCK TO 10</span>
          </button>

          <Link
            to="/admin/cloud-monitoring"
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center space-x-2 transition-all shadow-lg shadow-indigo-600/30"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>START TRAFFIC SIMULATION</span>
          </Link>
        </div>
      </div>

      {resetMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{resetMessage}</span>
        </div>
      )}

      {/* 8 Primary Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Total Shoppers</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-3xl font-black text-white font-mono">{s.totalUsers || 0}</div>
          <div className="text-[11px] text-slate-500 font-mono">Registered Shoppers</div>
        </div>

        {/* Active Flash Sales */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Active Flash Sales</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-400 font-mono">{s.activeFlashSales || 0}</div>
          <div className="text-[11px] text-slate-500 font-mono">Live campaigns</div>
        </div>

        {/* Queue Length */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Waiting in Queue</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-black text-indigo-400 font-mono">{s.queueLength || 0}</div>
          <div className="text-[11px] text-slate-500 font-mono">Pending worker reservation</div>
        </div>

        {/* System Load */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>System Load (CPU)</span>
            <Cpu className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-black text-white font-mono">{s.systemLoad || '18%'}</div>
          <div className="text-[11px] text-slate-500 font-mono">Host instance load</div>
        </div>

        {/* Successful Orders */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Successful Purchases</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400 font-mono">{s.successOrders || 0}</div>
          <div className="text-[11px] text-slate-500 font-mono">Units safely allocated</div>
        </div>

        {/* Failed Orders */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Rejected / Sold Out</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-black text-rose-400 font-mono">{s.failedOrders || 0}</div>
          <div className="text-[11px] text-slate-500 font-mono">Zero overselling protection</div>
        </div>

        {/* Remaining Stock */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Remaining Stock</span>
            <ShoppingBag className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-3xl font-black text-sky-400 font-mono">
            {flashSale ? flashSale.remainingStock : 0}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Total capacity: {flashSale ? flashSale.totalStock : 0}
          </div>
        </div>

        {/* Orders / Throughput */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Throughput (RPS)</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-black text-purple-400 font-mono">{s.requestsPerSec || 0} req/s</div>
          <div className="text-[11px] text-slate-500 font-mono">Dynamic requests rate</div>
        </div>
      </div>

      {/* Cloud Nodes Status Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Load Balancer Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Server className="w-4 h-4 text-sky-400" />
              <h3 className="font-bold text-white text-sm">Load Balancer (L7)</h3>
            </div>
            <span className="text-[10px] font-mono bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded">
              Round-Robin
            </span>
          </div>

          <div className="space-y-2">
            {metrics?.loadBalancer?.instances?.map((inst) => (
              <div
                key={inst.id}
                className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs font-mono"
              >
                <div>
                  <div className="text-slate-200 font-semibold">{inst.id}</div>
                  <div className="text-[10px] text-slate-500">{inst.ip}</div>
                </div>
                <div className="text-right">
                  <div className="text-sky-400 font-bold">{inst.totalRequests} reqs</div>
                  <div className="text-[10px] text-slate-500">{inst.sharePercentage}</div>
                </div>
              </div>
            ))}
          </div>

          <Link
            to="/admin/cloud-monitoring"
            className="block text-center text-xs text-sky-400 hover:underline pt-1"
          >
            View Live Balancer Graphs →
          </Link>
        </div>

        {/* Auto-Scaling Workers Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-white text-sm">Worker Fleet</h3>
            </div>
            <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded">
              {metrics?.workers?.activeWorkers || 2} Active Nodes
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Fleet Capacity:</span>
                <span className="text-white">
                  Min {metrics?.workers?.minWorkers || 2} — Max {metrics?.workers?.maxWorkers || 8}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Avg Worker Duration:</span>
                <span className="text-emerald-400 font-bold">
                  {metrics?.workers?.avgProcessingTimeMs || 65}ms
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Processed Total:</span>
                <span className="text-purple-400 font-bold">
                  {metrics?.workers?.totalProcessed || 0} jobs
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Workers pick items from the Redis FIFO queue, execute conditional inventory updates, and emit WebSockets.
            </div>
          </div>

          <Link to="/admin/queue" className="block text-center text-xs text-emerald-400 hover:underline pt-1">
            Monitor Live Queue Bars →
          </Link>
        </div>

        {/* Cloud Database & Redis State */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-white text-sm">Storage & Caching</h3>
            </div>
            <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded">
              ONLINE
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
              <div className="text-slate-200 font-bold">Redis Queue Engine</div>
              <div className="text-[10px] text-slate-400">{metrics?.redis?.mode}</div>
              <div className="flex justify-between pt-1 text-slate-400">
                <span>Ops / Hit-Rate:</span>
                <span className="text-amber-400">{metrics?.redis?.hitRate}</span>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
              <div className="text-slate-200 font-bold">MongoDB Persistence</div>
              <div className="text-[10px] text-slate-400">{metrics?.database?.mode}</div>
              <div className="flex justify-between pt-1 text-slate-400">
                <span>Queries Executed:</span>
                <span className="text-sky-400">{metrics?.database?.queryCount}</span>
              </div>
            </div>
          </div>

          <Link to="/admin/system-health" className="block text-center text-xs text-amber-400 hover:underline pt-1">
            View Component Health →
          </Link>
        </div>
      </div>
    </div>
  );
}
