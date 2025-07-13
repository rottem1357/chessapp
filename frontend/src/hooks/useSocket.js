/**
 * useSocket Hook
 * 
 * Custom React hook for managing Socket.io connections with automatic
 * reconnection, error handling, and connection state management.
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import { API_CONFIG, SOCKET_EVENTS } from '../utils/constants';
import { handleSocketError, logError } from '../utils/errorHandler';

/**
 * Socket connection states
 */
const CONNECTION_STATES = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  ERROR: 'error',
};

/**
 * Custom hook for Socket.io connection management
 * @param {Object} options - Socket options
 * @returns {Object} Socket instance and connection state
 */
export const useSocket = (options = {}) => {
  const [socket, setSocket] = useState(null);
  const [connectionState, setConnectionState] = useState(CONNECTION_STATES.DISCONNECTED);
  const [error, setError] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const maxReconnectAttempts = options.maxReconnectAttempts || 5;
  const reconnectDelay = options.reconnectDelay || 1000;

  /**
   * Handle manual reconnection
   */
  const handleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (reconnectAttempts >= maxReconnectAttempts) {
      setConnectionState(CONNECTION_STATES.ERROR);
      setError('Maximum reconnection attempts reached');
      return;
    }

    const delay = Math.min(reconnectDelay * Math.pow(2, reconnectAttempts), 30000);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      if (socketRef.current) {
        socketRef.current.connect();
      }
    }, delay);
  }, [reconnectAttempts, maxReconnectAttempts, reconnectDelay]);

  /**
   * Initialize socket connection
   */
  const initSocket = useCallback(() => {
    if (socketRef.current) {
      return;
    }

    setConnectionState(CONNECTION_STATES.CONNECTING);
    setError(null);

    const socketOptions = {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: reconnectDelay,
      reconnectionDelayMax: 5000,
      maxReconnectionAttempts: maxReconnectAttempts,
      ...options.socketOptions,
    };

    const newSocket = io(API_CONFIG.SOCKET_URL, socketOptions);
    socketRef.current = newSocket;

    // Connection event handlers
    newSocket.on(SOCKET_EVENTS.CONNECT, () => {
      console.log('Socket connected');
      setConnectionState(CONNECTION_STATES.CONNECTED);
      setError(null);
      setReconnectAttempts(0);
      setSocket(newSocket);
    });

    newSocket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
      console.log('Socket disconnected:', reason);
      setConnectionState(CONNECTION_STATES.DISCONNECTED);
      setSocket(null);
      
      // Handle different disconnect reasons
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, reconnect manually
        handleReconnect();
      }
    });

    newSocket.on(SOCKET_EVENTS.RECONNECT, (attemptNumber) => {
      console.log(`Socket reconnected after ${attemptNumber} attempts`);
      setConnectionState(CONNECTION_STATES.CONNECTED);
      setError(null);
      setReconnectAttempts(0);
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Reconnection attempt ${attemptNumber}`);
      setConnectionState(CONNECTION_STATES.RECONNECTING);
      setReconnectAttempts(attemptNumber);
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('Reconnection error:', error);
      const socketError = handleSocketError(error);
      setError(socketError.message);
      logError(socketError, 'Socket Reconnection');
    });

    newSocket.on('reconnect_failed', () => {
      console.error('Reconnection failed');
      setConnectionState(CONNECTION_STATES.ERROR);
      setError('Failed to reconnect to server');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      const socketError = handleSocketError(error);
      setConnectionState(CONNECTION_STATES.ERROR);
      setError(socketError.message);
      logError(socketError, 'Socket Connection');
    });

    // Generic error handler
    newSocket.on(SOCKET_EVENTS.ERROR, (error) => {
      console.error('Socket error:', error);
      const socketError = handleSocketError(error);
      setError(socketError.message);
      logError(socketError, 'Socket Generic Error');
    });

    return newSocket;
  }, [maxReconnectAttempts, reconnectDelay, options.socketOptions, handleReconnect]);

  /**
   * Manually disconnect socket
   */
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setConnectionState(CONNECTION_STATES.DISCONNECTED);
    }
  }, []);

  /**
   * Manually reconnect socket
   */
  const reconnect = useCallback(() => {
    disconnect();
    setReconnectAttempts(0);
    initSocket();
  }, [disconnect, initSocket]);

  /**
   * Check if socket is connected
   */
  const isConnected = connectionState === CONNECTION_STATES.CONNECTED;

  /**
   * Check if socket is connecting
   */
  const isConnecting = connectionState === CONNECTION_STATES.CONNECTING;

  /**
   * Check if socket is reconnecting
   */
  const isReconnecting = connectionState === CONNECTION_STATES.RECONNECTING;

  /**
   * Check if socket has error
   */
  const hasError = connectionState === CONNECTION_STATES.ERROR;

  /**
   * Initialize socket on mount
   */
  useEffect(() => {
    initSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [initSocket]);

  /**
   * Emit event with error handling
   */
  const emit = useCallback((event, data, callback) => {
    if (socket && isConnected) {
      socket.emit(event, data, callback);
    } else {
      console.warn('Socket not connected. Cannot emit event:', event);
    }
  }, [socket, isConnected]);

  /**
   * Add event listener with cleanup
   */
  const on = useCallback((event, handler) => {
    if (socket) {
      socket.on(event, handler);
      return () => socket.off(event, handler);
    }
    return () => {};
  }, [socket]);

  /**
   * Remove event listener
   */
  const off = useCallback((event, handler) => {
    if (socket) {
      socket.off(event, handler);
    }
  }, [socket]);

  return {
    socket,
    connectionState,
    error,
    reconnectAttempts,
    isConnected,
    isConnecting,
    isReconnecting,
    hasError,
    disconnect,
    reconnect,
    emit,
    on,
    off,
  };
};
