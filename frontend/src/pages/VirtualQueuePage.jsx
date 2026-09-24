import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import {
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ShieldCheck,
  CreditCard,
  ArrowRight,
  RefreshCw,
  LogOut,
  Zap,
  Cpu,
  PackageCheck,
} from 'lucide-react';

export default function VirtualQueuePage() {
  const { queueId } = useParams();
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const navigate = useNavigate();

  const [queueData, setQueueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Payment simulation state
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccessOption, setPaymentSuccessOption] = useState(true);
  const [paymentResult, setPaymentResult] = useState(null);
  const [reservationCountdown, setReservationCountdown] = useState(120);

  // Fetch initial queue status
  const fetchStatus = async () => {
    try {
      const res = await api.get(`/queue/${queueId}`);
      if (res.data?.success) {
        setQueueData(res.data.queue);
      } else {
        setError('Queue entry not found.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load queue status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [queueId]);

  // Socket.IO real-time subscriptions
  useEffect(() => {
    if (!socket || !queueId) return;

    socket.emit('join:queue', { queueId });

    const handleStatusChanged = (data) => {
      setQueueData((prev) => ({
        ...prev,
        ...data,
      }));
    };

    socket.on('queue:status_changed', handleStatusChanged);

    // Periodically poll as reliable fallback if socket is paused
    const pollInterval = setInterval(() => {
      if (queueData?.status === 'WAITING' || queueData?.status === 'PROCESSING') {
        fetchStatus();
      }
    }, 2500);

    return () => {
      socket.emit('leave:queue', { queueId });
      socket.off('queue:status_changed', handleStatusChanged);
      clearInterval(pollInterval);
    };
  }, [socket, queueId, queueData?.status]);

  // Countdown timer for PAYMENT_PENDING reservation window
  useEffect(() => {
    if (queueData?.status !== 'PAYMENT_PENDING') return;

    const interval = setInterval(() => {
      if (queueData.reservationExpiresAt) {
        const diff = Math.max(0, Math.floor((new Date(queueData.reservationExpiresAt).getTime() - Date.now()) / 1000));
        setReservationCountdown(diff);
      } else {
        setReservationCountdown((prev) => Math.max(0, prev - 1));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [queueData?.status, queueData?.reservationExpiresAt]);

  const handleCancelQueue = async () => {
    if (!window.confirm('Are you sure you want to leave the virtual queue? Your position will be forfeited.')) {
      return;
    }
    setCancelling(true);
    try {
      await api.delete(`/queue/${queueId}`);
      navigate('/flash-sale');
    } catch (err) {
      alert(err.response?.data?.message || 'Could not cancel queue entry.');
    } finally {
      setCancelling(false);
    }
  };

  // Payment simulation action
  const handleSimulatePayment = async () => {
    if (!queueData?.orderId) return;
    setPaymentProcessing(true);
    try {
      const res = await api.post(`/orders/${queueData.orderId}/payment`, {
        simulateSuccess: paymentSuccessOption,
      });

      if (res.data.success) {
        setPaymentResult({
          success: true,
          order: res.data.order,
          message: 'Payment verified! Your flash sale item has been confirmed.',
        });
        setQueueData((prev) => ({ ...prev, status: 'SUCCESS' }));
      }
    } catch (err) {
      setPaymentResult({
        success: false,
        message: err.response?.data?.message || 'Payment simulation failed. Inventory released.',
      });
      setQueueData((prev) => ({ ...prev, status: 'FAILED' }));
    } finally {
      setPaymentProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
        <p className="text-xs font-mono text-slate-400">Negotiating position with cloud queue broker...</p>
      </div>
    );
  }

  if (error || !queueData) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-4 shadow-2xl">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Queue Session Error</h2>
        <p className="text-xs text-slate-400">{error || 'Queue entry not found'}</p>
        <Link to="/flash-sale" className="inline-block px-4 py-2 rounded-xl bg-slate-800 text-xs text-white">
          Return to Flash Sale
        </Link>
      </div>
    );
  }

  // Format estimated time
  const formatWaitTime = (seconds) => {
    if (!seconds || seconds <= 0) return 'Immediate';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs} sec`;
    return `${mins} min ${secs} sec`;
  };

  // Compute progress percentage
  const initialPos = queueData.initialPosition || 10;
  const currentPos = queueData.position || 1;
  const progressPercent =
    queueData.status === 'SUCCESS' || queueData.status === 'PAYMENT_PENDING'
      ? 100
      : queueData.status === 'PROCESSING'
      ? 95
      : Math.min(90, Math.max(10, Math.round(((initialPos - currentPos + 1) / initialPos) * 100)));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Banner */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-800 mb-8">
        <div>
          <span className="text-[11px] font-mono text-sky-400 uppercase tracking-wider font-semibold">
            Virtual Cloud Queue
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <span>Session:</span>
            <span className="font-mono text-slate-400 text-base">{queueId}</span>
          </h1>
        </div>
        <div className="flex items-center space-x-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-xs font-mono text-slate-300">Live Socket Stream</span>
        </div>
      </div>

      {/* Main Queue Card */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 uppercase font-mono">Current Status:</span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider ${
                queueData.status === 'SUCCESS'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : queueData.status === 'PAYMENT_PENDING'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                  : queueData.status === 'PROCESSING'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30 animate-pulse'
                  : queueData.status === 'FAILED'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}
            >
              ● {queueData.status}
            </span>
          </div>

          <div className="text-xs font-mono text-slate-400">
            Assigned Shopper: <strong className="text-white">{queueData.userName || user?.name}</strong>
          </div>
        </div>

        {/* ============================================================== */}
        {/* STATE 1: WAITING IN QUEUE */}
        {/* ============================================================== */}
        {queueData.status === 'WAITING' && (
          <div className="space-y-8">
            {/* Position Badges Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Position Number */}
              <div className="bg-slate-950 border border-slate-800/80 p-6 rounded-2xl text-center space-y-1">
                <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">Your Position</div>
                <div className="text-4xl sm:text-5xl font-black text-sky-400 font-mono">
                  #{queueData.position}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">Initial: #{queueData.initialPosition}</div>
              </div>

              {/* People Ahead */}
              <div className="bg-slate-950 border border-slate-800/80 p-6 rounded-2xl text-center space-y-1">
                <div className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center justify-center space-x-1">
                  <Users className="w-3.5 h-3.5" />
                  <span>People Ahead</span>
                </div>
                <div className="text-4xl sm:text-5xl font-black text-amber-400 font-mono">
                  {queueData.peopleAhead || Math.max(0, queueData.position - 1)}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">In FIFO Buffer</div>
              </div>

              {/* Est Wait Time */}
              <div className="bg-slate-950 border border-slate-800/80 p-6 rounded-2xl text-center space-y-1">
                <div className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center justify-center space-x-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Estimated Wait</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono pt-2">
                  {formatWaitTime(queueData.estimatedWaitSeconds)}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">Auto-adjusting</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>Queue Flow Progress</span>
                <span className="text-sky-400 font-bold">{progressPercent}%</span>
              </div>
              <div className="w-full bg-slate-950 h-3.5 rounded-full overflow-hidden border border-slate-800 p-0.5">
                <div
                  className="bg-gradient-to-r from-sky-500 to-indigo-500 h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="text-center text-[11px] text-slate-500 font-mono pt-1">
                Please keep this page open. Your spot is secured and updates automatically in real-time.
              </div>
            </div>

            {/* Cancel Action */}
            <div className="pt-4 border-t border-slate-800/80 flex justify-between items-center text-xs">
              <span className="text-slate-400 font-mono">Worker nodes processing queue sequentially.</span>
              <button
                onClick={handleCancelQueue}
                disabled={cancelling}
                className="px-3.5 py-1.5 rounded-lg bg-slate-950 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors"
              >
                Leave Queue
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STATE 2: PROCESSING (Worker node picked the user's item) */}
        {/* ============================================================== */}
        {queueData.status === 'PROCESSING' && (
          <div className="text-center py-10 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center mx-auto animate-bounce">
              <Cpu className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white">Your Turn Has Arrived!</h2>
            <p className="text-sm text-slate-300 max-w-md mx-auto">
              A cloud worker node ({queueData.processedByWorker || 'Worker-1'}) is currently acquiring an atomic mutex lock
              to reserve your product inventory...
            </p>
            <div className="flex items-center justify-center space-x-2 text-xs font-mono text-sky-400">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
              <span>Executing Concurrency-Safe Reservation...</span>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STATE 3: PAYMENT PENDING (Stock reserved! User has 2 mins to pay) */}
        {/* ============================================================== */}
        {queueData.status === 'PAYMENT_PENDING' && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                <div>
                  <div className="text-sm font-bold text-white">Stock Reserved Successfully!</div>
                  <div className="text-xs text-slate-300">
                    1 unit locked exclusively for you. Complete simulated payment before timer expires.
                  </div>
                </div>
              </div>
              {/* Expiration Timer */}
              <div className="text-right">
                <div className="text-[10px] uppercase font-mono text-slate-400">Reservation Lock</div>
                <div className="text-xl font-black font-mono text-amber-400">
                  {Math.floor(reservationCountdown / 60)}:
                  {String(reservationCountdown % 60).padStart(2, '0')}
                </div>
              </div>
            </div>

            {/* Order Details Card */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-800 text-xs font-mono">
                <span className="text-slate-400">Order Reference:</span>
                <span className="text-white font-bold">{queueData.orderId}</span>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-white text-base">RTX 4090 Gaming Beast Laptop</h4>
                  <p className="text-xs text-slate-400 font-mono">Quantity: 1 unit (Flash Sale Limit)</p>
                </div>
                <div className="text-2xl font-black text-sky-400 font-mono">$1,499.00</div>
              </div>

              {/* Payment simulation options */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-mono">Simulated Cloud Payment Gateway:</span>
                  <div className="flex items-center space-x-2">
                    <label className="flex items-center space-x-1 cursor-pointer">
                      <input
                        type="radio"
                        name="paySuccess"
                        checked={paymentSuccessOption}
                        onChange={() => setPaymentSuccessOption(true)}
                        className="text-sky-500"
                      />
                      <span className="text-xs text-slate-300">Simulate Success</span>
                    </label>
                    <label className="flex items-center space-x-1 cursor-pointer">
                      <input
                        type="radio"
                        name="paySuccess"
                        checked={!paymentSuccessOption}
                        onChange={() => setPaymentSuccessOption(false)}
                        className="text-rose-400"
                      />
                      <span className="text-xs text-slate-300">Simulate Decline</span>
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleSimulatePayment}
                  disabled={paymentProcessing || reservationCountdown <= 0}
                  className="w-full py-4 rounded-xl font-black text-white text-sm bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 shadow-xl shadow-emerald-600/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
                >
                  {paymentProcessing ? (
                    <span className="flex items-center space-x-2">
                      <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Verifying Simulated Payment (1.2s)...</span>
                    </span>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      <span>Complete Payment (${1499})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STATE 4: SUCCESS (Payment Confirmed & Order Finalized) */}
        {/* ============================================================== */}
        {queueData.status === 'SUCCESS' && (
          <div className="text-center py-8 space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20">
              <PackageCheck className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                ORDER CONFIRMED
              </span>
              <h2 className="text-3xl font-extrabold text-white">Purchase Successful!</h2>
              <p className="text-sm text-slate-300 max-w-md mx-auto">
                Congratulations! Your flash sale order has been secured and confirmed without overselling.
              </p>
            </div>

            {queueData.orderId && (
              <div className="max-w-md mx-auto bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs font-mono space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>Order Identifier:</span>
                  <strong className="text-white">{queueData.orderId}</strong>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Queue Token:</span>
                  <span className="text-sky-400">{queueId}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Status:</span>
                  <span className="text-emerald-400 font-bold">CONFIRMED (Paid)</span>
                </div>
              </div>
            )}

            <div className="flex justify-center gap-3 pt-2">
              <Link
                to="/orders"
                className="px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs transition-colors flex items-center space-x-1.5"
              >
                <span>View Order History</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/dashboard"
                className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
              >
                User Dashboard
              </Link>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STATE 5: FAILED / SOLD OUT / TIMED OUT */}
        {/* ============================================================== */}
        {(queueData.status === 'FAILED' || queueData.status === 'EXPIRED') && (
          <div className="text-center py-8 space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                {queueData.failureReason === 'SOLD_OUT'
                  ? 'SOLD OUT'
                  : queueData.failureReason === 'PAYMENT_DECLINED'
                  ? 'PAYMENT DECLINED'
                  : 'RESERVATION EXPIRED'}
              </span>
              <h2 className="text-2xl font-bold text-white">
                {queueData.failureReason === 'SOLD_OUT'
                  ? 'Flash Sale Units Sold Out'
                  : queueData.failureReason === 'PAYMENT_DECLINED'
                  ? 'Payment Declined'
                  : 'Reservation Window Expired'}
              </h2>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                {queueData.failureReason === 'SOLD_OUT'
                  ? 'All units allocated to earlier queue positions. No overselling was permitted.'
                  : 'Your inventory lock was released back to the flash sale pool.'}
              </p>
            </div>

            <div className="pt-2">
              <Link
                to="/flash-sale"
                className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs"
              >
                Return to Flash Sale Hub
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
