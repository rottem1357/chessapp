import React from 'react';
import PropTypes from 'prop-types';
import LoginForm from '../components/LoginForm';
import './LoginPage.css';

/**
 * LoginPage Component
 * @component
 * @description Page for user login.
 */
const LoginPage = () => {
  return (
    <div className="auth-page">
      <LoginForm />
    </div>
  );
};

LoginPage.propTypes = {};

export default LoginPage;
