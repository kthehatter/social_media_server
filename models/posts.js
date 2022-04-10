module.exports = (sequelize, DataTypes) => {
  const posts = sequelize.define(
    "posts",
    {
      post_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      post_type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      source_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      quoted_post:{
        type: DataTypes.JSONB,
        allowNull: true,
      },
      user_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      images: {
        type: DataTypes.ARRAY(DataTypes.STRING(1234)),
        allowNull: true,
      },
      videos: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      reactions: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
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

  return posts;
};
