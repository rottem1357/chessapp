import React, { useState } from 'react';
import { api } from '../services/api';
import './PasswordResetRequestForm.css';

const PasswordResetRequestForm = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await api.post('/api/auth/password-reset/request', { email });
      setSuccess('Password reset link sent to your email.');
    } catch (err) {
      setError(err.message || 'Failed to send reset link');
    }
    setLoading(false);
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h2>Reset Password</h2>
      <label htmlFor="reset-email">Email</label>
      <input id="reset-email" name="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
      <button type="submit" disabled={loading}>{loading ? 'Sending...' : 'Send Reset Link'}</button>
    </form>
  );
};

export default PasswordResetRequestForm;
