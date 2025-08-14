import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/Login';
import ProtectedRouteWithConsent from './components/ProtectedRouteWithConsent';
import Navigation from './components/Navigation';
import Index from './pages/Index';
import Analytics from './pages/Analytics';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AdminResetPassword from './pages/AdminResetPassword';

function App() {
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'analytics'>('dashboard');
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/login" 
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRouteWithConsent>
                <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
                {currentPage === 'dashboard' && <Index />}
                {currentPage === 'analytics' && <Analytics />}
              </ProtectedRouteWithConsent>
            } 
          />
          <Route 
            path="/analytics" 
            element={
              <ProtectedRouteWithConsent>
                <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
                <Analytics />
              </ProtectedRouteWithConsent>
            } 
          />
          <Route 
            path="/reset-password" 
            element={<ResetPasswordPage />} 
          />
          <Route 
            path="/admin/reset-password" 
            element={
              <ProtectedRouteWithConsent>
                <AdminResetPassword />
              </ProtectedRouteWithConsent>
            } 
          />
          <Route 
            path="/" 
            element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

