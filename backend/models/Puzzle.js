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
      type: DataTypes.TEXT, // Solution moves in UCI format
      allowNull: false
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