// models/Player.js
module.exports = (sequelize, DataTypes) => {
    const Player = sequelize.define('Player', {
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
    user_id: {
        type: DataTypes.UUID,
        allowNull: true, // null for AI players
        references: {
        model: 'users',
        key: 'id'
        }
    },
    color: {
        type: DataTypes.ENUM('white', 'black'),
        allowNull: false
    },
    is_ai: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    ai_name: {
        type: DataTypes.STRING(50),
        allowNull: true // e.g., "Stockfish Level 5"
    },
    rating_before: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    rating_after: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    rating_change: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    is_winner: {
        type: DataTypes.BOOLEAN,
        allowNull: true // null for draws
    },
    joined_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
    }, {
    tableName: 'players',
    timestamps: false,
    indexes: [
        { fields: ['game_id'] },
        { fields: ['user_id'] },
        { fields: ['game_id', 'color'], unique: true }
    ]
    });

    Player.associate = (models) => {
        Player.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
        Player.belongsTo(models.Game, { foreignKey: 'game_id', as: 'game' });
        Player.hasMany(models.Move, { foreignKey: 'player_id', as: 'moves' });
    };

    return Player;
};
