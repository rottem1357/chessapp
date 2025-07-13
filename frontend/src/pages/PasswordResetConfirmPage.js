import React from 'react';
import PropTypes from 'prop-types';
import PasswordResetConfirmForm from '../components/PasswordResetConfirmForm';
import './PasswordResetConfirmPage.css';

/**
 * PasswordResetConfirmPage Component
 * @component
 * @description Page for confirming password reset with a new password.
 */
const PasswordResetConfirmPage = () => {
  return (
    <div className="auth-page">
      <PasswordResetConfirmForm />
    </div>
  );
};

PasswordResetConfirmPage.propTypes = {};

export default PasswordResetConfirmPage;
