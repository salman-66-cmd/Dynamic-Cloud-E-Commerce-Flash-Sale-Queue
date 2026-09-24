import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import CloudArchDiagram from '../components/CloudArchDiagram';
import { Zap, ShieldCheck, Cpu, Database, Server, ArrowRight, Clock, Flame, Users, CheckCircle, BarChart3 } from 'lucide-react';

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [flashSale, setFlashSale] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActiveSale = async () => {
      try {
        const res = await api.get('/flash-sales/active');
        if (res.data?.success) {
          setFlashSale(res.data.flashSale);
        }
      } catch (e) {
        console.error('Error loading active sale', e);
      } finally {
        setLoading(false);
      }
    };
    fetchActiveSale();
  }, []);

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.15),rgba(255,255,255,0))]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-mono">
              <Zap className="w-3.5 h-3.5 fill-sky-400" />
              <span>CLOUD-NATIVE FLASH SALE SYSTEM</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
              Survive the <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-300 to-sky-200">Flash Sale Rush</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
              Experience an enterprise cloud-powered e-commerce platform designed to handle massive concurrent traffic spikes
              without overselling a single unit.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                to="/flash-sale"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 shadow-lg shadow-sky-500/25 flex items-center justify-center space-x-2 transition-all hover:scale-[1.02]"
              >
                <Flame className="w-5 h-5 text-amber-300 fill-amber-300" />
                <span>Join Live Flash Sale</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>

              <Link
                to={user ? "/admin/cloud-monitoring" : "/login"}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 transition-all flex items-center justify-center space-x-2"
              >
                <Cpu className="w-4 h-4 text-sky-400" />
                <span>Cloud Monitoring Console</span>
              </Link>
            </div>

            {/* Quick trust metrics */}
            <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto text-left">
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400">Overselling Risk</div>
                <div className="text-lg font-bold text-emerald-400 font-mono">0.00% Guaranteed</div>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400">Queue Latency</div>
                <div className="text-lg font-bold text-sky-400 font-mono">&lt; 2ms In-Memory</div>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400">Auto-Scaling</div>
                <div className="text-lg font-bold text-indigo-400 font-mono">2 → 8 Workers</div>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400">Load Balancer</div>
                <div className="text-lg font-bold text-amber-400 font-mono">3 Virtual AZs</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Live Flash Sale Banner */}
      {flashSale && (
        <section className="py-12 bg-slate-900/40 border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-sky-500/30 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
              <div className="space-y-4 max-w-xl">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-400 text-xs font-bold font-mono tracking-wide flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    <span>SALE STATUS: {flashSale.status}</span>
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    Remaining Units: <strong className="text-white">{flashSale.remainingStock}</strong> / {flashSale.totalStock}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                  {flashSale.title}
                </h2>
                <p className="text-sm text-slate-300 line-clamp-2">
                  {flashSale.description}
                </p>

                <div className="flex items-baseline space-x-3">
                  <span className="text-3xl font-extrabold text-sky-400">${flashSale.salePrice}</span>
                  <span className="text-base text-slate-500 line-through">${flashSale.originalPrice}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                    {flashSale.discountPercentage}% OFF
                  </span>
                </div>
              </div>

              <div className="w-full md:w-auto flex flex-col items-center sm:items-end space-y-4">
                <div className="w-full max-w-xs bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between text-xs font-mono text-slate-400">
                    <span>Live Stock Remaining</span>
                    <span className="text-emerald-400 font-bold">{flashSale.remainingStock} units</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, (flashSale.remainingStock / (flashSale.totalStock || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Limit: 1 per shopper</span>
                    <span>Virtual Queue Protected</span>
                  </div>
                </div>

                <Link
                  to="/flash-sale"
                  className="w-full md:w-auto px-8 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-sm text-center shadow-lg shadow-sky-500/25 transition-all"
                >
                  Enter Virtual Queue →
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Cloud Architecture Interactive Section */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
          <span className="text-xs font-mono text-sky-400 uppercase tracking-wider font-semibold">
            Cloud Systems Engineering
          </span>
          <h2 className="text-3xl font-extrabold text-white">How the Virtual Queue Works</h2>
          <p className="text-sm text-slate-400">
            Direct database writes during flash sales crash traditional servers. Our cloud queue acts as a shock absorber,
            metering demand to worker nodes.
          </p>
        </div>

        <CloudArchDiagram queueDepth={flashSale?.queueDepth || 0} activeWorkers={3} currentRps={28} />
      </section>

      {/* 6 Cloud Pillars Grid */}
      <section className="py-16 bg-slate-900/30 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Key Cloud Computing Concepts</h2>
            <p className="text-sm text-slate-400">
              Concepts demonstrated end-to-end throughout this full-stack application.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
                <Server className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">1. Load Balancing (Round-Robin)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Traffic is distributed across multiple virtual API servers (API-1, API-2, API-3) to prevent single-instance
                bottlenecks and maximize throughput.
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">2. Elastic Auto-Scaling</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                The worker fleet dynamically scales between 2 and 8 nodes based on queue depth thresholds, ensuring optimal
                cost-efficiency during idle periods and high elasticity during surges.
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">3. Concurrency-Safe Decrement</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Stock is decremented conditionally (`remainingStock &gt; 0`). No race condition can ever force inventory
                negative, completely eliminating overselling.
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">4. Redis Caching & Queue</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                High-speed in-memory data structures provide sub-millisecond queue enqueuing and rapid state lookups
                without overloading the persistent database.
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">5. Fault Tolerance & Reaper</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Temporary 120-second stock reservations automatically expire if payment is not completed, returning
                inventory back to the queue pool cleanly.
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">6. Real-Time Telemetry</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                WebSockets stream live queue countdowns to waiting clients and real-time CPU/RAM/RPS telemetry to the
                Cloud Monitoring dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Callout */}
      <section className="py-16 text-center">
        <div className="max-w-3xl mx-auto px-4 space-y-4">
          <h3 className="text-2xl font-bold text-white">Ready to inspect or simulate the flash sale?</h3>
          <p className="text-sm text-slate-400">
            Log in as an Admin to run traffic simulations (100–5000 users) and watch the auto-scaler scale worker nodes in
            real time.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              to="/login"
              className="px-6 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-semibold text-sm transition-all shadow-md shadow-sky-500/20"
            >
              Sign In to Demo
            </Link>
            <Link
              to="/flash-sale"
              className="px-6 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-all"
            >
              View Flash Sale
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
