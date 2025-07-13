import React, { useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { api } from '../services/api';
import { AuthContext } from './AuthProvider';
import './UserProfile.css';

/**
 * UserProfile Component
 * @component
 * @description Displays and allows editing of the user's profile.
 */
const UserProfile = () => {
  const { user, token } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ username: '', email: '' });
  const [avatar, setAvatar] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch user profile on mount or when token changes
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/api/auth/me');
        setProfile(res.data || res);
        setForm({
          username: res.data?.username || res.username || '',
          email: res.data?.email || res.email || '',
        });
      } catch (err) {
        setError('Failed to load profile');
      }
    };
    if (token) fetchProfile();
  }, [token]);

  /**
   * Handles input changes for profile form.
   * @param {object} e - Input change event
   */
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /**
   * Handles avatar file selection.
   * @param {object} e - File input change event
   */
  const handleAvatarChange = (e) => {
    setAvatar(e.target.files[0]);
  };

  /**
   * Handles profile form submission.
   * @param {object} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      // Avatar upload logic can be added here
      const res = await api.put('/api/auth/me', { ...form });
      setSuccess('Profile updated successfully');
      setEditMode(false);
      setProfile(res.data || res);
    } catch (err) {
      setError('Failed to update profile');
    }
    setLoading(false);
  };

  if (!profile) return <div className="user-profile"><p>Loading...</p></div>;

  return (
    <div className="user-profile">
      <h2>User Profile</h2>
      <img src={profile.avatarUrl || '/default-avatar.png'} alt="Avatar" className="avatar" />
      {!editMode ? (
        <>
          <p><strong>Username:</strong> {profile.username}</p>
          <p><strong>Email:</strong> {profile.email}</p>
          <button onClick={() => setEditMode(true)}>Edit Profile</button>
        </>
      ) : (
        <form onSubmit={handleSubmit} className="profile-form">
          <label htmlFor="username">Username</label>
          <input id="username" name="username" type="text" value={form.username} onChange={handleChange} />
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" value={form.email} onChange={handleChange} />
          <label htmlFor="avatar">Avatar</label>
          <input id="avatar" name="avatar" type="file" accept="image/*" onChange={handleAvatarChange} />
          {/* Error and success messages */}
          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}
          <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
          <button type="button" onClick={() => setEditMode(false)}>Cancel</button>
        </form>
      )}
    </div>
  );
};

UserProfile.propTypes = {};

export default UserProfile;
