import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import LoginPage from './components/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import Navigation from './components/Navigation';
import Index from './pages/Index';
import Analytics from './pages/Analytics';

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
              <ProtectedRoute>
                <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
                {currentPage === 'dashboard' && <Index />}
                {currentPage === 'analytics' && <Analytics />}
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/analytics" 
            element={
              <ProtectedRoute>
                <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
                <Analytics />
              </ProtectedRoute>
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

