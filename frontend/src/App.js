import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Game from './pages/Game';
import ProtectedRoute from './components/ProtectedRoute';
import LocalGame from './pages/LocalGame';
import AIGame from './pages/AIGame';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PasswordResetRequestPage from './pages/PasswordResetRequestPage';
import PasswordResetConfirmPage from './pages/PasswordResetConfirmPage';
import UserProfilePage from './pages/UserProfilePage';
import './App.css';
import AuthProvider from './components/AuthProvider';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <header className="App-header">
            <h1>Chess App</h1>
          </header>
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
            <Route path="/game/:gameId" element={
              <ProtectedRoute>
                <Game />
              </ProtectedRoute>
            } />
              <Route path="/local" element={<LocalGame />} />
              <Route path="/ai-game/:gameId" element={<AIGame />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/password-reset/request" element={<PasswordResetRequestPage />} />
              <Route path="/password-reset/confirm" element={<PasswordResetConfirmPage />} />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <UserProfilePage />
                </ProtectedRoute>
              } />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
