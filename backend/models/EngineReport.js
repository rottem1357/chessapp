const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Game = require('./game');

const EngineReport = sequelize.define('EngineReport', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  gameId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  engineName: {
    type: DataTypes.STRING
  },
  depth: {
    type: DataTypes.INTEGER
  },
  aclWhite: DataTypes.INTEGER,
  aclBlack: DataTypes.INTEGER,
  blundersWhite: DataTypes.INTEGER,
  blundersBlack: DataTypes.INTEGER,
  mistakesWhite: DataTypes.INTEGER,
  mistakesBlack: DataTypes.INTEGER,
  inaccuraciesWhite: DataTypes.INTEGER,
  inaccuraciesBlack: DataTypes.INTEGER,
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'engine_reports',
  timestamps: false
});

EngineReport.belongsTo(Game, { foreignKey: 'gameId' });

module.exports = EngineReport;
