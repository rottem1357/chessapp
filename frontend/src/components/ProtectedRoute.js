import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from './AuthProvider';

const ProtectedRoute = ({ children }) => {
  const { user, token } = useContext(AuthContext);
  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default ProtectedRoute;
