// models/GameInvitation.js
module.exports = (sequelize, DataTypes) => {
    const GameInvitation = sequelize.define('GameInvitation', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    inviter_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
        model: 'users',
        key: 'id'
        }
    },
    invitee_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
        model: 'users',
        key: 'id'
        }
    },
    game_type: {
        type: DataTypes.ENUM('rapid', 'blitz', 'bullet', 'classical'),
        allowNull: false
    },
    time_control: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    inviter_color: {
        type: DataTypes.ENUM('white', 'black', 'random'),
        allowNull: false,
        defaultValue: 'random'
    },
    is_rated: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    status: {
        type: DataTypes.ENUM('pending', 'accepted', 'declined', 'expired'),
        allowNull: false,
        defaultValue: 'pending'
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
        len: [0, 500]
        }
    },
    expires_at: {
        type: DataTypes.DATE,
        allowNull: false
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
    tableName: 'game_invitations',
    timestamps: false,
    indexes: [
        { fields: ['inviter_id'] },
        { fields: ['invitee_id'] },
        { fields: ['status'] },
        { fields: ['expires_at'] }
    ]
    });

    GameInvitation.associate = (models) => {
        GameInvitation.belongsTo(models.User, { foreignKey: 'inviter_id', as: 'inviter' });
        GameInvitation.belongsTo(models.User, { foreignKey: 'invitee_id', as: 'invitee' });
    };

    return GameInvitation;
};