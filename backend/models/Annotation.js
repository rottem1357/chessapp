const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Move = require('./Move');
const User = require('./User');

const Annotation = sequelize.define('Annotation', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  moveId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('comment', 'arrow', 'highlight', 'question')
  },
  content: {
    type: DataTypes.TEXT
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'annotations',
  timestamps: false
});

Annotation.belongsTo(Move, { foreignKey: 'moveId' });
Annotation.belongsTo(User, { foreignKey: 'userId' });

module.exports = Annotation;
