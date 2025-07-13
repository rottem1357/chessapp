import React from 'react';
import PropTypes from 'prop-types';
import RegisterForm from '../components/RegisterForm';
import './RegisterPage.css';

/**
 * RegisterPage Component
 * @component
 * @description Page for user registration.
 */
const RegisterPage = () => {
  return (
    <div className="auth-page">
      <RegisterForm />
    </div>
  );
};

RegisterPage.propTypes = {};

export default RegisterPage;
