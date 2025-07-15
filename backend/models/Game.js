const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Game = sequelize.define('Game', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  whiteUserId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  blackUserId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  result: {
    type: DataTypes.ENUM('1-0', '0-1', '1/2-1/2', '*'),
    defaultValue: '*'
  },
  startedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  endedAt: {
    type: DataTypes.DATE
  },
  timeControl: {
    type: DataTypes.STRING, // e.g., '10|0'
    allowNull: false
  },
  rated: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  openingCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  source: {
    type: DataTypes.STRING,
    defaultValue: 'live' // or 'imported', 'analysis'
  },
  pgn: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'games',
  timestamps: false
});

// Associations
Game.belongsTo(User, { as: 'whitePlayer', foreignKey: 'whiteUserId' });
Game.belongsTo(User, { as: 'blackPlayer', foreignKey: 'blackUserId' });

module.exports = Game;
