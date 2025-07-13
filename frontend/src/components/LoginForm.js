import React, { useState, useContext } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { AuthContext } from './AuthProvider';
import './LoginForm.css';

/**
 * LoginForm Component
 * @component
 * @description Renders a login form and handles authentication.
 */
const LoginForm = () => {
  const { login } = useContext(AuthContext);
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  /**
   * Handles input changes for the login form.
   * @param {object} e - Input change event
   */
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /**
   * Handles form submission for login.
   * @param {object} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', form);
      if (res && (res.data || res.user)) {
        const userData = res.data ? res.data : res;
        login(userData, userData.token);
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h2>Login</h2>
      <label htmlFor="login-username">Username or Email</label>
      <input id="login-username" name="username" type="text" required value={form.username} onChange={handleChange} />
      <label htmlFor="login-password">Password</label>
      <input id="login-password" name="password" type="password" required value={form.password} onChange={handleChange} />
      {/* Error message */}
      {error && <div style={{ color: 'red', marginTop: '1rem' }}>{error}</div>}
      <button type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
    </form>
  );
};

LoginForm.propTypes = {};

export default LoginForm;
