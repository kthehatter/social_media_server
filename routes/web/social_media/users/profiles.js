const express = require("express");
const router = express.Router();
const asyncHandler = require("../../../../middleware/asyncHandler");
const verifyUserToken = require("../../../../middleware/verifyUserToken");
const { cloudinary } = require("../../../../utilities/cloudinarySetup");
const uploadVerify = require("../../../../middleware/uploadVerify");
const models = require("../../../../models");
router.get(
  "/details/:username",
  asyncHandler(async (req, res) => {
    const { username } = req.params;
    if (!username) {
      return res.status(400).send({
        message: "username is required",
      });
    }
    const user = await models.users.findAll({
      where: {
        username: username,
      },
      attributes: [
        "user_id",
        "first_name",
        "last_name",
        "profile_picture",
        "created_at",
      ],
    });

    if (user?.length === 0) {
      return res.status(404).send({
        message: "user not found",
      });
    }
    let profile = await models.profiles.findAll({
      where: {
        user_id: user[0].user_id,
      },
      attributes: [
        "profile_cover",
        "profile_bio",
        "profile_website",
        "profile_location",
        "profile_birthday",
      ],
    });
    const postsNumber = await models.posts.count({
      where: {
        user_id: user[0].user_id,
      },
    });
    profile[0].dataValues.first_name = user[0].first_name;
    profile[0].dataValues.username = username;
    profile[0].dataValues.last_name = user[0].last_name;
    profile[0].dataValues.profile_picture = user[0].profile_picture;
    profile[0].dataValues.created_at = user[0].created_at;
    profile[0].dataValues.postsNumber = postsNumber;
    return res.status(200).send({
      message: "user details fetched successfully",
      profile: profile[0],
    });
  })
);
router.post(
  "/details/update",
  verifyUserToken,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const user = await models.users.findAll({
      where: {
        user_id: userId,
      },
      attributes: [
        "user_id",
        "first_name",
        "last_name",
        "profile_picture",
        "created_at",
      ],
    });
    const {
      firstName,
      lastName,
      bio,
      website,
      location,
      birthdate,
      changed_profile_picture,
      changed_profile_cover,
    } = req.body;
    let new_cover_image;
    let new_profile_image;
    if (changed_profile_cover) {
      const new_cover_image = await cloudinary.uploader.upload(
        changed_profile_cover,
        {
          upload_preset: "users_images",
        }
      );
      const updateProfilePicture = await models.profiles.update(
        {
          profile_cover: new_cover_image.secure_url,
        },
        {
          where: {
            user_id: userId,
          },
        }
      );
    }
    if (changed_profile_picture) {
        const new_profile_image = await cloudinary.uploader.upload(
            changed_profile_picture,
            {
              upload_preset: "users_images",
            }
          );
          const updateProfilePicture = await models.users.update(
            {
                profile_picture: new_profile_image.secure_url,
            },
            {
              where: {
                user_id: userId,
              },
            }
          );
    }
    const updateUser = await models.users.update(
        {
            first_name: firstName,
            last_name: lastName,
        },
        {
            where: {
                user_id: userId,
            },
        }
    );
    const updateProfile = await models.profiles.update(
        {
            profile_bio: bio,
            profile_website: website,
            profile_location: location,
            profile_birthday: birthdate,
        },
        {
            where: {
                user_id: userId,
            },
        }
    );
    return res.status(200).send({
        message: "user details updated successfully",
        profile_picture: new_profile_image?.secure_url,
        profile_cover: new_cover_image?.secure_url,
    });
  })
);
module.exports = router;
