import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import AuthPage from './pages/auth/AuthPage';
import HomePage from './pages/HomePage';
import GamePage from './pages/game/GamePage';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  return (
    <Router>
      <div className="app">
        <Routes>
          {/* Auth route */}
          <Route 
            path="/auth" 
            element={
              isAuthenticated ? <Navigate to="/" replace /> : <AuthPage />
            } 
          />
          
          {/* Protected routes */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/game/:gameId" 
            element={
              <ProtectedRoute>
                <GamePage />
              </ProtectedRoute>
            } 
          />
          
          {/* Redirect to auth if not authenticated, home if authenticated */}
          <Route 
            path="*" 
            element={
              <Navigate to={isAuthenticated ? "/" : "/auth"} replace />
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
