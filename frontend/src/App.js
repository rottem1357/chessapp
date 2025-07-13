import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Game from './pages/Game';
import LocalGame from './pages/LocalGame';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>Chess App</h1>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/game/:gameId" element={<Game />} />
            <Route path="/local" element={<LocalGame />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
