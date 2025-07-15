const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const mockUsers = new Map();
const mockTokens = new Set();

const authServiceMock = {
  async registerUser(userData) {
    if (mockUsers.has(userData.username) || 
        Array.from(mockUsers.values()).some(u => u.email === userData.email)) {
      throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = {
      id: uuidv4(),
      username: userData.username,
      email: userData.email,
      password_hash: hashedPassword,
      display_name: userData.display_name || userData.username,
      country: userData.country || null,
      created_at: new Date(),
      is_active: true,
      is_verified: false
    };

    mockUsers.set(user.username, user);
    
    const { password_hash, ...userResponse } = user;
    return userResponse;
  },

  async loginUser({ username, password }) {
    const user = mockUsers.get(username) || 
                 Array.from(mockUsers.values()).find(u => u.email === username);
    
    if (!user || !await bcrypt.compare(password, user.password_hash)) {
      throw new Error('Invalid credentials');
    }

    if (!user.is_active) {
      throw new Error('Account is deactivated');
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    mockTokens.add(token);

    const { password_hash, ...userResponse } = user;
    return { user: userResponse, token };
  },

  async logoutUser(token) {
    mockTokens.delete(token);
    return { message: 'Logged out successfully' };
  },

  async getProfile(userId) {
    const user = Array.from(mockUsers.values()).find(u => u.id === userId);
    if (!user) {
      throw new Error('User not found');
    }

    const { password_hash, ...userResponse } = user;
    return userResponse;
  },

  async requestPasswordReset(email) {
    const user = Array.from(mockUsers.values()).find(u => u.email === email);
    if (!user) {
      throw new Error('User not found');
    }

    // In real implementation, would send email
    return { message: 'Password reset email sent' };
  },

  async confirmPasswordReset(resetToken, newPassword) {
    // Mock implementation - in real app, would validate token
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return { message: 'Password reset successfully' };
  },

  // Test utilities
  clear() {
    mockUsers.clear();
    mockTokens.clear();
  },

  getUser(username) {
    return mockUsers.get(username);
  },

  isTokenValid(token) {
    return mockTokens.has(token);
  }
};

module.exports = authServiceMock;
