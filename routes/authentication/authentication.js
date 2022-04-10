const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const sharp = require("sharp");
const asyncHandler = require("../../middleware/asyncHandler");
const models = require("../../models");
const jwtGenerator = require("../../utilities/jwtGenerator");
const { check, validationResult } = require("express-validator");
const verifyUserToken = require("../../middleware/verifyUserToken");
const multer = require("multer");
const path = require("path");
const upload = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("Please upload an image"));
    }

    cb(undefined, true);
  },
});
function validateEmail(elementValue){      
  var emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
  return emailPattern.test(elementValue); 
} 
router.post(
  "/user/register",
  [
    check("username", "username must be longer than 3 characters").isLength({
      min: 3,
    }),
    check("firstName", "First Name must be longer than 3 characters").isLength({ min: 3 }),
    check("lastName", "Last Name must be longer than 3 characters").isLength({ min: 3 }),
    check("email", "Email is required").isEmail(),
    check("password", "Password must be longer than 6 characters").isLength({ min: 6 }),
  ],
  asyncHandler(async (req, res) => {
    res.set('Access-Control-Allow-Origin', 'http://localhost:3000');
    const { username, firstName, lastName, email, password } = req.body;
    console.log(req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors.array()[0].msg);
      return res
        .status(400)
        .send({
          status: "400",
          message: errors.array()[0].msg,
          accessToken: "",
        });
    }
    const userEmail = await models.users.findAll({
      where: {
        email: email.toLowerCase(),
      },
    });
    if (userEmail.length > 0) {
      return res
        .status(401)
        .send({
          status: "401",
          message: "Email already exist!",
          accessToken: "",
        });
    }
    console.log('here');
    const userUsername = await models.users.findAll({
      where: {
        username: username.toLowerCase(),
      },
    });
    if (userUsername.length > 0) {
      return res
        .status(401)
        .send({
          status: "401",
          message: "Username already exist!",
          accessToken: "",
        });
    }

    const salt = await bcrypt.genSalt(10);
    const bcryptPassword = await bcrypt.hash(password, salt);

    let newUser = await models.users.create({
      username: username.trim().toLowerCase(),
      first_name: firstName,
      last_name: lastName,
      email: email.trim().toLowerCase(),
      password: bcryptPassword,
      profile_picture: "https://res.cloudinary.com/khalilay/image/upload/v1647365570/Social%20media/g/640px-Unknown_person_h810y8.jpg",
    });
    const user_status = await models.users_statuses.create({
      user_id: newUser.user_id,
    });
    const user_profile = await models.profiles.create({
      user_id: newUser.user_id,
      cover_photo: "https://res.cloudinary.com/khalilay/image/upload/v1648390148/Social%20media/g/default-cover_acz4hs.gif",
    });
    const jwtToken = jwtGenerator(newUser.user_id, "240h");
    return res
      .status(200)
      .send(
        
        { status: "200", message: "Success", user: {
        id: newUser.user_id,
        username: newUser.username,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        email: newUser.email,
      },
      profile_picture: newUser.profile_picture,accessToken: jwtToken });
  })
);
router.post(
  "/user/login",
  [
    check("account", "either Email or Username is required").exists(),
    check("password", "Password is required").exists(),
  ],
  asyncHandler(async (req, res) => {
    const { account, password } = req.body;
    var time_to_logged_in = "504h";
    console.log(validateEmail(account));
    let user;
    if (validateEmail(account)) {
      user= await models.users.findAll({
        where: {
          email: account.trim().toLowerCase(),
        },
      });
    }else{
      user= await models.users.findAll({
        where: {
          username: account.trim().toLowerCase(),
        },
      });
    }
    if (user.length < 1) {
      return res.status(401).send({
        status: "401",
        message: "You provided an invalid email address or password",
        token: "",
      });
    }
    console.log(user[0].user_id);
    const validPassword = await bcrypt.compare(password, user[0].password);
    if (!validPassword) {
      return res.status(401).send({
        status: "401",
        message: "You provided an invalid account information",
        token: "",
      });
    }
    const accessToken = jwtGenerator(user[0].user_id, time_to_logged_in);
    return res.status(200).send({
      status: "200",
      message: "Success",
      accessToken: accessToken,
      user: {
        id: user[0].user_id,
        username: user[0].username,
        firstName: user[0].first_name,
        lastName: user[0].last_name,
        email: user[0].email,
      },
      profile_picture: user[0].profile_picture,
    });
  })
);
router.post(
  "/user/verify",
  [verifyUserToken],
  asyncHandler(async (req, res) => {
    const user_id = req.user.id;
    const user = await models.users.findAll({
      where: {
        user_id: user_id,
      },
    });
    return res.status(200).json({
      status: "200",
      message: " Success",
      user: {
        user_id: user_id,
        username: user[0].username,
        firstName: user[0].first_name,
        lastName: user[0].last_name,
      },
      profile_picture: user[0].profile_picture,
    });
  })
);
router.post(
  "/user/profile/uploadpicture",
  [verifyUserToken, upload.single("avatar")],
  asyncHandler(async (req, res) => {
    userProfileImage = await sharp(req.file.buffer)
      .resize({ width: 250, height: 250 })
      .jpeg()
      .toBuffer();

    let user = await models.users.update(
      {
        profile_picture: userProfileImage,
      },
      {
        where: {
          user_id: req.user.id,
        },
      }
    );

    return res.status(200).json({ status: "200", message: " Success" });
  }),
  (error, req, res, next) => {
    res.status(400).send({ status: "400", message: error.message });
  }
);
router.get(
  "/users/:id/avatar",
  asyncHandler(async (req, res) => {
    console.log(req.params.id);
    const user = await models.users.findAll({
      where: {
        user_id: req.params.id,
      },
    });
    if (
      user.length < 1 ||
      !user[0].profile_picture ||
      user[0].profile_picture == ""
    ) {
      return res.sendFile(path.join(__dirname, "./uploads/user_icon.png"));
    }
    res.set("Content-Type", "image/png");
    res.send(user[0].profile_picture);
  })
);
router.get(
  "/user/list",
  [verifyUserToken],
  asyncHandler(async (req, res) => {
    const users = await models.users.findAll({
      attributes: ["user_id", "first_name", "last_name", "email"],
    });
    return res
      .status(200)
      .json({ status: "200", message: " Success", users: users });
  })
);

module.exports = router;
