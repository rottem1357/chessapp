import React from 'react';
import PropTypes from 'prop-types';
import PasswordResetRequestForm from '../components/PasswordResetRequestForm';
import './PasswordResetRequestPage.css';

/**
 * PasswordResetRequestPage Component
 * @component
 * @description Page for requesting a password reset link.
 */
const PasswordResetRequestPage = () => {
  return (
    <div className="auth-page">
      <PasswordResetRequestForm />
    </div>
  );
};

PasswordResetRequestPage.propTypes = {};

export default PasswordResetRequestPage;
