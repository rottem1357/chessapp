// models/Game.js
module.exports = (sequelize, DataTypes) => {
  const Game = sequelize.define('Game', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    game_type: {
      type: DataTypes.ENUM('rapid', 'blitz', 'bullet', 'classical', 'correspondence', 'ai', 'puzzle'),
      allowNull: false,
      defaultValue: 'rapid'
    },
    time_control: {
      type: DataTypes.STRING(20), // e.g., "10+0", "5+3", "30+0"
      allowNull: false,
      defaultValue: "10+0"
    },
    time_limit_seconds: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 600, // 10 minutes
      validate: {
        min: 30
      }
    },
    increment_seconds: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    status: {
      type: DataTypes.ENUM('waiting', 'active', 'finished', 'aborted', 'abandoned'),
      allowNull: false,
      defaultValue: 'waiting'
    },
    result: {
      type: DataTypes.ENUM('white_wins', 'black_wins', 'draw', 'aborted', 'abandoned'),
      allowNull: true
    },
    result_reason: {
      type: DataTypes.ENUM('checkmate', 'resignation', 'timeout', 'stalemate', 'insufficient_material', 
                          'threefold_repetition', 'fifty_move_rule', 'mutual_agreement', 'abandonment'),
      allowNull: true
    },
    current_fen: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' // Starting position
    },
    current_turn: {
      type: DataTypes.ENUM('white', 'black'),
      allowNull: false,
      defaultValue: 'white'
    },
    move_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    white_time_remaining: {
      type: DataTypes.INTEGER, // milliseconds
      allowNull: true
    },
    black_time_remaining: {
      type: DataTypes.INTEGER, // milliseconds
      allowNull: true
    },
    last_move_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    is_rated: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    is_private: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: true // For private games
    },
    ai_difficulty: {
      type: DataTypes.ENUM('beginner', 'easy', 'intermediate', 'hard', 'expert', 'master'),
      allowNull: true // Only for AI games
    },
    opening_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'openings',
        key: 'id'
      }
    },
    started_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    finished_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'games',
    timestamps: false,
    indexes: [
      { fields: ['status'] },
      { fields: ['game_type'] },
      { fields: ['is_rated'] },
      { fields: ['created_at'] },
      { fields: ['started_at'] },
      { fields: ['finished_at'] }
    ]
  });

  Game.associate = (models) => {
    Game.hasMany(models.Player, { foreignKey: 'game_id', as: 'players' });
    Game.hasMany(models.Move, { foreignKey: 'game_id', as: 'moves' });
    Game.hasMany(models.Annotation, { foreignKey: 'game_id', as: 'annotations' });
    Game.hasMany(models.EngineReport, { foreignKey: 'game_id', as: 'engineReports' });
    Game.hasMany(models.Rating, { foreignKey: 'game_id', as: 'ratingChanges' });
    Game.belongsTo(models.Opening, { foreignKey: 'opening_id', as: 'opening' });
  };

  return Game;
};
