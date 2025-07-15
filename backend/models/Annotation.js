// models/Annotation.js
module.exports = (sequelize, DataTypes) => {
  const Annotation = sequelize.define('Annotation', {
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
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    move_id: {
      type: DataTypes.UUID,
      allowNull: true, // null for general game comments
      references: {
        model: 'moves',
        key: 'id'
      }
    },
    annotation_type: {
      type: DataTypes.ENUM('comment', 'nag', 'variation', 'arrow', 'highlight'),
      allowNull: false,
      defaultValue: 'comment'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    nag_code: {
      type: DataTypes.INTEGER, // Numeric Annotation Glyph (1-255)
      allowNull: true,
      validate: {
        min: 1,
        max: 255
      }
    },
    variation_moves: {
      type: DataTypes.TEXT, // JSON array of alternative moves
      allowNull: true,
      get() {
        const value = this.getDataValue('variation_moves');
        return value ? JSON.parse(value) : null;
      },
      set(value) {
        this.setDataValue('variation_moves', value ? JSON.stringify(value) : null);
      }
    },
    from_square: {
      type: DataTypes.STRING(2), // For arrows/highlights
      allowNull: true,
      validate: {
        is: /^[a-h][1-8]$/
      }
    },
    to_square: {
      type: DataTypes.STRING(2), // For arrows
      allowNull: true,
      validate: {
        is: /^[a-h][1-8]$/
      }
    },
    color: {
      type: DataTypes.STRING(7), // Hex color for arrows/highlights
      allowNull: true,
      validate: {
        is: /^#[0-9A-F]{6}$/i
      }
    },
    is_public: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
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
    tableName: 'annotations',
    timestamps: false,
    indexes: [
      { fields: ['game_id'] },
      { fields: ['user_id'] },
      { fields: ['move_id'] },
      { fields: ['annotation_type'] },
      { fields: ['is_public'] }
    ]
  });

  Annotation.associate = (models) => {
    Annotation.belongsTo(models.Game, { foreignKey: 'game_id', as: 'game' });
    Annotation.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    Annotation.belongsTo(models.Move, { foreignKey: 'move_id', as: 'move' });
  };

  return Annotation;
};