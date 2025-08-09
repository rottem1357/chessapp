import { useAuthStore } from '../store/authStore';

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  if (!isAuthenticated) {
    // Redirect to auth page
    window.location.href = '/auth';
    return null;
  }

  return children;
};

export default ProtectedRoute;
