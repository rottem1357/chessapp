import React, { createContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * AuthProvider Component
 * @component
 * @description Provides authentication context to child components.
 * @param {object} props
 * @param {React.ReactNode} props.children - Child components
 */
export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('jwtToken'));

  // Persist JWT token in localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem('jwtToken', token);
    } else {
      localStorage.removeItem('jwtToken');
    }
  }, [token]);

  /**
   * Log in a user and set JWT token
   * @param {object} userData
   * @param {string} jwt
   */
  const login = (userData, jwt) => {
    setUser(userData);
    setToken(jwt);
  };

  /**
   * Log out the user and clear JWT token
   */
  const logout = () => {
    setUser(null);
    setToken(null);
  };

  /**
   * Register a new user and set JWT token
   * @param {object} userData
   * @param {string} jwt
   */
  const register = (userData, jwt) => {
    setUser(userData);
    setToken(jwt);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthProvider;
