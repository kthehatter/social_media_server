module.exports = (sequelize, DataTypes) => {
  const profiles = sequelize.define(
    "profiles",
    {
      profile_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      profile_cover: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      profile_bio: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      profile_website: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      profile_location: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      profile_birthday: {
        type: DataTypes.DATE,
        allowNull: true,
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

  return profiles;
};
