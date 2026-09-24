import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Zap, Play, Pause, Square, RotateCcw, Plus, CheckCircle2, Clock, Users, Flame } from 'lucide-react';

export default function AdminFlashSales() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stockResetModal, setStockResetModal] = useState(null);
  const [resetStockValue, setResetStockValue] = useState(10);

  const [formData, setFormData] = useState({
    productId: '',
    title: '',
    salePrice: '',
    originalPrice: '',
    stock: 10,
    startTime: '',
    endTime: '',
    maxQtyPerUser: 1,
  });

  const fetchData = async () => {
    try {
      const [salesRes, productsRes] = await Promise.all([
        api.get('/flash-sales'),
        api.get('/products'),
      ]);
      if (salesRes.data?.success) setSales(salesRes.data.flashSales);
      if (productsRes.data?.success) setProducts(productsRes.data.products);
    } catch (err) {
      console.error('Error loading flash sales', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStart = async (id) => {
    try {
      await api.post(`/flash-sales/${id}/start`);
      fetchData();
    } catch (err) {
      alert('Failed to start flash sale');
    }
  };

  const handlePause = async (id) => {
    try {
      await api.post(`/flash-sales/${id}/pause`);
      fetchData();
    } catch (err) {
      alert('Failed to pause flash sale');
    }
  };

  const handleEnd = async (id) => {
    if (!window.confirm('End this flash sale immediately?')) return;
    try {
      await api.post(`/flash-sales/${id}/end`);
      fetchData();
    } catch (err) {
      alert('Failed to end flash sale');
    }
  };

  const handleResetStockSubmit = async () => {
    if (!stockResetModal) return;
    try {
      await api.post(`/flash-sales/${stockResetModal._id || stockResetModal.id}/reset-stock`, {
        stock: Number(resetStockValue),
      });
      setStockResetModal(null);
      fetchData();
    } catch (err) {
      alert('Failed to reset stock');
    }
  };

  const handleCreateSale = async (e) => {
    e.preventDefault();
    try {
      await api.post('/flash-sales', formData);
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating flash sale');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white">Flash Sale Lifecycle Controls</h2>
          <p className="text-xs text-slate-400">Launch, pause, end campaigns, or reset stock for live demonstrations</p>
        </div>

        <button
          onClick={() => {
            if (products.length > 0) {
              setFormData({
                productId: products[0]._id || products[0].id,
                title: 'Cyber Rush: High-Performance Hardware Sale',
                originalPrice: products[0].originalPrice,
                salePrice: Math.round(products[0].originalPrice * 0.5),
                stock: 10,
                startTime: new Date().toISOString().slice(0, 16),
                endTime: new Date(Date.now() + 24 * 3600000).toISOString().slice(0, 16),
                maxQtyPerUser: 1,
              });
            }
            setIsModalOpen(true);
          }}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule New Flash Sale</span>
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs font-mono text-slate-400">Loading flash sales...</div>
      ) : sales.length === 0 ? (
        <div className="py-16 text-center text-slate-400 text-xs">No flash sales scheduled.</div>
      ) : (
        <div className="space-y-4">
          {sales.map((sale) => (
            <div
              key={sale._id || sale.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-xl"
            >
              {/* Info */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                      sale.status === 'ACTIVE'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : sale.status === 'PAUSED'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    ● {sale.status}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    Remaining: <strong className="text-emerald-400">{sale.remainingStock}</strong> / {sale.totalStock} units
                  </span>
                  <span className="text-xs font-mono text-slate-500">|</span>
                  <span className="text-xs font-mono text-amber-400 font-bold">
                    Queue Depth: {sale.queueDepth || 0}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white">{sale.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-1">{sale.productName || sale.description}</p>

                <div className="flex items-center space-x-4 pt-1 text-xs font-mono">
                  <span className="text-sky-400 font-bold text-sm">${sale.salePrice}</span>
                  <span className="text-slate-500 line-through">${sale.originalPrice}</span>
                  <span className="text-emerald-400">{sale.discountPercentage}% OFF</span>
                  <span className="text-slate-500">• Max 1 per Shopper</span>
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex flex-wrap items-center gap-2">
                {sale.status !== 'ACTIVE' ? (
                  <button
                    onClick={() => handleStart(sale._id || sale.id)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Start Sale</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handlePause(sale._id || sale.id)}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs flex items-center space-x-1"
                  >
                    <Pause className="w-3.5 h-3.5 fill-slate-950" />
                    <span>Pause</span>
                  </button>
                )}

                <button
                  onClick={() => handleEnd(sale._id || sale.id)}
                  disabled={sale.status === 'ENDED'}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 disabled:opacity-40 text-xs font-medium flex items-center space-x-1"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>End Sale</span>
                </button>

                <button
                  onClick={() => {
                    setStockResetModal(sale);
                    setResetStockValue(10);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/20 text-xs font-bold font-mono flex items-center space-x-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Stock</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reset Stock Modal */}
      {stockResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-white text-base">Reset Flash Sale Inventory</h3>
            <p className="text-xs text-slate-400">
              Set stock back to a specific count for demonstration (e.g., 10 units for the 100-user stress test).
            </p>
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">New Stock Count</label>
              <input
                type="number"
                min={1}
                value={resetStockValue}
                onChange={(e) => setResetStockValue(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono font-bold text-lg text-center"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setStockResetModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleResetStockSubmit}
                className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Flash Sale Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl">
            <h3 className="font-bold text-white text-base">Create Flash Sale Event</h3>
            <form onSubmit={handleCreateSale} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Product</label>
                <select
                  value={formData.productId}
                  onChange={(e) => {
                    const sel = products.find((p) => (p._id || p.id) === e.target.value);
                    setFormData({
                      ...formData,
                      productId: e.target.value,
                      originalPrice: sel?.originalPrice || '',
                      salePrice: sel ? Math.round(sel.originalPrice * 0.5) : '',
                    });
                  }}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                >
                  {products.map((p) => (
                    <option key={p._id || p.id} value={p._id || p.id}>
                      {p.name} (${p.originalPrice})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Campaign Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Original Price ($)</label>
                  <input
                    type="number"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Flash Price ($)</label>
                  <input
                    type="number"
                    required
                    value={formData.salePrice}
                    onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Total Stock</label>
                  <input
                    type="number"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
                >
                  Launch Sale
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
