import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import { Zap, Clock, Users, ShieldCheck, Flame, AlertCircle, ShoppingBag, ArrowRight, Lock } from 'lucide-react';

export default function FlashSalePage() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [queueDepth, setQueueDepth] = useState(0);

  // Fetch active flash sale
  const fetchActiveSale = async () => {
    try {
      const res = await api.get('/flash-sales/active');
      if (res.data?.success) {
        setSale(res.data.flashSale);
        setQueueDepth(res.data.flashSale.queueDepth || 0);
      }
    } catch (err) {
      setError('Could not load flash sale data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveSale();
  }, []);

  // Socket listener for real-time stock and queue count updates
  useEffect(() => {
    if (!socket || !sale) return;

    const saleId = sale._id || sale.id;
    socket.emit('join:flashsale', { flashSaleId: saleId });

    const handleStockUpdate = (data) => {
      if (data.flashSaleId === saleId) {
        setSale((prev) => ({
          ...prev,
          remainingStock: data.remainingStock,
          status: data.status || prev.status,
        }));
      }
    };

    const handleQueueUpdate = (data) => {
      if (data.flashSaleId === saleId) {
        setQueueDepth(data.queueLength);
      }
    };

    socket.on('flashsale:stock_updated', handleStockUpdate);
    socket.on('queue:length_updated', handleQueueUpdate);

    return () => {
      socket.off('flashsale:stock_updated', handleStockUpdate);
      socket.off('queue:length_updated', handleQueueUpdate);
    };
  }, [socket, sale?._id, sale?.id]);

  // Live countdown timer calculation
  useEffect(() => {
    if (!sale) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(sale.endTime).getTime();
      const diff = Math.max(0, end - now);

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, [sale?.endTime]);

  const handleJoinQueue = async () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/flash-sale' } } });
      return;
    }

    setError('');
    setJoining(true);

    try {
      const saleId = sale._id || sale.id;
      const res = await api.post('/queue/join', { flashSaleId: saleId });

      if (res.data.success) {
        navigate(`/queue/${res.data.queueId}`);
      } else {
        setError(res.data.message || 'Could not join virtual queue.');
      }
    } catch (err) {
      if (err.response?.data?.code === 'ALREADY_IN_QUEUE' && err.response?.data?.entry) {
        navigate(`/queue/${err.response.data.entry.queueId}`);
        return;
      }
      setError(err.response?.data?.message || 'Error entering queue. Concurrency rate limit triggered.');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
        <p className="text-xs font-mono text-slate-400">Connecting to flash sale queue cluster...</p>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="max-w-xl mx-auto my-20 p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-4">
        <Zap className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">No Active Flash Sale</h2>
        <p className="text-xs text-slate-400">An administrator can launch a scheduled sale from the Admin Console.</p>
      </div>
    );
  }

  const isSoldOut = sale.remainingStock <= 0;
  const isSaleActive = sale.status === 'ACTIVE' && !isSoldOut;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Live Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-slate-900/90 border border-slate-800 rounded-2xl p-4 mb-8 gap-4 shadow-xl">
        <div className="flex items-center space-x-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </span>
          <div>
            <div className="text-xs font-mono uppercase font-bold text-emerald-400 tracking-wider">
              {sale.status === 'ACTIVE' ? 'FLASH SALE IN PROGRESS' : `SALE STATUS: ${sale.status}`}
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Live Redis Queue Depth: <strong className="text-amber-400">{queueDepth} shoppers</strong>
            </div>
          </div>
        </div>

        {/* Countdown */}
        <div className="flex items-center space-x-2 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
          <Clock className="w-4 h-4 text-amber-400" />
          <span className="text-xs text-slate-400 font-mono">TIME LEFT:</span>
          <div className="flex items-center space-x-1 font-mono font-bold text-white text-sm">
            <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              {String(timeLeft.hours).padStart(2, '0')}h
            </span>
            <span>:</span>
            <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              {String(timeLeft.minutes).padStart(2, '0')}m
            </span>
            <span>:</span>
            <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-amber-400">
              {String(timeLeft.seconds).padStart(2, '0')}s
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2 shadow-lg">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Flash Sale Hero Card */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Image & Stock Gauge (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video sm:aspect-square flex items-center justify-center">
              <img
                src={
                  sale.product?.imageUrl ||
                  'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800'
                }
                alt={sale.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-rose-600 text-white font-extrabold text-xs tracking-wider shadow-lg">
                {sale.discountPercentage}% OFF
              </div>
            </div>

            {/* Inventory Remaining Gauge */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-400">Available Flash Sale Stock</span>
                <span className={`font-bold ${isSoldOut ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {isSoldOut ? 'SOLD OUT (0 units)' : `${sale.remainingStock} / ${sale.totalStock} units`}
                </span>
              </div>
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    sale.remainingStock <= 2 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'
                  }`}
                  style={{
                    width: `${Math.min(100, (sale.remainingStock / (sale.totalStock || 1)) * 100)}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                <span>Atomic Reservation Lock: Active</span>
                <span>Max 1 per Shopper</span>
              </div>
            </div>
          </div>

          {/* Right Column: Title, Prices, Features, CTA (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-mono">
                <Flame className="w-3.5 h-3.5 fill-amber-400" />
                <span>EXCLUSIVE MEGA SALE</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
                {sale.title}
              </h1>

              <p className="text-sm text-slate-300 leading-relaxed">
                {sale.description}
              </p>

              {/* Pricing Callout */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Flash Sale Deal</div>
                  <div className="flex items-baseline space-x-3">
                    <span className="text-3xl sm:text-4xl font-black text-amber-400 font-mono">
                      ${sale.salePrice}
                    </span>
                    <span className="text-lg text-slate-500 line-through">${sale.originalPrice}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-emerald-400 font-bold font-mono">
                    Instant Savings
                  </div>
                  <div className="text-lg font-extrabold text-white">
                    ${(sale.originalPrice - sale.salePrice).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Concurrency Protections */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center space-x-2 text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Fair Virtual FIFO Queue: No bot scraping or brute-force advantage</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-300">
                  <Users className="w-4 h-4 text-sky-400 flex-shrink-0" />
                  <span>Real-time position countdown and dynamic waiting time estimation</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-300">
                  <Lock className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <span>120-second reserved checkout window once your turn arrives</span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              {isSoldOut ? (
                <button
                  disabled
                  className="w-full py-4 rounded-2xl bg-slate-800 text-slate-400 font-bold text-sm uppercase tracking-wider cursor-not-allowed border border-slate-700"
                >
                  SOLD OUT - All Flash Sale Units Claimed
                </button>
              ) : sale.status !== 'ACTIVE' ? (
                <button
                  disabled
                  className="w-full py-4 rounded-2xl bg-slate-800 text-amber-400 font-bold text-sm uppercase tracking-wider cursor-not-allowed border border-slate-700"
                >
                  SALE IS CURRENTLY {sale.status}
                </button>
              ) : (
                <button
                  onClick={handleJoinQueue}
                  disabled={joining}
                  className="w-full py-4 rounded-2xl font-black text-slate-950 text-base bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-200 shadow-xl shadow-amber-500/25 transition-all flex items-center justify-center space-x-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                >
                  {joining ? (
                    <span className="flex items-center space-x-2">
                      <span className="w-5 h-5 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin" />
                      <span>Entering Virtual Queue...</span>
                    </span>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 fill-slate-950" />
                      <span>JOIN FLASH SALE QUEUE</span>
                      <ArrowRight className="w-5 h-5 ml-1" />
                    </>
                  )}
                </button>
              )}

              <p className="text-center text-[11px] text-slate-400">
                Clicking "Join Flash Sale Queue" registers your position with our distributed cloud load balancer.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
