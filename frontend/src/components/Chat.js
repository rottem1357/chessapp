import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../hooks/useSocket';
import { SOCKET_EVENTS, UI_CONSTANTS } from '../utils/constants';
import { handleError, logError } from '../utils/errorHandler';
import { validateMessage } from '../utils/validation';
import { formatTimestamp, debounce } from '../utils/helpers';
import './Chat.css';

/**
 * Chat Component
 * 
 * Real-time chat interface for multiplayer games
 * Features:
 * - Real-time message synchronization
 * - Message validation and filtering
 * - Auto-scroll to latest messages
 * - Enhanced accessibility
 * - Typing indicators
 * - Message history persistence
 */
const Chat = ({ gameId, playerColor, opponent, disabled = false }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [opponentTyping, setOpponentTyping] = useState(false);
  const [error, setError] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const socket = useSocket();
  
  // Player name based on color
  const playerName = `Player ${playerColor}`;

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'end'
    });
  }, []);

  // Debounced typing indicator
  const debouncedStopTyping = useCallback(() => {
    return debounce(() => {
      setIsTyping(false);
      if (socket && isConnected) {
        socket.emit(SOCKET_EVENTS.STOP_TYPING, { gameId });
      }
    }, 1000);
  }, [socket, isConnected, gameId]);

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!isTyping && socket && isConnected) {
      setIsTyping(true);
      socket.emit(SOCKET_EVENTS.START_TYPING, { gameId, playerName });
    }
    debouncedStopTyping();
  }, [isTyping, socket, isConnected, gameId, playerName, debouncedStopTyping]);

  // Auto-scroll effect
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => {
      setIsConnected(true);
      setError('');
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setOpponentTyping(false);
    };

    const handleChatMessage = (message) => {
      try {
        setMessages(prev => [...prev, {
          ...message,
          id: message.id || Date.now(),
          timestamp: message.timestamp || Date.now()
        }]);
      } catch (err) {
        const handledError = handleError(err, 'Failed to receive message');
        setError(handledError.message);
        logError(handledError);
      }
    };

    const handleStartTyping = (data) => {
      if (data.playerName !== playerName) {
        setOpponentTyping(true);
      }
    };

    const handleStopTyping = (data) => {
      if (data.playerName !== playerName) {
        setOpponentTyping(false);
      }
    };

    const handleChatError = (data) => {
      const errorMessage = data.message || 'Failed to send message';
      setError(errorMessage);
      logError(new Error(`Chat error: ${errorMessage}`));
    };

    socket.on(SOCKET_EVENTS.CONNECT, handleConnect);
    socket.on(SOCKET_EVENTS.DISCONNECT, handleDisconnect);
    socket.on(SOCKET_EVENTS.CHAT_MESSAGE, handleChatMessage);
    socket.on(SOCKET_EVENTS.START_TYPING, handleStartTyping);
    socket.on(SOCKET_EVENTS.STOP_TYPING, handleStopTyping);
    socket.on(SOCKET_EVENTS.CHAT_ERROR, handleChatError);

    return () => {
      socket.off(SOCKET_EVENTS.CONNECT, handleConnect);
      socket.off(SOCKET_EVENTS.DISCONNECT, handleDisconnect);
      socket.off(SOCKET_EVENTS.CHAT_MESSAGE, handleChatMessage);
      socket.off(SOCKET_EVENTS.START_TYPING, handleStartTyping);
      socket.off(SOCKET_EVENTS.STOP_TYPING, handleStopTyping);
      socket.off(SOCKET_EVENTS.CHAT_ERROR, handleChatError);
    };
  }, [socket, playerName]);

  // Clear error after delay
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Handle message input change
  const handleMessageChange = useCallback((e) => {
    const value = e.target.value;
    setNewMessage(value);
    
    if (value.trim()) {
      handleTyping();
    }
  }, [handleTyping]);

  // Handle message submission
  const handleSendMessage = useCallback((e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || disabled || !isConnected) {
      return;
    }

    // Validate message
    const validation = validateMessage(newMessage.trim());
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    try {
      socket.emit(SOCKET_EVENTS.CHAT_MESSAGE, {
        gameId,
        playerName,
        message: newMessage.trim(),
        timestamp: Date.now()
      });

      setNewMessage('');
      setIsTyping(false);
      
      // Focus back to input
      inputRef.current?.focus();
    } catch (err) {
      const handledError = handleError(err, 'Failed to send message');
      setError(handledError.message);
      logError(handledError);
    }
  }, [newMessage, disabled, isConnected, socket, gameId, playerName]);

  // Handle key press for accessibility
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  }, [handleSendMessage]);

  return (
    <div className="chat-container">
      {/* Chat Header */}
      <div className="chat-header">
        <h3>Chat</h3>
        {opponent && (
          <span className="opponent-name">with {opponent}</span>
        )}
        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '●' : '○'}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="chat-error" role="alert">
          <button 
            className="close-btn"
            onClick={() => setError('')}
            aria-label="Close error"
          >
            ×
          </button>
          {error}
        </div>
      )}
      
      {/* Messages Container */}
      <div className="chat-messages" role="log" aria-live="polite">
        {messages.length === 0 ? (
          <div className="empty-messages">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`message ${msg.playerName === playerName ? 'own-message' : 'other-message'}`}
              role="article"
            >
              <div className="message-header">
                <span className="player-name">{msg.playerName}</span>
                <span className="timestamp">
                  {formatTimestamp(msg.timestamp)}
                </span>
              </div>
              <div className="message-content">{msg.message}</div>
            </div>
          ))
        )}
        
        {/* Typing Indicator */}
        {opponentTyping && (
          <div className="typing-indicator">
            <span className="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </span>
            <span className="typing-text">{opponent} is typing...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form className="chat-input" onSubmit={handleSendMessage}>
        <div className="input-container">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={handleMessageChange}
            onKeyPress={handleKeyPress}
            placeholder={isConnected ? "Type a message..." : "Disconnected"}
            maxLength={UI_CONSTANTS.MAX_MESSAGE_LENGTH}
            disabled={disabled || !isConnected}
            aria-label="Chat message input"
          />
          <button 
            type="submit" 
            disabled={!newMessage.trim() || disabled || !isConnected}
            aria-label="Send message"
          >
            <span className="send-icon">➤</span>
          </button>
        </div>
        
        {/* Character Count */}
        {newMessage.length > UI_CONSTANTS.MAX_MESSAGE_LENGTH * 0.8 && (
          <div className="character-count">
            {newMessage.length}/{UI_CONSTANTS.MAX_MESSAGE_LENGTH}
          </div>
        )}
      </form>
    </div>
  );
};

export default Chat;
