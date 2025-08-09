import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../../store/authStore';
import { authAPI } from '../../services/api';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import styles from './AuthForm.module.css';

const RegisterForm = ({ onSwitchToLogin }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const login = useAuthStore(state => state.login);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm();

  const password = watch('password');

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.register({
        username: data.username,
        email: data.email,
        password: data.password,
        display_name: data.username, // Use username as display name
      });
      
      // Your backend returns { data: { user, token } } for registration too
      const { user, token } = response.data.data;
      login(user, token);
    } catch (err) {
      console.error('Registration error:', err.response?.data);
      console.error('Validation details:', err.response?.data?.data);
      console.error('Full error object:', err);
      
      // Extract validation errors
      const backendResponse = err.response?.data;
      let errorMessage = 'Registration failed';
      
      if (backendResponse?.data && typeof backendResponse.data === 'object') {
        // If there are specific field validation errors
        const validationErrors = Object.values(backendResponse.data).flat();
        errorMessage = validationErrors.join(', ') || backendResponse.message || errorMessage;
      } else {
        errorMessage = backendResponse?.message || errorMessage;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Join Chess App">
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        {error && <div className={styles.error}>{error}</div>}
        
        <Input
          label="Username"
          placeholder="Choose a username"
          {...register('username', {
            required: 'Username is required',
            minLength: {
              value: 3,
              message: 'Username must be at least 3 characters'
            },
            maxLength: {
              value: 20,
              message: 'Username must be less than 20 characters'
            }
          })}
          error={errors.username?.message}
        />

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
          placeholder="Create a password"
          {...register('password', {
            required: 'Password is required',
            minLength: {
              value: 6,
              message: 'Password must be at least 6 characters'
            }
          })}
          error={errors.password?.message}
        />

        <Input
          label="Confirm Password"
          type="password"
          placeholder="Confirm your password"
          {...register('confirmPassword', {
            required: 'Please confirm your password',
            validate: value => 
              value === password || 'Passwords do not match'
          })}
          error={errors.confirmPassword?.message}
        />

        <Button type="submit" loading={loading} disabled={loading}>
          {loading ? 'Creating Account...' : 'Create Account'}
        </Button>

        <div className={styles.switchForm}>
          Already have an account?{' '}
          <button 
            type="button" 
            onClick={onSwitchToLogin}
            className={styles.linkButton}
          >
            Sign in here
          </button>
        </div>
      </form>
    </Card>
  );
};

export default RegisterForm;
