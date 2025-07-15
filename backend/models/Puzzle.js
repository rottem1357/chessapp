const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Game = require('./Game');

const Puzzle = sequelize.define('Puzzle', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  sourceGameId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  fen: DataTypes.TEXT,
  correctMoveLan: DataTypes.STRING,
  rating: DataTypes.INTEGER,
  theme: DataTypes.STRING,
  explanation: DataTypes.TEXT
}, {
  tableName: 'puzzles',
  timestamps: false
});

Puzzle.belongsTo(Game, { foreignKey: 'sourceGameId' });

module.exports = Puzzle;
