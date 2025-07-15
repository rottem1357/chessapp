// models/PuzzleAttempt.js
module.exports = (sequelize, DataTypes) => {
    const PuzzleAttempt = sequelize.define('PuzzleAttempt', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    puzzle_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
        model: 'puzzles',
        key: 'id'
        }
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
        model: 'users',
        key: 'id'
        }
    },
    is_solved: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
    moves_played: {
        type: DataTypes.TEXT, // JSON array of moves attempted
        allowNull: false,
        get() {
        const value = this.getDataValue('moves_played');
        return value ? JSON.parse(value) : [];
        },
        set(value) {
        this.setDataValue('moves_played', JSON.stringify(value));
        }
    },
    time_spent_ms: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
        min: 0
        }
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
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
    }, {
    tableName: 'puzzle_attempts',
    timestamps: false,
    indexes: [
        { fields: ['puzzle_id'] },
        { fields: ['user_id'] },
        { fields: ['is_solved'] },
        { fields: ['created_at'] }
    ]
    });

    PuzzleAttempt.associate = (models) => {
        PuzzleAttempt.belongsTo(models.Puzzle, { foreignKey: 'puzzle_id', as: 'puzzle' });
        PuzzleAttempt.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    };
    return PuzzleAttempt;
};