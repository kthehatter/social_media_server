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
  [verifyUserToken, uploadVerify.single("file")],
  asyncHandler(async (req, res) => {
    senderId = req.user.id;
    const user = await models.users.findAll({
      where: {
        user_id: senderId,
      },
    });
    const { postContent, postVideo, postImage } = req.body;
    if (!postContent && !postVideo && !postImage) {
      return res.status(400).send({
        message: "please provide a post content ",
      });
    }
    let post;
    if (postImage) {
      const uploadResponse = await cloudinary.uploader.upload(postImage, {
        upload_preset: "posts_images",
      });
      const optimizedImageUrl = new URL(
        "http://res.cloudinary.com/khalilay/image/upload/q_auto/v1/" +
          uploadResponse.public_id
      );
      post = await models.posts.create({
        post_type: "created",
        user_id: senderId,
        user_name: user[0].first_name + " " + user[0].last_name.toUpperCase(),
        description: postContent,
        images: [
          {
            originalQualityImageUrl: uploadResponse.secure_url,
            optimizedImageUrl: optimizedImageUrl.href,
          },
        ],
      });
    } else if (postVideo) {
      const uploadResponse = await cloudinary.uploader.upload(postVideo, {
        resource_type: "video",
        upload_preset: "posts_videos",
      });
      post = await models.posts.create({
        post_type: "created",
        user_id: senderId,
        user_name: user[0].first_name + " " + user[0].last_name.toUpperCase(),
        description: postContent,
        videos: uploadResponse.secure_url,
      });
    } else {
      post = await models.posts.create({
        post_type: "created",
        user_id: senderId,
        user_name: user[0].first_name + " " + user[0].last_name.toUpperCase(),
        description: postContent,
      });
    }
    post.dataValues.user_name = user[0].first_name + " " + user[0].last_name;
    post.dataValues.username = user[0].username;
    post.dataValues.user_picture = user[0].profile_picture;

    return res.status(200).send({
      message: "post uploaded successfully",
      post,
    });
  })
);
router.post(
  "/share",
  [verifyUserToken],
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { postId, PostIsShared } = req.body;
    const post = await models.posts.findAll({
      where: {
        post_id: postId,
      },
    });
    if (!post) {
      return res.status(400).send({
        message: "post not found",
      });
    }
    let postShared;
    if (PostIsShared) {
      // remove shared post
      postShared = await models.posts.destroy({
        where: {
          post_type: "shared",
          user_id: userId,
          source_id: postId,
        },
      });
    } else {
      postShared = await models.posts.create({
        post_type: "shared",
        user_id: userId,
        source_id: postId,
        user_name: post[0].user_name,
        description: post[0].description,
        images: post[0].images,
        videos: post[0].videos,
        reactions: post[0].reactions,
      });
    }

    return res.status(200).send({
      message: "post uploaded successfully",
      post: postShared,
    });
  })
);
router.post(
  "/quote",
  [verifyUserToken, uploadVerify.single("file")],
  asyncHandler(async (req, res) => {
    senderId = req.user.id;
    const user = await models.users.findAll({
      where: {
        user_id: senderId,
      },
    });
    const { quotedPostId, postContent, postVideo, postImage } = req.body;
    const quotedPost = await models.posts.findAll({
      where: {
        post_id: quotedPostId,
      },
    });
    const quotedPostUser = await models.users.findAll({
      where: {
        user_id: quotedPost[0].user_id,
      },
    });
    const quotedPostUserPicture = quotedPostUser[0].profile_picture;
    if (!quotedPost) {
      return res.status(400).send({
        message: "post not found",
      });
    }

    let post;
    if (postImage) {
      const uploadResponse = await cloudinary.uploader.upload(postImage, {
        upload_preset: "posts_images",
      });
      const optimizedImageUrl = new URL(
        "http://res.cloudinary.com/khalilay/image/upload/q_auto/v1/" +
          uploadResponse.public_id
      );
      post = await models.posts.create({
        post_type: "quoted",
        user_id: senderId,
        source_id: quotedPost[0].post_id,
        quoted_post: {
          post_id: quotedPost[0].post_id,
          user_id: quotedPost[0].user_id,
          user_name: quotedPost[0].user_name,
          description: quotedPost[0].description,
          user_picture: quotedPostUserPicture,
          images: quotedPost[0].images,
          videos: quotedPost[0].videos,
          created_at: quotedPost[0].created_at,
        },
        user_name: user[0].first_name + " " + user[0].last_name.toUpperCase(),
        description: postContent,
        images: [
          {
            originalQualityImageUrl: uploadResponse.secure_url,
            optimizedImageUrl: optimizedImageUrl.href,
          },
        ],
      });
    } else if (postVideo) {
      const uploadResponse = await cloudinary.uploader.upload(postVideo, {
        resource_type: "video",
        upload_preset: "posts_videos",
      });
      post = await models.posts.create({
        post_type: "quoted",
        user_id: senderId,
        source_id: quotedPost[0].post_id,
        quoted_post: {
          post_id: quotedPost[0].post_id,
          user_id: quotedPost[0].user_id,
          user_picture: quotedPostUserPicture,
          user_name: quotedPost[0].user_name,
          description: quotedPost[0].description,
          images: quotedPost[0].images,
          videos: quotedPost[0].videos,
          created_at: quotedPost[0].created_at,
        },
        user_name: user[0].first_name + " " + user[0].last_name.toUpperCase(),
        description: postContent,
        videos: uploadResponse.secure_url,
      });
    } else {
      post = await models.posts.create({
        post_type: "quoted",
        user_id: senderId,
        source_id: quotedPost[0].post_id,
        quoted_post: {
          post_id: quotedPost[0].post_id,
          user_id: quotedPost[0].user_id,
          user_name: quotedPost[0].user_name,
          user_picture: quotedPostUserPicture,
          description: quotedPost[0].description,
          images: quotedPost[0].images,
          videos: quotedPost[0].videos,
          created_at: quotedPost[0].created_at,
        },
        user_name: user[0].first_name + " " + user[0].last_name.toUpperCase(),
        description: postContent,
      });
    }
    post.dataValues.user_name = user[0].first_name + " " + user[0].last_name;
    post.dataValues.username = user[0].username;
    post.dataValues.user_picture = user[0].profile_picture;

    return res.status(200).send({
      message: "post uploaded successfully",
      post,
    });
  })
);
router.get(
  "/:pageNumber",
  asyncHandler(async (req, res) => {
    const { pageNumber } = req.params;
    // fetch posts where post_type is not shared
    let posts = await models.posts.findAll({
      limit: 10,
      offset: (pageNumber - 1) * 10,
      order: [["created_at", "DESC"]],
      where: {
        post_type: ["created", "quoted"],
      },
    });
    // number of comments in each post
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
    if (user !== undefined && user !== null) {
      for (let index = 0; index < posts.length; index++) {
        const post = posts[index];
        const sharedPost = await models.posts.findAll({
          where: {
            post_type: "shared",
            source_id: post.post_id,
            user_id: user.id,
          },
        });
        post.dataValues.isShared = sharedPost.length > 0 ? true : false;
        post.dataValues.isLiked = post.reactions.includes(user.id)
          ? true
          : false;
      }
      posts = posts.filter((post) => post.user_id !== user.id);
    }
    for (let index = 0; index < posts.length; index++) {
      const post = posts[index];
      if (post.post_type === "quoted") {
        const quotedPostUser = await models.users.findAll({
          where: {
            user_id: post.quoted_post.user_id,
          },
        });
        post.dataValues.quoted_post = {
          ...post.quoted_post,
          user_picture: quotedPostUser[0].profile_picture,
        };
        
      }
      const commentsNumber = await models.comments.count({
        where: {
          post_id: post.post_id,
        },
      });
      post.dataValues.commentsNumber = commentsNumber;
      const user = await models.users.findAll({
        where: {
          user_id: post.user_id,
        },
      });
      // count number of shares for each post
      const sharesNumber = await models.posts.count({
        where: {
          source_id: post.post_id,
        },
      });
      post.dataValues.username = user[0].username;
      post.dataValues.user_picture = user[0].profile_picture;
      post.dataValues.likesNumber = post.reactions.length;
      post.dataValues.sharesNumber = sharesNumber;
    }
    return res.status(200).send({
      message: "posts fetched successfully",
      posts,
    });
  })
);
router.get(
  "/:username/:pageNumber",
  asyncHandler(async (req, res) => {
    const { pageNumber, username } = req.params;
    console.log("pageNumber", pageNumber);
    if (!username) {
      return res.status(400).send({
        message: "username is required",
      });
    }
    console.log(username);
    const user = await models.users.findAll({
      where: {
        username: username,
      },
      attributes: [
        "user_id",
        "username",
        "first_name",
        "last_name",
        "profile_picture",
      ],
    });
    if (user.length === 0) {
      return res.status(400).send({
        message: "user not found",
      });
    }
    // fetch posts where post_type is not shared
    const posts = await models.posts.findAll({
      limit: 10,
      offset: (pageNumber - 1) * 10,
      order: [["created_at", "DESC"]],
      where: {
        user_id: user[0].user_id,
      },
    });
    if (posts.length === 0) {
      return res.status(200).send({
        message: "no posts found",
        posts,
      });
    }
    // number of comments in each post
    for (let index = 0; index < posts.length; index++) {
      const post = posts[index];
      const commentsNumber = await models.comments.count({
        where: {
          post_id: post.post_id,
        },
      });
      posts[index].dataValues.commentsNumber = commentsNumber;
      const sharedPost = await models.posts.findAll({
        where: {
          post_type: "shared",
          source_id: post.post_id,
          user_id: user[0].user_id,
        },
      });
      const sharesNumber = await models.posts.count({
        where: {
          source_id: post.post_id,
        },
      });

      post.dataValues.likesNumber = post.reactions.length;
      post.dataValues.sharesNumber = sharesNumber;
      post.dataValues.isShared = sharedPost.length > 0 ? true : false;
      post.dataValues.isLiked = post.reactions.includes(user[0].user_id)
        ? true
        : false;
      post.dataValues.username = user[0].username;
       post.dataValues.user_picture = user[0].profile_picture;
    }
    
    return res.status(200).send({
      message: "posts fetched successfully",
      posts,
    });
  })
);
router.post(
  "/react",
  [verifyUserToken],
  asyncHandler(async (req, res) => {
    senderId = req.user.id;
    const { postId, postIsLiked } = req.body;
    const post = await models.posts.findAll({
      where: {
        post_id: postId,
      },
    });
    if (!post) {
      return res.status(400).send({
        message: "post not found",
      });
    }
    if (postIsLiked) {
      if (post[0].reactions.includes(senderId)) {
        //remove id from reactions
        for (var i = 0; i < post[0].reactions.length; i++) {
          if (post[0].reactions[i] === senderId) {
            const postReaction = await models.posts.update(
              {
                reactions: post[0].reactions.filter(
                  (reaction) => reaction !== senderId
                ),
              },
              {
                where: {
                  post_id: postId,
                },
              }
            );
            break;
          }
        }
      }
    } else {
      if (!post[0].reactions.includes(senderId)) {
        const postReaction = await models.posts.update(
          {
            reactions: post[0].reactions.concat(senderId),
          },
          {
            where: {
              post_id: postId,
            },
          }
        );
      }
    }
    return res.status(200).send({
      message: "post uploaded successfully",
      post,
    });
  })
);

module.exports = router;
