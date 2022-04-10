module.exports = (sequelize, DataTypes) => {
    const notifications = sequelize.define(
      "notifications",
      {
        notification_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        notification_type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        is_read: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        sender_username: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        sender_picture: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        reciever_id: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        reciever_username: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        content: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        url: {
            type: DataTypes.STRING,
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
  
    return notifications;
  };
  