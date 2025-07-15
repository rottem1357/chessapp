// models/ResetToken.js
module.exports = (sequelize, DataTypes) => {
    const ResetToken = sequelize.define('ResetToken', {
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
    token: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true
    },
    token_type: {
        type: DataTypes.ENUM('password_reset', 'email_verification'),
        allowNull: false
    },
    expires_at: {
        type: DataTypes.DATE,
        allowNull: false
    },
    used_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
    }, {
    tableName: 'reset_tokens',
    timestamps: false,
    indexes: [
        { fields: ['token'] },
        { fields: ['user_id'] },
        { fields: ['expires_at'] },
        { fields: ['token_type'] }
    ]
    });

    ResetToken.associate = (models) => {
        ResetToken.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    };

    return ResetToken;
};