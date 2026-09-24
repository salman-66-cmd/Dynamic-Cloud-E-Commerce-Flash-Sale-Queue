import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, Zap, Users, Activity, HeartPulse } from 'lucide-react';

export default function AdminLayout() {
  const navItems = [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/admin/products', label: 'Products', icon: ShoppingBag },
    { to: '/admin/flash-sales', label: 'Flash Sales', icon: Zap },
    { to: '/admin/queue', label: 'Live Queue', icon: Users },
    { to: '/admin/cloud-monitoring', label: 'Cloud Monitoring', icon: Activity },
    { to: '/admin/system-health', label: 'System Health', icon: HeartPulse },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Top Banner */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h1 className="text-xl font-bold text-white tracking-tight">Cloud Sale Command Center</h1>
                <span className="px-2 py-0.5 text-[11px] font-mono bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">
                  ADMIN CONSOLE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time queue orchestration, dynamic auto-scaling workers, and traffic simulation
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-2 mt-6 overflow-x-auto pb-1 scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`
                  }
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>

      {/* Admin Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Outlet />
      </div>
    </div>
  );
}
