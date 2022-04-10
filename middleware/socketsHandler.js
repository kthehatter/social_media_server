const jwt = require("jsonwebtoken");
const models = require("../models");
const Sequelize = require("sequelize");
const logger = require("../logger/index");
const Op = Sequelize.Op;
require("dotenv").config();
const JWTSECRET = process.env.JWTSECRET;

exports.getOnlineUsers =async(acessToken,users)=>{
    let onlineUsers = [];
    try{
        if (!acessToken) {
            console.log("no token");
            return [];
        }
     const verify = jwt.verify(acessToken, JWTSECRET);
        const userID = verify.user.id;
        const conversations = await models.conversations.findAll({
            members: {
                [Op.contains]: [userID],
              },
        });
        if (conversations.length < 1) {
            return [];
        }
        for (let index = 0; index < conversations.length; index++) {
            const conversation = conversations[index];
            for (let index = 0; index < users.length; index++) {
                const user = users[index];
                const userID = user.userID;
                const socketID = user.socketID;
                if (conversation.members.indexOf(user.userID) !== -1&&!onlineUsers.some((onlineUser=>onlineUser.userID === user.userID)) ) {
                onlineUsers.push({userID,socketID});
                break;
                }
            }
        }
         onlineUsers = onlineUsers.filter((onlineUser=>onlineUser.userID!==userID));
         return onlineUsers;
    }catch(err){
        logger.error(err.message,err);
        return []
    }
}

exports.verifyToken=async(acessToken)=>{
    try{
        if (!acessToken) {
            console.log("no token");
            return {true:false,userID:null};
        }
     const verify = jwt.verify(acessToken, JWTSECRET);
        userID=verify.user.id;
        return {true:true,userID:userID};
    }catch(err){
        logger.error(err.message,err);
        return {true:false,userID:null};
    }
}