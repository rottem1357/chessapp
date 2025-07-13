import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import './PasswordResetConfirmForm.css';

/**
 * PasswordResetConfirmForm Component
 * @component
 * @description Renders a form to set a new password using a reset token.
 */
const PasswordResetConfirmForm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const resetToken = searchParams.get('token');

  /**
   * Handles form submission for password reset confirmation.
   * @param {object} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await api.post('/api/auth/password-reset/confirm', {
        reset_token: resetToken,
        new_password: newPassword,
      });
      setSuccess('Password reset successful. You can now log in.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    }
    setLoading(false);
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h2>Set New Password</h2>
      <label htmlFor="new-password">New Password</label>
      <input id="new-password" name="newPassword" type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} />
      {/* Error and success messages */}
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
      <button type="submit" disabled={loading}>{loading ? 'Resetting...' : 'Reset Password'}</button>
    </form>
  );
};

PasswordResetConfirmForm.propTypes = {};

export default PasswordResetConfirmForm;
