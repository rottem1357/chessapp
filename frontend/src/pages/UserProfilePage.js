import React from 'react';
import PropTypes from 'prop-types';
import UserProfile from '../components/UserProfile';
import './UserProfilePage.css';

/**
 * UserProfilePage Component
 * @component
 * @description Page for displaying and editing user profile.
 */
const UserProfilePage = () => {
  return (
    <div className="auth-page">
      <UserProfile />
    </div>
  );
};

UserProfilePage.propTypes = {};

export default UserProfilePage;
