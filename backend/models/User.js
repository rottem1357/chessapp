// models/User.js
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 50],
        isAlphanumeric: true
      }
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    display_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    avatar_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    country: {
      type: DataTypes.STRING(2),
      allowNull: true,
      validate: {
        len: [2, 2]
      }
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 500]
      }
    },
    rating_rapid: {
      type: DataTypes.INTEGER,
      defaultValue: 1200,
      validate: {
        min: 400,
        max: 3000
      }
    },
    rating_blitz: {
      type: DataTypes.INTEGER,
      defaultValue: 1200,
      validate: {
        min: 400,
        max: 3000
      }
    },
    rating_bullet: {
      type: DataTypes.INTEGER,
      defaultValue: 1200,
      validate: {
        min: 400,
        max: 3000
      }
    },
    rating_puzzle: {
      type: DataTypes.INTEGER,
      defaultValue: 1200,
      validate: {
        min: 400,
        max: 3000
      }
    },
    games_played: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    games_won: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    games_lost: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    games_drawn: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    puzzles_solved: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    puzzles_attempted: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    is_premium: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true
    },
    last_seen: {
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
    tableName: 'users',
    timestamps: false,
    indexes: [
      { fields: ['username'] },
      { fields: ['email'] },
      { fields: ['rating_rapid'] },
      { fields: ['rating_blitz'] },
      { fields: ['rating_bullet'] },
      { fields: ['created_at'] }
    ]
  });

  User.associate = (models) => {
    User.hasMany(models.Player, { foreignKey: 'user_id', as: 'players' });
    User.hasMany(models.Annotation, { foreignKey: 'user_id', as: 'annotations' });
    User.hasMany(models.PuzzleAttempt, { foreignKey: 'user_id', as: 'puzzleAttempts' });
    User.hasMany(models.Rating, { foreignKey: 'user_id', as: 'ratings' });
    User.hasMany(models.GameInvitation, { foreignKey: 'inviter_id', as: 'sentInvitations' });
    User.hasMany(models.GameInvitation, { foreignKey: 'invitee_id', as: 'receivedInvitations' });
    User.hasMany(models.Friendship, { foreignKey: 'requester_id', as: 'sentFriendRequests' });
    User.hasMany(models.Friendship, { foreignKey: 'addressee_id', as: 'receivedFriendRequests' });
    User.hasOne(models.UserPreferences, { foreignKey: 'user_id', as: 'preferences' });
    User.hasMany(models.ResetToken, { foreignKey: 'user_id', as: 'resetTokens' });
  };

  return User;
};