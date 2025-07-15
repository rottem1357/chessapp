// models/Friendship.js
module.exports = (sequelize, DataTypes) => {
    const Friendship = sequelize.define('Friendship', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    requester_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
        model: 'users',
        key: 'id'
        }
    },
    addressee_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
        model: 'users',
        key: 'id'
        }
    },
    status: {
        type: DataTypes.ENUM('pending', 'accepted', 'declined', 'blocked'),
        allowNull: false,
        defaultValue: 'pending'
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
    tableName: 'friendships',
    timestamps: false,
    indexes: [
        { fields: ['requester_id'] },
        { fields: ['addressee_id'] },
        { fields: ['status'] },
        { fields: ['requester_id', 'addressee_id'], unique: true }
    ]
    });

    Friendship.associate = (models) => {
        Friendship.belongsTo(models.User, { foreignKey: 'requester_id', as: 'requester' });
        Friendship.belongsTo(models.User, { foreignKey: 'addressee_id', as: 'addressee' });
    };

    return Friendship;
};