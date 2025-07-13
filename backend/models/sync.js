// Sync Sequelize models with the database
const sequelize = require('../config/database');
const User = require('./User');

async function syncModels() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');
    await User.sync({ alter: true });
    console.log('User model synced.');
    process.exit(0);
  } catch (err) {
    console.error('Error syncing models:', err);
    process.exit(1);
  }
}

syncModels();
