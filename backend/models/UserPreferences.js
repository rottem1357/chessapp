// models/UserPreferences.js
module.exports = (sequelize, DataTypes) => {
    const UserPreferences = sequelize.define('UserPreferences', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        references: {
        model: 'users',
        key: 'id'
        }
    },
    board_theme: {
        type: DataTypes.STRING(50),
        defaultValue: 'green',
        validate: {
        isIn: [['green', 'brown', 'blue', 'grey', 'wood', 'marble']]
        }
    },
    piece_set: {
        type: DataTypes.STRING(50),
        defaultValue: 'classic',
        validate: {
        isIn: [['classic', 'modern', 'medieval', 'fantasy', 'minimalist']]
        }
    },
    sound_enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    move_sound: {
        type: DataTypes.STRING(50),
        defaultValue: 'standard',
        validate: {
        isIn: [['standard', 'wood', 'futuristic', 'silent']]
        }
    },
    show_coordinates: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    show_legal_moves: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    auto_queen_promotion: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    confirm_resignation: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    enable_premoves: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    show_chat: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    allow_challenges: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    allow_friend_requests: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    email_notifications: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    game_notifications: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    timezone: {
        type: DataTypes.STRING(50),
        defaultValue: 'UTC'
    },
    language: {
        type: DataTypes.STRING(5),
        defaultValue: 'en',
        validate: {
        is: /^[a-z]{2}(_[A-Z]{2})?$/
        }
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
    tableName: 'user_preferences',
    timestamps: false,
    indexes: [
        { fields: ['user_id'] }
    ]
    });

    UserPreferences.associate = (models) => {
        UserPreferences.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    };

    return UserPreferences;
};