import React, { useState, useEffect } from 'react';
import './DifficultySelector.css';

const DifficultySelector = ({ onSelect, selectedDifficulty = 'intermediate' }) => {
  const [difficulties, setDifficulties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDifficulties();
  }, []);

  const fetchDifficulties = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai/difficulties');
      const data = await response.json();

      if (data.success) {
        setDifficulties(data.difficulties);
      } else {
        setError('Failed to load difficulty levels');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Error fetching difficulties:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDifficultySelect = (difficulty) => {
    onSelect(difficulty);
  };

  const getDifficultyClass = (difficulty) => {
    return `difficulty-card ${difficulty} ${selectedDifficulty === difficulty ? 'selected' : ''}`;
  };

  if (loading) {
    return (
      <div className="difficulty-selector">
        <div className="loading">Loading difficulty levels...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="difficulty-selector">
        <div className="error">
          {error}
          <button onClick={fetchDifficulties}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="difficulty-selector">
      <h3>Select Difficulty</h3>
      <div className="difficulty-grid">
        {difficulties.map((difficulty) => (
          <div
            key={difficulty.value}
            className={getDifficultyClass(difficulty.value)}
            onClick={() => handleDifficultySelect(difficulty.value)}
          >
            <div className="difficulty-header">
              <h4>{difficulty.label}</h4>
              <div className={`difficulty-badge ${difficulty.value}`}>
                {difficulty.value}
              </div>
            </div>
            
            <div className="difficulty-stats">
              <div className="stat">
                <span className="stat-label">Depth:</span>
                <span className="stat-value">{difficulty.depth}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Think Time:</span>
                <span className="stat-value">{difficulty.moveTime}ms</span>
              </div>
              <div className="stat">
                <span className="stat-label">Skill Level:</span>
                <span className="stat-value">{difficulty.skillLevel}/20</span>
              </div>
            </div>
            
            <div className="difficulty-description">
              {difficulty.description}
            </div>
            
            {selectedDifficulty === difficulty.value && (
              <div className="selected-indicator">
                ✓ Selected
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DifficultySelector;
