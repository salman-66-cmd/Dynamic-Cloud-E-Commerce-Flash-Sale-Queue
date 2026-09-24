import React, { useEffect, useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';
import { Users, Cpu, Clock, CheckCircle2, XCircle, RefreshCw, Activity, ArrowRight } from 'lucide-react';

export default function AdminQueueMonitor() {
  const { socket } = useSocket();
  const [queueOverview, setQueueOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOverview = async () => {
    try {
      const res = await api.get('/admin/queue');
      if (res.data?.success) {
        setQueueOverview(res.data);
      }
    } catch (err) {
      console.error('Error fetching queue monitor', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();

    if (!socket) return;
    socket.emit('join:admin');

    const handleQueueStat = () => {
      fetchOverview();
    };

    const handleTelemetry = () => {
      // Periodic background sync
      fetchOverview();
    };

    socket.on('admin:queue_stat', handleQueueStat);
    socket.on('admin:telemetry_stream', handleTelemetry);

    const interval = setInterval(fetchOverview, 2500);

    return () => {
      socket.off('admin:queue_stat', handleQueueStat);
      socket.off('admin:telemetry_stream', handleTelemetry);
      clearInterval(interval);
    };
  }, [socket]);

  if (loading && !queueOverview) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
        <p className="text-xs font-mono text-slate-400">Loading queue telemetrics...</p>
      </div>
    );
  }

  const stats = queueOverview?.stats || {
    waiting: 0,
    processing: 0,
    paymentPending: 0,
    success: 0,
    failed: 0,
    total: 0,
    avgProcessingTimeMs: 65,
    activeWorkers: 3,
  };

  const total = Math.max(1, stats.total || (stats.waiting + stats.processing + stats.success + stats.failed));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Live Virtual Queue Telemetry</h2>
          <p className="text-xs text-slate-400">Real-time FIFO queue state, worker processing pipeline, and allocation</p>
        </div>

        <button
          onClick={fetchOverview}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sync Queue</span>
        </button>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
          <div className="text-xs text-slate-400 font-mono">Current Waiting</div>
          <div className="text-3xl font-black text-indigo-400 font-mono">{stats.waiting}</div>
          <div className="text-[11px] text-slate-500 font-mono">FIFO buffer depth</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
          <div className="text-xs text-slate-400 font-mono">Currently Processing</div>
          <div className="text-3xl font-black text-sky-400 font-mono">{stats.processing}</div>
          <div className="text-[11px] text-slate-500 font-mono">
            {stats.activeWorkers} worker threads active
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
          <div className="text-xs text-slate-400 font-mono">Completed / Success</div>
          <div className="text-3xl font-black text-emerald-400 font-mono">
            {stats.success + (stats.paymentPending || 0)}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">Reserved & confirmed</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
          <div className="text-xs text-slate-400 font-mono">Average Processing Time</div>
          <div className="text-3xl font-black text-amber-400 font-mono">{stats.avgProcessingTimeMs}ms</div>
          <div className="text-[11px] text-slate-500 font-mono">Worker atomic mutex latency</div>
        </div>
      </div>

      {/* Requirement 17: Visual Queue Distribution Progress Bars */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <span className="text-[11px] font-mono text-sky-400 uppercase font-semibold">Visual Breakdown</span>
            <h3 className="font-bold text-white text-base">Queue States Distribution</h3>
          </div>
          <div className="text-xs font-mono text-slate-400">Total Enqueued: {stats.total}</div>
        </div>

        <div className="space-y-4">
          {/* WAITING */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-indigo-400 font-bold flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span>WAITING IN FIFO QUEUE</span>
              </span>
              <span className="text-white font-bold">{stats.waiting} ({Math.round((stats.waiting / total) * 100)}%)</span>
            </div>
            <div className="w-full bg-slate-950 h-5 rounded-lg overflow-hidden border border-slate-800 p-0.5">
              <div
                className="bg-indigo-500 h-full rounded transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(stats.waiting > 0 ? 3 : 0, (stats.waiting / total) * 100))}%` }}
              />
            </div>
          </div>

          {/* PROCESSING */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-sky-400 font-bold flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse" />
                <span>PROCESSING BY WORKERS</span>
              </span>
              <span className="text-white font-bold">{stats.processing} ({Math.round((stats.processing / total) * 100)}%)</span>
            </div>
            <div className="w-full bg-slate-950 h-5 rounded-lg overflow-hidden border border-slate-800 p-0.5">
              <div
                className="bg-sky-500 h-full rounded transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(stats.processing > 0 ? 3 : 0, (stats.processing / total) * 100))}%` }}
              />
            </div>
          </div>

          {/* SUCCESS / RESERVED */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-emerald-400 font-bold flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>SUCCESS (STOCK RESERVED / PAID)</span>
              </span>
              <span className="text-white font-bold">
                {stats.success + (stats.paymentPending || 0)} ({Math.round(((stats.success + (stats.paymentPending || 0)) / total) * 100)}%)
              </span>
            </div>
            <div className="w-full bg-slate-950 h-5 rounded-lg overflow-hidden border border-slate-800 p-0.5">
              <div
                className="bg-emerald-500 h-full rounded transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.max((stats.success + (stats.paymentPending || 0)) > 0 ? 3 : 0, ((stats.success + (stats.paymentPending || 0)) / total) * 100))}%`,
                }}
              />
            </div>
          </div>

          {/* FAILED / SOLD OUT */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-rose-400 font-bold flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>FAILED / SOLD OUT REJECTIONS</span>
              </span>
              <span className="text-white font-bold">{stats.failed} ({Math.round((stats.failed / total) * 100)}%)</span>
            </div>
            <div className="w-full bg-slate-950 h-5 rounded-lg overflow-hidden border border-slate-800 p-0.5">
              <div
                className="bg-rose-500 h-full rounded transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(stats.failed > 0 ? 3 : 0, (stats.failed / total) * 100))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Queue Entries Ledger */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-base">Recent Virtual Queue Ingress Log</h3>
          <span className="text-xs font-mono text-slate-400">Showing last 30 entries</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-mono uppercase text-slate-400">
                <th className="py-3.5 px-6">Queue ID</th>
                <th className="py-3.5 px-6">Shopper</th>
                <th className="py-3.5 px-6">Position</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Assigned Worker</th>
                <th className="py-3.5 px-6">Outcome / Reason</th>
                <th className="py-3.5 px-6">Joined Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-xs font-mono">
              {queueOverview?.recentEntries?.map((entry) => (
                <tr key={entry.queueId} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-6 font-bold text-sky-400">{entry.queueId}</td>
                  <td className="py-3.5 px-6 font-sans text-white">{entry.userName}</td>
                  <td className="py-3.5 px-6 font-bold text-amber-400">#{entry.position}</td>
                  <td className="py-3.5 px-6">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        entry.status === 'SUCCESS' || entry.status === 'PAYMENT_PENDING'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : entry.status === 'PROCESSING'
                          ? 'bg-sky-500/20 text-sky-300 animate-pulse'
                          : entry.status === 'WAITING'
                          ? 'bg-indigo-500/20 text-indigo-300'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {entry.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-slate-400">{entry.processedByWorker || '—'}</td>
                  <td className="py-3.5 px-6 text-slate-300">{entry.failureReason || (entry.orderId ? 'Stock Reserved' : 'Pending')}</td>
                  <td className="py-3.5 px-6 text-slate-500">
                    {new Date(entry.joinedAt).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
