import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { handleError, logError } from '../utils/errorHandler';
import './DifficultySelector.css';

/**
 * DifficultySelector Component
 * @component
 * @description AI difficulty selection interface with enhanced features.
 * @param {object} props
 * @param {function} props.onSelect - Callback when a difficulty is selected.
 * @param {string} props.selectedDifficulty - Currently selected difficulty.
 * @param {boolean} props.disabled - Whether selection is disabled.
 * @param {boolean} props.showStats - Whether to show difficulty stats.
 */
const DifficultySelector = ({ 
  onSelect, 
  selectedDifficulty = 'intermediate', 
  disabled = false,
  showStats = true 
}) => {
  const [difficulties, setDifficulties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize difficulties from constants
  useEffect(() => {
    try {
      setLoading(true);
      // Use predefined difficulties from constants
      const difficultyLevels = [
        {
          value: 'beginner',
          label: 'Beginner',
          description: 'Perfect for learning the basics. Makes simple moves and occasional mistakes.',
          depth: 2,
          moveTime: 500,
          skillLevel: 5,
          icon: '🐣',
          color: 'success'
        },
        {
          value: 'intermediate',
          label: 'Intermediate',
          description: 'Good for casual play. Thinks ahead but makes some tactical errors.',
          depth: 3,
          moveTime: 800,
          skillLevel: 8,
          icon: '🌱',
          color: 'info'
        },
        {
          value: 'advanced',
          label: 'Advanced',
          description: 'Challenging opponent. Strong tactics and positional understanding.',
          depth: 5,
          moveTime: 1800,
          skillLevel: 16,
          icon: '🔥',
          color: 'warning'
        },
        {
          value: 'expert',
          label: 'Expert',
          description: 'Very strong player. Deep calculation and excellent endgame play.',
          depth: 6,
          moveTime: 2500,
          skillLevel: 19,
          icon: '🏆',
          color: 'error'
        }
      ];

      setDifficulties(difficultyLevels);
      setError(null);
    } catch (err) {
      const handledError = handleError(err, 'Failed to load difficulty levels');
      setError(handledError.message);
      logError(handledError);
    } finally {
      setLoading(false);
    }
  }, []);
DifficultySelector.propTypes = {
  onSelect: PropTypes.func.isRequired,
  selectedDifficulty: PropTypes.string,
  disabled: PropTypes.bool,
  showStats: PropTypes.bool,
};

  // Handle difficulty selection
  const handleDifficultySelect = useCallback((difficulty) => {
    if (disabled) return;
    
    try {
      onSelect(difficulty);
    } catch (err) {
      const handledError = handleError(err, 'Failed to select difficulty');
      setError(handledError.message);
      logError(handledError);
    }
  }, [disabled, onSelect]);

  // Get difficulty card class
  const getDifficultyClass = useCallback((difficulty) => {
    const baseClass = 'difficulty-card';
    const colorClass = difficulty.color;
    const selectedClass = selectedDifficulty === difficulty.value ? 'selected' : '';
    const disabledClass = disabled ? 'disabled' : '';
    
    return `${baseClass} ${colorClass} ${selectedClass} ${disabledClass}`.trim();
  }, [selectedDifficulty, disabled]);

  // Retry loading difficulties
  const handleRetry = useCallback(() => {
    setError(null);
    setLoading(true);
    
    // Simulate retry with timeout
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="difficulty-selector">
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading difficulty levels...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="difficulty-selector">
        <div className="error-container">
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
          <button onClick={handleRetry} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="difficulty-selector">
      <div className="selector-header">
        <h3>Select AI Difficulty</h3>
        <p className="selector-subtitle">Choose your preferred challenge level</p>
      </div>
      
      <div className="difficulty-grid">
        {difficulties.map((difficulty) => (
          <div
            key={difficulty.value}
            className={getDifficultyClass(difficulty)}
            onClick={() => handleDifficultySelect(difficulty.value)}
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-pressed={selectedDifficulty === difficulty.value}
            aria-label={`Select ${difficulty.label} difficulty`}
            onKeyPress={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleDifficultySelect(difficulty.value);
              }
            }}
          >
            <div className="difficulty-header">
              <div className="difficulty-icon">{difficulty.icon}</div>
              <div className="difficulty-title">
                <h4>{difficulty.label}</h4>
                <div className={`difficulty-badge ${difficulty.color}`}>
                  Level {difficulty.skillLevel}/20
                </div>
              </div>
            </div>
            
            {showStats && (
              <div className="difficulty-stats">
                <div className="stat">
                  <span className="stat-label">Search Depth:</span>
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
            )}
            
            <div className="difficulty-description">
              {difficulty.description}
            </div>
            
            {selectedDifficulty === difficulty.value && (
              <div className="selected-indicator">
                <span className="checkmark">✓</span>
                <span>Selected</span>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {selectedDifficulty && (
        <div className="selection-summary">
          <span className="summary-text">
            Selected: <strong>{difficulties.find(d => d.value === selectedDifficulty)?.label}</strong>
          </span>
        </div>
      )}
    </div>
  );
};

export default DifficultySelector;
