// models/Puzzle.js
module.exports = (sequelize, DataTypes) => {
  const Puzzle = sequelize.define('Puzzle', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    fen: {
      type: DataTypes.STRING(100), // Starting position
      allowNull: false
    },
    moves: {
      type: DataTypes.TEXT, // Solution moves, stored as JSON string
      allowNull: false,
      get() {
        const value = this.getDataValue('moves');
        if (!value) return [];
        try {
          const parsed = JSON.parse(value);
          return parsed;
        } catch (_) {
          // Fallback: support CSV stored moves
          return value.split(',').map(s => s.trim()).filter(Boolean);
        }
      },
      set(value) {
        if (Array.isArray(value)) {
          this.setDataValue('moves', JSON.stringify(value));
        } else if (typeof value === 'string') {
          this.setDataValue('moves', value);
        } else {
          // Coerce other types to string
          this.setDataValue('moves', JSON.stringify(value));
        }
      }
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 400,
        max: 3000
      }
    },
    themes: {
      type: DataTypes.TEXT, // JSON array of themes, e.g., ["fork", "pin", "skewer"]
      allowNull: false,
      get() {
        const value = this.getDataValue('themes');
        return value ? JSON.parse(value) : [];
      },
      set(value) {
        this.setDataValue('themes', JSON.stringify(value));
      }
    },
    game_url: {
      type: DataTypes.STRING(500), // Original game URL if available
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    popularity: {
      type: DataTypes.INTEGER, // Number of times attempted
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    success_rate: {
      type: DataTypes.DECIMAL(5, 2), // Percentage success rate
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 100
      }
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'puzzles',
    timestamps: false,
    indexes: [
      { fields: ['rating'] },
      { fields: ['themes'] },
      { fields: ['popularity'] },
      { fields: ['success_rate'] }
    ]
  });

  Puzzle.associate = (models) => {
    Puzzle.hasMany(models.PuzzleAttempt, { foreignKey: 'puzzle_id', as: 'attempts' });
  };

  return Puzzle;
};