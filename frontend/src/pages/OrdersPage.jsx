import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Package, Clock, CheckCircle2, XCircle, ArrowLeft, RefreshCw, ShoppingBag } from 'lucide-react';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders');
      if (res.data?.success) {
        setOrders(res.data.orders);
      }
    } catch (err) {
      console.error('Error fetching orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <Link
            to="/dashboard"
            className="inline-flex items-center space-x-1 text-xs text-slate-400 hover:text-white mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-3xl font-extrabold text-white">Your Orders</h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete transaction and reservation ledger from cloud flash sales
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium flex items-center space-x-1.5 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
          <p className="text-xs font-mono text-slate-400">Fetching order ledger...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
          <Package className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Orders Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You have not placed any orders yet. Join an active flash sale to reserve limited inventory.
          </p>
          <Link
            to="/flash-sale"
            className="inline-block mt-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs"
          >
            Browse Live Flash Sale
          </Link>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-mono uppercase text-slate-400">
                  <th className="py-3.5 px-6">Order ID</th>
                  <th className="py-3.5 px-6">Product</th>
                  <th className="py-3.5 px-6">Quantity</th>
                  <th className="py-3.5 px-6">Total Price</th>
                  <th className="py-3.5 px-6">Order Status</th>
                  <th className="py-3.5 px-6">Payment Status</th>
                  <th className="py-3.5 px-6">Created Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-xs font-mono">
                {orders.map((order) => (
                  <tr key={order.orderId} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6 font-bold text-sky-400">{order.orderId}</td>
                    <td className="py-4 px-6 text-white font-sans font-medium">{order.productName}</td>
                    <td className="py-4 px-6 text-slate-300">{order.quantity || 1}</td>
                    <td className="py-4 px-6 text-white font-bold">${order.totalAmount}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          order.status === 'CONFIRMED'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : order.status === 'PENDING'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {order.status === 'CONFIRMED' ? (
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                        ) : order.status === 'PENDING' ? (
                          <Clock className="w-3 h-3 mr-1" />
                        ) : (
                          <XCircle className="w-3 h-3 mr-1" />
                        )}
                        <span>{order.status}</span>
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`text-[10px] uppercase font-bold ${
                          order.paymentStatus === 'PAYMENT_SUCCESS'
                            ? 'text-emerald-400'
                            : order.paymentStatus === 'PAYMENT_PENDING'
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-400">
                      {new Date(order.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
