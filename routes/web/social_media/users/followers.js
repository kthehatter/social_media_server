const express = require("express");
const router = express.Router();
const asyncHandler = require("../../../../middleware/asyncHandler");
const models = require("../../../../models");
const Sequelize = require("sequelize");
const verifyUserToken = require("../../../../middleware/verifyUserToken");
const Op = Sequelize.Op;
router.post(
  "/follow/:username",
  [verifyUserToken],
  asyncHandler(async (req, res) => {
    const { username } = req.params;
    const senderUser = await models.users.findAll({
      where: {
        user_id: req.user.id,
      },
    });
    if (senderUser.length < 1) {
      return res.status(401).send({
        message:
          "you are not loggedin please try again after login with your account",
      });
    }
    const recieverUser = await models.users.findAll({
      where: {
        username: username,
      },
    });
    if (recieverUser.length < 1) {
      return res.status(404).send({
        message: "no such user was found",
      });
    }
    const isAlreadyFollowed = await models.followers.findOne({
      where: {
        user_id: recieverUser[0].user_id,
        follower_id: req.user.id,
      },
    });
    if (isAlreadyFollowed) {
      return res.status(400).send({
        message: "You are already following this user",
      });
    }
    const isFollowBack = await models.followers.findAll({
      where: {
        user_id: req.user.id,
        follower_id: recieverUser[0].user_id,
      },
    });
    if (isFollowBack.length > 0) {
      const senderName =
        senderUser[0].first_name + " " + senderUser[0].last_name.toUpperCase();
      const recieverName =
        recieverUser[0].first_name +
        " " +
        recieverUser[0].last_name.toUpperCase();
      let existingConversation = await models.conversations.findAll({
        where: {
          members: [senderUser[0].user_id, recieverUser[0].user_id],
        },
      });
      if (existingConversation.length > 0) {
        return res.status(200).send({
          message: "conversation already exists",
          conversation: existingConversation[0],
        });
      }
      existingConversation = await models.conversations.findAll({
        where: {
          members: [recieverUser[0].user_id, senderUser[0].user_id],
        },
      });
      if (existingConversation.length > 0) {
        return res.status(200).send({
          message: "conversation already exists",
          conversation: existingConversation[0],
        });
      }
      const newConversation = await models.conversations.create({
        members: [senderUser[0].user_id, recieverUser[0].user_id],
        members_name: [senderName, recieverName],
      });
      newConversation.dataValues.latest_message_date = new Date();
      newConversation.dataValues.last_time_connected = [new Date(), new Date()];
    }
    const following = await models.followers.create({
      user_id: recieverUser[0].user_id,
      follower_id: req.user.id,
    });
    const notification = await models.notifications.create({
        sender_id: req.user.id,
        sender_username: senderUser[0].username,
        sender_picture: senderUser[0].profile_picture,
        reciever_id: recieverUser[0].user_id,
        reciever_username: recieverUser[0].username,
        notification_type: "follow",
        content: "started following you",
        url: "/u/" + senderUser[0].username,
        });
    return res.status(200).send({
      message: "following user successfully",
      following,
    });
  })
);
router.post(
    "/unfollow/:username",
    [verifyUserToken],
    asyncHandler(async (req, res) => {
      const { username } = req.params;
      const senderUser = await models.users.findAll({
        where: {
          user_id: req.user.id,
        },
      });
      if (senderUser.length < 1) {
        return res.status(401).send({
          message:
            "you are not loggedin please try again after login with your account",
        });
      }
      const userToUnFollow = await models.users.findAll({
        where: {
            username: username,
        },
        });
        if (userToUnFollow.length < 1) {
            return res.status(404).send({
                message: "no such user was found",
            });
        }
        await models.followers.destroy({
            where: {
                user_id: userToUnFollow[0].user_id,
                follower_id: req.user.id,
            },
        });
  
        
      return res.status(200).send({
        message: "unfollowing user successfull",
      });
    })
  );
router.get(
  "/tofollow/:offset",
  [verifyUserToken],
  asyncHandler(async (req, res) => {
    const { user_id } = req.user;
    const { offset } = req.params;

    const users = await models.users.findAll({
      limit: 10,
      offset: (offset - 1) * 10,
      order: [["created_at", "DESC"]],
      where: {
        user_id: {
          [Op.notIn]: [user_id],
        },
      },
    });
    return res.status(200).send({
      message: "users to follow",
      users,
    });
  })
);

router.get(
    "/recommended/tofollow/",
    [verifyUserToken],
    asyncHandler(async (req, res) => {
      const user_id = req.user.id;
      //TODO: get recommended users that aren't already followed 
      let followedPeople = await models.followers.findAll({
        where: {
            follower_id: user_id,
        },
        attributes: ['user_id'],
        });
        let peopleToExclude = [];
      if (followedPeople.length<1) {
        peopleToExclude =[user_id];
      }else{
        followedPeople.forEach(person => {
          peopleToExclude.push(person.user_id);
        });
        peopleToExclude.push(user_id);
      }
      let users = await models.users.findAll({
        where: {
            user_id: {
                [Op.notIn]: peopleToExclude,
            },
        },
            order: [["created_at", "DESC"]],
            attributes: ['user_id', 'username', 'first_name', 'last_name', 'profile_picture'],
        });
      users.filter(users => users.user_id !== user_id);
        return res.status(200).send({
            message: "users to follow",
            peopleToFollow:users,
        });

      
     
    })
  );

module.exports = router;
