import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import FlashSalePage from './pages/FlashSalePage';
import VirtualQueuePage from './pages/VirtualQueuePage';
import UserDashboardPage from './pages/UserDashboardPage';
import OrdersPage from './pages/OrdersPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminFlashSales from './pages/admin/AdminFlashSales';
import AdminQueueMonitor from './pages/admin/AdminQueueMonitor';
import AdminCloudMonitoring from './pages/admin/AdminCloudMonitoring';
import AdminSystemHealth from './pages/admin/AdminSystemHealth';

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-sky-500 selection:text-white">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Public & Customer Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/products/:id" element={<ProductDetailPage />} />
                <Route path="/flash-sale" element={<FlashSalePage />} />
                <Route path="/queue/:queueId" element={<VirtualQueuePage />} />

                {/* Authenticated Shopper Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <UserDashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders"
                  element={
                    <ProtectedRoute>
                      <OrdersPage />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Management & Cloud Monitoring Routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute adminOnly>
                      <AdminLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<AdminDashboard />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="flash-sales" element={<AdminFlashSales />} />
                  <Route path="queue" element={<AdminQueueMonitor />} />
                  <Route path="cloud-monitoring" element={<AdminCloudMonitoring />} />
                  <Route path="system-health" element={<AdminSystemHealth />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}
