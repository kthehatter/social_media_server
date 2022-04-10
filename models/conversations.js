module.exports = (sequelize, DataTypes) => {
    const conversations = sequelize.define(
      "conversations",
      {
        conversation_id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        members: {
          type: DataTypes.ARRAY(DataTypes.STRING),
          allowNull: false,
        },
        members_name: {
          type: DataTypes.ARRAY(DataTypes.STRING),
          allowNull: false,
        },

        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        timestamps: false,
      }
    );
    return conversations;
  };
  