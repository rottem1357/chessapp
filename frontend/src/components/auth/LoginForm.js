import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../../store/authStore';
import { authAPI } from '../../services/api';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import styles from './AuthForm.module.css';

const LoginForm = ({ onSwitchToRegister }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const login = useAuthStore(state => state.login);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.login(data);
      // Your backend returns { data: { user, token } }
      const { user, token } = response.data.data;
      login(user, token);
    } catch (err) {
      console.error('Login error:', err.response?.data);
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Login to Chess App">
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        {error && <div className={styles.error}>{error}</div>}
        
        <Input
          label="Email"
          type="email"
          placeholder="Enter your email"
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address'
            }
          })}
          error={errors.email?.message}
        />

        <Input
          label="Password"
          type="password"
          placeholder="Enter your password"
          {...register('password', {
            required: 'Password is required',
            minLength: {
              value: 6,
              message: 'Password must be at least 6 characters'
            }
          })}
          error={errors.password?.message}
        />

        <Button type="submit" loading={loading} disabled={loading}>
          {loading ? 'Signing In...' : 'Sign In'}
        </Button>

        <div className={styles.switchForm}>
          Don't have an account?{' '}
          <button 
            type="button" 
            onClick={onSwitchToRegister}
            className={styles.linkButton}
          >
            Register here
          </button>
        </div>
      </form>
    </Card>
  );
};

export default LoginForm;
