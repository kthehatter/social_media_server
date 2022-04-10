const express = require("express");
const cors = require("cors");
const http = require("http");
const app = express();
const logger = require("./logger/index");
const database = require("./models");
const { Server } = require("socket.io");
const bodyParser = require("body-parser");
require("dotenv").config();
const {webSockets} = require("./utilities/webSockets");
const server = http.createServer(app);
// creating socket io instance
const io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV ==="development"? "*": process.env.FRONTEND_URL,
      methods: ["GET", "POST"],
    },
  });
app.use(cors());
app.use(bodyParser.json({limit: '10mb'}));
//bodyParser limit
app.use("/api/web/messenger/conversations", require("./routes/web/messenger/conversation"));
app.use("/api/authentication", require("./routes/authentication/authentication"));
app.use("/api/web/socialmedia/posts", require("./routes/web/social_media/posts/posts"));
app.use("/api/web/socialmedia/comments", require("./routes/web/social_media/posts/comments"));
app.use("/api/web/socialmedia/notifications", require("./routes/web/social_media/users/notifications"));
app.use("/api/web/socialmedia/profiles", require("./routes/web/social_media/users/profiles"));
app.use("/api/web/socialmedia/follow", require("./routes/web/social_media/users/followers"));
const PORT = process.env.SERVER_PORT || 3306;
process.on('uncaughtException',(ex)=>{
    logger.error(ex.message, ex);
    process.exit(1);
});
process.on('unhandledRejection',(ex)=>{
    logger.error(ex.message, ex);
    process.exit(1);
});

/** Create socket connection */
webSockets(io);


database.sequelize.sync().then(() => {
    server.listen(PORT, () => {
        logger.info(`Server is running`);
    });
}).catch(err => {
    logger.error(err.message, err);
});