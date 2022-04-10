const { cloudinary } = require("../../../../utilities/cloudinarySetup");
const express = require("express");
const router = express.Router();
const asyncHandler = require("../../../../middleware/asyncHandler");
const models = require("../../../../models");
const uploadVerify = require("../../../../middleware/uploadVerify");
const verifyUserToken = require("../../../../middleware/verifyUserToken");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const JWTSECRET = process.env.JWTSECRET;
router.post(
  "/upload",
  [verifyUserToken,uploadVerify.single("file")],
  asyncHandler(async (req, res) => {
      console.log("here")
      const senderId = req.user.id;
    const user = await models.users.findAll({
        where: {
            user_id: senderId,
        },
    });
    const { postId, commentContent, commentVideo, commentImage } = req.body;
    const post = await models.posts.findAll({
        where: {
            post_id: postId,
        },
    });
    console.log("postId", postId);
    if (!commentContent&&!commentVideo&&!commentImage) {
      return res.status(400).send({
        message: "please provide a post content ",
      });
    }
    let comment;
    if (commentImage) {
        console.log("commentImage");
        const uploadResponse = await cloudinary.uploader.upload(commentImage, {
            upload_preset: 'comments_images',
            
        });
        const optimizedImageUrl = new URL("http://res.cloudinary.com/khalilay/image/upload/q_auto/v1/"+uploadResponse.public_id);
        comment = await models.comments.create({
            user_id: senderId,
            user_name: user[0].first_name + " " + user[0].last_name.toUpperCase(),
            description: commentContent,
            post_id: postId,
            images: [{
                originalQualityImageUrl:uploadResponse.secure_url,
                optimizedImageUrl:optimizedImageUrl.href}],
        });
    }else if (commentVideo) {
        console.log("commentVideo");
        const uploadResponse = await cloudinary.uploader.upload(commentVideo, {
            resource_type: "video", 
            upload_preset: 'comments_videos',
        });
        console.log(uploadResponse);
        comment = await models.comments.create({
            user_id: senderId,
            user_name: user[0].first_name + " " + user[0].last_name.toUpperCase(),
            description: commentContent,
            post_id: postId,
            videos: uploadResponse.secure_url,
        });
    }
    else{
        comment = await models.comments.create({
            user_id: senderId,
            user_name: user[0].first_name + " " + user[0].last_name.toUpperCase(),
            description: commentContent,
            post_id: postId,
        });
    }
    comment.dataValues.user_picture = user[0].profile_picture;
    comment.dataValues.username = user[0].username;
    comment.dataValues.likesNumber = comment.reactions.length
    const reciever = await models.users.findAll({
        where: {
            user_id: post[0].user_id,
        },
    });
    if (reciever[0].user_id!==senderId) {
        const addedNotifications = await models.notifications.create({
            reciever_id: reciever[0].user_id,
            reciever_username: reciever[0].username,
            sender_id: senderId,
            sender_username: user[0].username,
            sender_picture: user[0].profile_picture,
            notification_type: "post comment",
            content: "commented on your post"+" "+post[0].description?post[0].description.length>15? post[0].description.substring(0, 16):post[0].description:"", 
            url: `/u/${user[0].username}/${postId}`,
        });
    }
    
    
    return res.status(200).send({
      message: "comment uploaded successfully",
      comment:comment.dataValues,
    });
  })
);
router.get('/:postId/:pageNumber', asyncHandler(async (req, res) => {
    const { postId,pageNumber } = req.params;
    let comments = await models.comments.findAll({
        limit: 10,
        offset: (pageNumber - 1) * 10,
        order: [["created_at", "DESC"]],
        where: {
            post_id: postId,
        },
    });
    let user = null;
    try {
        //it is going to give use the user id (user:{id: user.id})
        const accessToken = req.header("accessToken");
        const verify = jwt.verify(accessToken, JWTSECRET);
        user = verify.user;
      } catch (err) {
          console.log("err", err);
        user = null;
      }
    if (user!==undefined&&user!==null) {
        console.log("cecking isliked");
        for (let index = 0; index < comments.length; index++) {
            const comment = comments[index];
            comment.dataValues.isLiked=comment.reactions.includes(user.id)?true:false
        }        
    }
    for (let index = 0; index < comments.length; index++) {
        const comment = comments[index];
        const user = await models.users.findAll({
            where: {
                user_id: comment.user_id,
            },
        });
        comment.dataValues.username=user[0].username;
        comment.dataValues.user_picture=user[0].profile_picture;
        comment.dataValues.likesNumber=comment.reactions.length;
    }
    return res.status(200).send({
        message: "comments fetched successfully",
        comments,
    });
}));
router.post(
    "/react",
    [verifyUserToken],
    asyncHandler(async (req, res) => {
     const senderId = req.user.id;
      
      const { commentId,commentIsLiked } = req.body;
        const comment = await models.comments.findAll({
            where: {
                comment_id: commentId,
            },
        });
        if (!comment) {
            return res.status(400).send({
                message: "comment not found",
            });
        }
        if (commentIsLiked) {
            if (comment[0].reactions.includes(senderId)) {
                console.log("comment is already liked");
                //remove id from reactions 
                for( var i = 0; i < comment[0].reactions.length; i++){ 
                    if ( comment[0].reactions[i] === senderId) { 
                        const commentReaction = await models.comments.update(
                            {
                                reactions: comment[0].reactions.filter(reaction => reaction !== senderId ),
                            },
                            {
                                where: {
                                    comment_id: commentId,
                                },
                            }
                        );
                        break; 
                    }
                }
            }
        }else{
            if (!comment[0].reactions.includes(senderId)) {
                const commentReaction = await models.comments.update(
                    {
                        reactions: comment[0].reactions.concat(senderId),
                    },
                    {
                        where: {
                            comment_id: commentId,
                        },
                    }
                );
                const sender = await models.users.findAll({
                    where: {
                        user_id: senderId,
                    },
                    });
                const post = await models.posts.findAll({
                    where: {
                        post_id: comment[0].post_id,
                    },
                });
                if (post[0].user_id!==senderId) {
                    const addedNotifications = await models.notifications.create({
                        reciever_id: post[0].user_id,
                        sender_id: senderId,
                        sender_username: sender[0].username,
                        sender_picture: sender[0].profile_picture,
                        notification_type: "like comment",
                        content: `liked your comment`,
                        url: `/u/${sender[0].username}/${comment[0].post_id}`,
                    });
                }
                
            }
        }
        
      return res.status(200).send({
        message: "comment uploaded successfully",
        comment,
      });
    })
  );

module.exports = router;