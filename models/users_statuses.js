module.exports = (sequelize, DataTypes) => {
    const users_statuses = sequelize.define(
      "users_statuses",
      {
        users_status_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        user_id: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "offline"
        },
        socket_id: {
            type: DataTypes.STRING,
            allowNull: true
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
  
    return users_statuses;
  };