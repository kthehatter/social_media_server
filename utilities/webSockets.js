const models = require("../models");
const { getOnlineUsers, verifyToken } = require("../middleware/socketsHandler");
const tokenValidator = require("./validateToken");

let users = [];
const addUsers = async (accessToken, socketID) => {
  try {
    const userId = tokenValidator(accessToken);
    if (!userId) {
      return;
    }
    const user_status = await models.users_statuses.update(
      {
        status: "online",
        socket_id: socketID,
      },
      {
        where: {
          user_id: userId.id,
        },
      }
    );
    const peopleFollwing = await models.followers.findAll({
      where: {
        user_id: userId.id,
      },
    });
    const onlineUsers = await models.users_statuses.findAll({
      where: {
        status: "online",
        user_id: {
          [models.Sequelize.Op.in]: peopleFollwing.map(
            (person) => person.follower_id
          ),
        },
      },
    });
    for (let index = 0; index < onlineUsers.length; index++) {
      let onlineUser = onlineUsers[index];
      const userInfo = await models.users.findAll({
        attributes: ["first_name", "last_name", "username", "profile_picture"],
        where: {
          user_id: onlineUser.user_id,
        },
      });
      onlineUser.dataValues.userInfo = userInfo[0];
    }
    return onlineUsers;
  } catch (err) {
    console.log(err);
    return null;
  }
};
const fetchReciever = async (id, type) => {
  try {
    switch (type) {
      case "user":
        const user = await models.users_statuses.findAll({
          where: {
            user_id: id,
          },
          attributes: ["user_id", "socket_id", "status"],
        });
        return user[0];
      case "username":
        const userInfo = await models.users_statuses.findAll({
          where: {
            username: id,
          },
          attributes: ["user_id", "socket_id", "status"],
        });
        return userInfo[0];
      case "post comment":
        const post = await models.posts.findAll({
          where: {
            post_id: id,
          },
        });
        const post_user = await models.users_statuses.findAll({
          where: {
            user_id: post[0].user_id,
          },
        });
        return post_user[0];
      default:
        return null;
    }
  } catch (err) {
    console.log(err);
  }
};
const fetchNotificationInfo = async (sentNotificationInfo) => {
  try {
    switch (sentNotificationInfo.type) {
      case "post comment" || "post like" || "post share" || "post quote":
        const postDetails = await models.posts.findAll({
          where: {
            post_id: sentNotificationInfo.post_id,
          },
        });
        const postDescription =
          postDetails[0].description.length > 20
            ? postDetails[0].description.substring(0, 20) + "..."
            : postDetails[0].description;
        const notificationDetails = {
          sentNotificationInfo,
          postDescription,
        };
        return notificationDetails;
      default:
        return null;
    }
  } catch (err) {
    console.log(err);
    return null;
  }
};
const removeUsers = async (socketID) => {
  try {
    const user_status = await models.users_statuses.update(
      {
        status: "offline",
        socket_id: null,
      },
      {
        where: {
          socket_id: socketID,
        },
      }
    );
  } catch (error) {}
};

const fetchMessage = async (messageId, senderId) => {
  try {
    const conversations = await models.conversations.findAll({
      where: {
        members: {
          [models.Sequelize.Op.contains]: [senderId],
        },
      },
    });
    if (conversations.length < 1) {
      return null;
    }
    const conversationsMessages = await models.messages.findAll({
      where: {
        message_id: messageId,
      },
    });
    return conversationsMessages[0];
  } catch (err) {
    console.log(err);
    return null;
  }
};

exports.webSockets = function (io) {
  io.on("connection", (socket) => {
    socket.on("addUser", async (data) => {
      console.log("addUser");
      const onlineUsers = await addUsers(data.accessToken, socket.id);
      if (onlineUsers) {
        io.to(socket.id).emit("getUsers", onlineUsers);
      }
    });
    socket.on("sendNotification", async (data) => {
      const reciever = await fetchReciever(
        data.reciever_id_finder,
        data.notificationInfo.type
      );
      if (reciever && reciever.status === "online") {
        const notificationInfo = await fetchNotificationInfo(
          data.notificationInfo
        );
        console.log(notificationInfo);
        io.to(reciever.socket_id).emit(
          "notificationRecieved",
          notificationInfo
        );
        console.log("notification sent");
      }
    });

    socket.on(
      "sendMessage",
      async ({ accessToken, recieverID, conversationId, messageId }) => {
        try {
          const reciever = await fetchReciever(recieverID, "user");
          const messageSender = await verifyToken(accessToken);
          if (
            reciever &&
            reciever.socket_id &&
            messageSender &&
            messageSender.userID &&
            messageSender.true === true
          ) {
            const senderID = messageSender.userID;
            const message = await fetchMessage(messageId, senderID);
            const conversation_id = conversationId;
            io.to(reciever.socket_id).emit("recieveMessage", {
              conversation_id,
              message,
            });
          }
        } catch (err) {
          console.log(err);
        }
      }
    );
    socket.on("callUser", async (data) => {
      const receiver = await fetchReciever(data.recieverId , "user");
      if (receiver && receiver.socket_id) {
        io.to(receiver.socket_id).emit("callReceiving",data);
        console.log("call recieved");
      }
    }),
    socket.on("answerCall", async (data) => {
      const caller = await fetchReciever(data.to.callerId, "user");
      if (caller && caller.socket_id) {
        io.to(caller.socket_id).emit("callAccepted",data.signal);
        console.log("call accepted");
      }
    }),
    socket.on("disconnect", async () => {
      console.log("user disconnected");
      await removeUsers(socket.id);
    });
  });
};
