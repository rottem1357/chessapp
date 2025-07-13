import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { AuthContext } from './AuthProvider';
import './RegisterForm.css';
import './RegisterForm.css';

const RegisterForm = () => {
  const { register } = useContext(AuthContext);
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/api/auth/register', form);
      if (res && (res.data || res.user)) {
        // Use either res.data or res.user depending on backend response
        const userData = res.data ? res.data : res;
        register(userData, userData.token);
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
    }
    setLoading(false);
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h2>Register</h2>
      <label htmlFor="register-username">Username</label>
      <input id="register-username" name="username" type="text" required value={form.username} onChange={handleChange} />
      <label htmlFor="register-email">Email</label>
      <input id="register-email" name="email" type="email" required value={form.email} onChange={handleChange} />
      <label htmlFor="register-password">Password</label>
      <input id="register-password" name="password" type="password" required value={form.password} onChange={handleChange} />
      {error && <div style={{ color: 'red', marginTop: '1rem' }}>{error}</div>}
      <button type="submit" disabled={loading}>{loading ? 'Registering...' : 'Register'}</button>
    </form>
  );
};

export default RegisterForm;
