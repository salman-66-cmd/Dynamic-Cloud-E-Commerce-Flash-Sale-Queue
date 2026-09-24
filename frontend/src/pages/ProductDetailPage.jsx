import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Zap, ShieldCheck, ArrowLeft, CheckCircle2, Truck, RefreshCw, Cpu, Layers } from 'lucide-react';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/${id}`);
        if (res.data?.success) {
          setProduct(res.data.product);
        } else {
          setError('Product not found');
        }
      } catch (err) {
        setError('Failed to load product details');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
        <p className="text-xs font-mono text-slate-400">Loading product telemetry...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-xl mx-auto my-20 p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4">
        <p className="text-rose-400 font-semibold">{error || 'Product not found'}</p>
        <Link to="/products" className="inline-block px-4 py-2 rounded-lg bg-slate-800 text-xs text-white">
          ← Back to Catalog
        </Link>
      </div>
    );
  }

  const isFlashSale = product.name.includes('RTX');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link
        to="/products"
        className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Products</span>
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl">
        {/* Left: Product Image */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video md:aspect-square flex items-center justify-center border border-slate-800/80">
          <img
            src={product.imageUrl || 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800'}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          {isFlashSale && (
            <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-extrabold text-xs flex items-center space-x-1 shadow-lg">
              <Zap className="w-3.5 h-3.5 fill-slate-950" />
              <span>ACTIVE FLASH SALE PRODUCT</span>
            </div>
          )}
        </div>

        {/* Right: Specifications & CTA */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                {product.category || 'Hardware'}
              </span>
              <span className="text-xs font-mono text-emerald-400">
                ● Stock Available: {product.stock} units
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
              {product.name}
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed">
              {product.description}
            </p>

            {/* Price section */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
              <div className="text-[11px] font-mono text-slate-400 uppercase">Flash Sale Pricing</div>
              <div className="flex items-baseline space-x-3">
                <span className="text-3xl font-extrabold text-sky-400">${product.salePrice || product.originalPrice}</span>
                {product.salePrice && product.salePrice < product.originalPrice && (
                  <>
                    <span className="text-lg text-slate-500 line-through">${product.originalPrice}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold font-mono">
                      Save ${(product.originalPrice - product.salePrice).toLocaleString()}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Cloud Safeguards */}
            <div className="grid grid-cols-2 gap-3 text-xs text-slate-300">
              <div className="flex items-center space-x-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Zero Overselling Guarantee</span>
              </div>
              <div className="flex items-center space-x-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <Cpu className="w-4 h-4 text-sky-400 flex-shrink-0" />
                <span>Virtual Queue Metered</span>
              </div>
            </div>
          </div>

          {/* Action CTA */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            {isFlashSale ? (
              <Link
                to="/flash-sale"
                className="w-full py-4 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-xl shadow-amber-500/20 flex items-center justify-center space-x-2 transition-all text-sm uppercase tracking-wide"
              >
                <Zap className="w-4 h-4 fill-slate-950" />
                <span>Enter Virtual Queue for Flash Sale</span>
              </Link>
            ) : (
              <button
                onClick={() => alert('Regular checkout simulation. Check our active flash sale for high-concurrency queueing demo!')}
                className="w-full py-3.5 rounded-xl font-bold text-white bg-sky-500 hover:bg-sky-400 shadow-lg shadow-sky-500/20 text-sm transition-all"
              >
                Direct Purchase (Standard)
              </button>
            )}
            <p className="text-center text-[11px] text-slate-400">
              High-concurrency virtual queue protection is enabled for all flash sale items.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
