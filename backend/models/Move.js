const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Game = require('./game');

const Move = sequelize.define('Move', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  gameId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  moveNumber: {
    type: DataTypes.INTEGER
  },
  playerColor: {
    type: DataTypes.ENUM('white', 'black'),
    allowNull: false
  },
  san: {
    type: DataTypes.STRING
  },
  lan: {
    type: DataTypes.STRING
  },
  fen: {
    type: DataTypes.TEXT
  },
  clock: {
    type: DataTypes.INTEGER // seconds left
  },
  evaluationCentipawn: {
    type: DataTypes.INTEGER
  },
  bestMoveLan: {
    type: DataTypes.STRING
  },
  isBlunder: {
    type: DataTypes.BOOLEAN
  },
  isMistake: {
    type: DataTypes.BOOLEAN
  },
  isInaccuracy: {
    type: DataTypes.BOOLEAN
  },
  comment: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'moves',
  timestamps: false
});

Move.belongsTo(Game, { foreignKey: 'gameId' });

module.exports = Move;
