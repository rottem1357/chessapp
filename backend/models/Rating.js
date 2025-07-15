// models/Rating.js
module.exports = (sequelize, DataTypes) => {
    const Rating = sequelize.define('Rating', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
        model: 'users',
        key: 'id'
        }
    },
    game_id: {
        type: DataTypes.UUID,
        allowNull: true, // null for puzzle ratings
        references: {
        model: 'games',
        key: 'id'
        }
    },
    rating_type: {
        type: DataTypes.ENUM('rapid', 'blitz', 'bullet', 'classical', 'puzzle'),
        allowNull: false
    },
    rating_before: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
        min: 400,
        max: 3000
        }
    },
    rating_after: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
        min: 400,
        max: 3000
        }
    },
    rating_change: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    opponent_rating: {
        type: DataTypes.INTEGER,
        allowNull: true, // null for puzzle ratings
        validate: {
        min: 400,
        max: 3000
        }
    },
    expected_score: {
        type: DataTypes.DECIMAL(4, 3), // Expected result based on ratings (0.000-1.000)
        allowNull: true
    },
    actual_score: {
        type: DataTypes.DECIMAL(3, 2), // Actual result (0.00, 0.50, 1.00)
        allowNull: true,
        validate: {
        isIn: [[0.00, 0.50, 1.00]]
        }
    },
    k_factor: {
        type: DataTypes.INTEGER, // K-factor used in calculation
        allowNull: false,
        defaultValue: 32,
        validate: {
        min: 10,
        max: 50
        }
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
    }, {
    tableName: 'ratings',
    timestamps: false,
    indexes: [
        { fields: ['user_id'] },
        { fields: ['game_id'] },
        { fields: ['rating_type'] },
        { fields: ['created_at'] }
    ]
    });

    Rating.associate = (models) => {
        Rating.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
        Rating.belongsTo(models.Game, { foreignKey: 'game_id', as: 'game' });
    };

    return Rating;
};
