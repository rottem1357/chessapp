
// models/Opening.js
module.exports = (sequelize, DataTypes) => {
  const Opening = sequelize.define('Opening', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    eco_code: {
      type: DataTypes.STRING(3), // ECO classification, e.g., "B90"
      allowNull: false,
      unique: true,
      validate: {
        is: /^[A-E]\d{2}$/
      }
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    variation: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    moves: {
      type: DataTypes.TEXT, // Space-separated moves, e.g., "1.e4 e5 2.Nf3 Nc6"
      allowNull: false
    },
    fen: {
      type: DataTypes.STRING(100), // Final position FEN
      allowNull: false
    },
    move_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    popularity: {
      type: DataTypes.INTEGER, // Number of games played with this opening
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    white_wins: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    black_wins: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    draws: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'openings',
    timestamps: false,
    indexes: [
      { fields: ['eco_code'] },
      { fields: ['name'] },
      { fields: ['popularity'] }
    ]
  });

  Opening.associate = (models) => {
    Opening.hasMany(models.Game, { foreignKey: 'opening_id', as: 'games' });
  };

  return Opening;
};