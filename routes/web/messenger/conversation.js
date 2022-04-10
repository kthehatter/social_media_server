const express = require("express");
const router = express.Router();
const asyncHandler = require("../../../middleware/asyncHandler");
const models = require("../../../models");
const Sequelize = require("sequelize");
const verifyUserToken = require("../../../middleware/verifyUserToken");
const Op = Sequelize.Op;
router.post(
  "/addmessage",
  [verifyUserToken],
  asyncHandler(async (req, res) => {
    console.log(req.body);
    const { conversationID, message,messageType } = req.body;
    console.log(conversationID);
    const senderID = req.user.id;
    sender_user = await models.users.findAll({
      where: {
        user_id: senderID,
      },
    });
    if (sender_user.length < 1) {
      return res.status(401).send({
        message:
          "you are not loggedin please try again after login with your account",
      });
    }
    const conversation = await models.conversations.findAll({
      where: {
        conversation_id: conversationID,
      },
    });
    if (conversation.length < 1) {
      return res.status(404).send({
        message: "no such conversation found",
      });
    }
    if (!conversation[0].members.includes(senderID)) {
      return res.status(401).send({
        message: "you are not allowed to send message to this conversation",
      });
    }
    const newMessages = await models.messages.create({
      conversation_id: conversationID,
      sender_id: senderID,
      message: message,
      message_type: messageType,
    });
   
    const update_user = await models.users.update(
      {
        updated_at: new Date(),
      },
      {
        where: {
          user_id: senderID,
        },
      }
    );
    return res.status(200).send({
      message: "message sent successfully",
      messages: newMessages,
    });
  })
);
router.get(
  "/messages/:conversationID/:pageNumber",
  [verifyUserToken],
  asyncHandler(async (req, res) => {
    const senderID = req.user.id;
    const { conversationID, pageNumber } = req.params;
    const conversations = await models.conversations.findAll({
      where: {
        members: {
          [Op.contains]: [senderID],
        },
      },
    });
    if (conversations.length < 1) {
      return res.status(404).send({
        message: "no conversations found",
      });}
    const conversationMessage = await models.messages.findAll({
      limit: 50,
      offset: (pageNumber - 1) * 10,
      where: {
        conversation_id: conversationID.toString(),
      },
      order: [["created_at", "ASC"]],
    });
    if (conversationMessage.length < 1) {
      return res.status(200).send({
        message: "no messages found",
        messages: [],
      });
    }
    const updatedMessages = await models.messages.update({
      read_status: true,
    }, {
      where: {
        conversation_id: conversationID.toString(),
        sender_id: {
          [Op.ne]: senderID,
        },
      },
    })
    return res.status(200).send({
      message: "messages found",
      conversationMessage: conversationMessage,
      conversationLength: conversationMessage.length,
    });
  })
);
router.post(
  "/:recieverID",
  [verifyUserToken],
  asyncHandler(async (req, res) => {
    const { recieverID } = req.params;
    const userId = req.user.id;
    sender_user = await models.users.findAll({
      where: {
        user_id: req.user.id,
      },
    });
    if (sender_user.length < 1) {
      return res.status(401).send({
        message:
          "you are not loggedin please try again after login with your account",
      });
    }
    reciever_user = await models.users.findAll({
      where: {
        user_id: recieverID,
      },
    });
    if (reciever_user.length < 1) {
      return res.status(404).send({
        message: "no such user was found",
      });
    }
    const senderName = sender_user[0].first_name + " " + sender_user[0].last_name.toUpperCase();
    const recieverName = reciever_user[0].first_name + " " + reciever_user[0].last_name.toUpperCase();
    let existingConversation = await models.conversations.findAll({
      where: {
        members:[userId,recieverID],
      },
    });
    if (existingConversation.length>0) {
      return res.status(200).send({
        message: "conversation already exists",
        conversation: existingConversation[0],
      });
    }
      existingConversation = await models.conversations.findAll({
        where: {
          members:[recieverID,userId],
        },
      });
    
    let newConversation = await models.conversations.create({
      members: [req.user.id, recieverID],
      members_name:[senderName,recieverName],
    });
    newConversation.dataValues.latest_message_date = new Date();
    newConversation.dataValues.last_time_connected = [new Date(),new Date()];
    return res.status(200).send({
      message: "conversation created successfully",
      conversation: newConversation,
    });
  })
);

router.get(
  "/:offset/:selectedConversationId",
  [verifyUserToken],
  asyncHandler(async (req, res) => {
    const { offset,selectedConversationId } = req.params;
    const senderID = req.user.id;
    console.log('senderID',senderID);
    const sender_user = await models.users.findAll({
      where: {
        user_id: senderID,
      },
    });
    if (sender_user.length < 1) {
      return res.status(401).send({
        message:
          "you are not loggedin please try again after login with your account",
      });
    }
    // get conversations of sender user where senderID is in array of members
    const conversations = await models.conversations.findAll({
      limit: 10,
      offset: (offset - 1) * 10,
      where: {
        members: {
          [Op.contains]: [senderID],
        },
      },
      order: [["updated_at", "DESC"]],
    });
    if (conversations.length < 1) {
      return res.status(200).send({
        message: "no conversations found",
        conversations: [],
      });
    }
    let conversationsList=[];
    for (let index = 0; index < conversations.length; index++) {
      const conversation = conversations[index];
      const messagesUnread = await models.messages.count({
        where: {
          conversation_id: conversation.conversation_id.toString(),
          read_status: false,
          sender_id: {
            [Op.ne]: senderID,
          },
        },
      });
      const latestMessage = await models.messages.findAll({
        where: {
          conversation_id: conversation.conversation_id.toString(),
        },
        order: [["created_at", "DESC"]],
      });

      const reciever_user = await models.users.findAll({
        where: {
          user_id: conversation.members[0]!==senderID?conversation.members[0]:conversation.members[1],
        },
      });
      conversation.dataValues.unread_messages = messagesUnread>99?99:messagesUnread;
      conversation.dataValues.latest_message = latestMessage.length>0? latestMessage[0].message:'';
      conversation.dataValues.latest_message_date = latestMessage.length>0?latestMessage[0].created_at:'';
      conversation.dataValues.last_time_connected = [sender_user[0].updated_at,reciever_user[0].updated_at];
      conversation.dataValues.other_member_image = reciever_user[0].profile_picture;
      if (selectedConversationId) {
        const conversationMessage = await models.messages.findAll({
          limit: 50,
          where: {
            conversation_id: selectedConversationId,
          },
          order: [["created_at", "ASC"]],
        });
        if (conversationMessage.length < 1) {
          conversationsList.push({
            conversationDetails: conversation,
            messages:[]
          });
        }else{
          conversationsList.push({
            conversationDetails: conversation,
            messages:conversationMessage
          });
        }
        const updatedMessages = await models.messages.update({
          read_status: true,
        }, {
          where: {
            conversation_id: selectedConversationId.toString(),
            sender_id: {
              [Op.ne]: senderID,
            },
          },
        })
      } else {
        conversationsList.push({
          conversationDetails: conversation,
          messages:[]
        });
      }
      
    }
    return res.status(200).send({
      message: "conversations found",
      conversations: conversationsList,
    });
  })
);


module.exports = router;
