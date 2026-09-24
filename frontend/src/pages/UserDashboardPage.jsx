import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  ShoppingBag,
  Zap,
  CheckCircle2,
  Clock,
  Package,
  ArrowRight,
  Shield,
  User,
  CreditCard,
  AlertCircle,
} from 'lucide-react';

export default function UserDashboardPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [activeSale, setActiveSale] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [ordersRes, saleRes] = await Promise.all([
          api.get('/orders'),
          api.get('/flash-sales/active'),
        ]);

        if (ordersRes.data?.success) {
          setOrders(ordersRes.data.orders);
        }
        if (saleRes.data?.success) {
          setActiveSale(saleRes.data.flashSale);
        }
      } catch (err) {
        console.error('Error fetching dashboard', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const confirmedOrders = orders.filter((o) => o.status === 'CONFIRMED');
  const pendingOrders = orders.filter((o) => o.status === 'PENDING');
  const failedOrders = orders.filter((o) => o.status === 'FAILED' || o.status === 'CANCELLED');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <span className="text-xs font-mono text-sky-400 uppercase tracking-wider font-semibold">User Dashboard</span>
          <h1 className="text-3xl font-extrabold text-white mt-1">Welcome, {user?.name}</h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">{user?.email} • Role: {user?.role}</p>
        </div>

        <div className="flex gap-2">
          <Link
            to="/flash-sale"
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition-colors shadow-md shadow-amber-500/10"
          >
            <Zap className="w-4 h-4 fill-slate-950" />
            <span>Join Flash Sale</span>
          </Link>
          <Link
            to="/products"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors"
          >
            Catalog
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Total Orders</span>
            <Package className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-3xl font-black text-white font-mono">{orders.length}</div>
          <div className="text-[11px] text-slate-500">All flash sale & catalog attempts</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Successful Purchases</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400 font-mono">{confirmedOrders.length}</div>
          <div className="text-[11px] text-emerald-500/80 font-mono">Confirmed & Paid</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Pending Checkout</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-400 font-mono">{pendingOrders.length}</div>
          <div className="text-[11px] text-slate-500">Reserved in queue</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Cancelled / Failed</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-black text-rose-400 font-mono">{failedOrders.length}</div>
          <div className="text-[11px] text-slate-500">Timeout or declined</div>
        </div>
      </div>

      {/* Main Grid: Active Flash Sale & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Active Flash Sale Card (1 col) */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
            <Zap className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-white text-sm">Active Flash Sale Status</h3>
          </div>

          {activeSale ? (
            <div className="space-y-4">
              <div className="h-36 rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                <img
                  src={
                    activeSale.product?.imageUrl ||
                    'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800'
                  }
                  alt={activeSale.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <h4 className="font-bold text-white text-sm line-clamp-1">{activeSale.title}</h4>
                <div className="flex items-baseline space-x-2 mt-1">
                  <span className="text-xl font-bold text-sky-400 font-mono">${activeSale.salePrice}</span>
                  <span className="text-xs text-slate-500 line-through">${activeSale.originalPrice}</span>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Stock Remaining:</span>
                  <span className="text-emerald-400 font-bold">{activeSale.remainingStock} units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Queue Depth:</span>
                  <span className="text-amber-400">{activeSale.queueDepth || 0} shoppers</span>
                </div>
              </div>

              <Link
                to="/flash-sale"
                className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors"
              >
                <span>View Flash Sale Hub</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <p className="text-xs text-slate-400">No active flash sale at this moment.</p>
          )}
        </div>

        {/* Right: Orders History (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Package className="w-4 h-4 text-sky-400" />
              <h3 className="font-bold text-white text-sm">Your Recent Orders</h3>
            </div>
            <Link to="/orders" className="text-xs text-sky-400 hover:underline">
              View All ({orders.length}) →
            </Link>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs font-mono text-slate-400">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <ShoppingBag className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-slate-300 text-sm">No flash-sale orders placed yet</p>
              <p className="text-xs text-slate-500">Join the live flash sale to test the virtual queue!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 5).map((order) => (
                <div
                  key={order.orderId}
                  className="bg-slate-950 border border-slate-800/80 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs text-white font-bold">{order.orderId}</span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                          order.status === 'CONFIRMED'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : order.status === 'PENDING'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-300">{order.productName}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {new Date(order.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-base font-extrabold text-white font-mono">${order.totalAmount}</div>
                    <div className="text-[10px] text-slate-400 font-mono uppercase">{order.paymentStatus}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
