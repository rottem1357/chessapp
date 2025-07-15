const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Opening = sequelize.define('Opening', {
  code: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING
  },
  moves: {
    type: DataTypes.STRING // e.g., "1. e4 d5"
  },
  ecoRange: {
    type: DataTypes.STRING
  }
}, {
  tableName: 'openings',
  timestamps: false
});

module.exports = Opening;
