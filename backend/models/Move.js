const { move } = require("../routes/games");

// models/Move.js
  module.exports = (sequelize, DataTypes) => {
  const Move = sequelize.define('Move', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    game_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'games',
        key: 'id'
      }
    },
    player_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'players',
        key: 'id'
      }
    },
    move_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    color: {
      type: DataTypes.ENUM('white', 'black'),
      allowNull: false
    },
    san: {
      type: DataTypes.STRING(10), // Standard Algebraic Notation, e.g., "Nf3", "e4"
      allowNull: false
    },
    uci: {
      type: DataTypes.STRING(5), // Universal Chess Interface, e.g., "e2e4"
      allowNull: false
    },
    from_square: {
      type: DataTypes.STRING(2), // e.g., "e2"
      allowNull: false,
      validate: {
        is: /^[a-h][1-8]$/
      }
    },
    to_square: {
      type: DataTypes.STRING(2), // e.g., "e4"
      allowNull: false,
      validate: {
        is: /^[a-h][1-8]$/
      }
    },
    piece: {
      type: DataTypes.STRING(1), // 'p', 'r', 'n', 'b', 'q', 'k'
      allowNull: false,
      validate: {
        isIn: [['p', 'r', 'n', 'b', 'q', 'k']]
      }
    },
    captured_piece: {
      type: DataTypes.STRING(1), // null if no capture
      allowNull: true,
      validate: {
        isIn: [['p', 'r', 'n', 'b', 'q', 'k']]
      }
    },
    promotion_piece: {
      type: DataTypes.STRING(1), // null if no promotion
      allowNull: true,
      validate: {
        isIn: [['r', 'n', 'b', 'q']]
      }
    },
    is_check: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    is_checkmate: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    is_castling: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    is_en_passant: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    fen_after: {
      type: DataTypes.STRING(100), // Board state after this move
      allowNull: false
    },
    time_spent_ms: {
      type: DataTypes.INTEGER, // Time spent on this move in milliseconds
      allowNull: true,
      validate: {
        min: 0
      }
    },
    time_remaining_ms: {
      type: DataTypes.INTEGER, // Time remaining after this move
      allowNull: true,
      validate: {
        min: 0
      }
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'moves',
    timestamps: false,
    indexes: [
      { fields: ['game_id'] },
      { fields: ['player_id'] },
      { fields: ['game_id', 'move_number'] },
      { fields: ['created_at'] }
    ]
  });

  move.associate = (models) => {
    Move.belongsTo(models.Game, { foreignKey: 'game_id', as: 'game' });
    Move.belongsTo(models.Player, { foreignKey: 'player_id', as: 'player' });
    Move.hasMany(models.Annotation, { foreignKey: 'move_id', as: 'annotations' });
    Move.hasMany(models.EngineReport, { foreignKey: 'move_id', as: 'engineReports' });
  };
  return Move;
};
