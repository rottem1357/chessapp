
// models/EngineReport.js
module.exports = (sequelize, DataTypes) => {
    const EngineReport = sequelize.define('EngineReport', {
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
    move_id: {
      type: DataTypes.UUID,
      allowNull: true, // null for position analysis
      references: {
        model: 'moves',
        key: 'id'
      }
    },
    fen: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    engine_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'Stockfish'
    },
    engine_version: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: '15'
    },
    depth: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 50
      }
    },
    evaluation: {
      type: DataTypes.DECIMAL(8, 2), // Centipawn evaluation
      allowNull: false
    },
    is_mate: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    mate_in: {
      type: DataTypes.INTEGER, // Moves to mate (positive for white, negative for black)
      allowNull: true
    },
    best_move: {
      type: DataTypes.STRING(5), // UCI format
      allowNull: false
    },
    pv_line: {
      type: DataTypes.TEXT, // Principal variation (best line)
      allowNull: false
    },
    time_ms: {
      type: DataTypes.INTEGER, // Analysis time in milliseconds
      allowNull: false,
      validate: {
        min: 0
      }
    },
    nodes: {
      type: DataTypes.BIGINT, // Nodes searched
      allowNull: false,
      validate: {
        min: 0
      }
    },
    nps: {
      type: DataTypes.INTEGER, // Nodes per second
      allowNull: false,
      validate: {
        min: 0
      }
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'engine_reports',
    timestamps: false,
    indexes: [
      { fields: ['game_id'] },
      { fields: ['move_id'] },
      { fields: ['fen'] },
      { fields: ['engine_name'] },
      { fields: ['created_at'] }
    ]
  });

  EngineReport.associate = (models) => {
    EngineReport.belongsTo(models.Game, { foreignKey: 'game_id', as: 'game' });
    EngineReport.belongsTo(models.Move, { foreignKey: 'move_id', as: 'move' });
  };
  
  return EngineReport;
};