module.exports = (sequelize, DataTypes) => {
    const comments_replies = sequelize.define(
      "comments_replies",
      {
        reply_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        user_id: {
            type: DataTypes.STRING,
            allowNull: false},
        comment_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        user_replied_to_id: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.STRING,
            allowNull: false
        },
        photo_url: {
            type: DataTypes.STRING,
            allowNull: true
        },
        video_url: {
            type: DataTypes.STRING,
            allowNull: true
        },
        reactions:{
            type: DataTypes.ARRAY(DataTypes.STRING),
            allowNull: false,
            defaultValue: []
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
            
        
      },
      {
        timestamps: false,
      }
    );
  
    return comments_replies;
  };