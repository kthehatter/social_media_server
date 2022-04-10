const express = require("express");
const router = express.Router();
const asyncHandler = require("../../../../middleware/asyncHandler");
const verifyUserToken = require("../../../../middleware/verifyUserToken");
const models = require("../../../../models");
router.get(
  "/unread/:unreadOffset",
  verifyUserToken,
  asyncHandler(async (req, res) => {
    const { unreadOffset } = req.params;
    let unreadNotifications = await models.notifications.findAll({
        limit: 10,
        offset: (unreadOffset - 1) * 10,
        order: [["created_at", "DESC"]],
        where: {
            reciever_id: req.user.id,
            is_read: false,
          }
      });
    console.log(unreadOffset);
    res.status(200).send({
      message: "unread notifications fetched successfully",
      unreadNotifications,
    });
  })
);
router.get(
  "/all/:allOffset",
  verifyUserToken,
  asyncHandler(async (req, res) => {
    const { allOffset } = req.params;
    const allNotifications = await models.notifications.findAll({
      where: {
        reciever_id: req.user.id,
      },
      order: [["created_at", "DESC"]],
      limit: 10,
      offset: (allOffset - 1) * 10,
    });
    res.status(200).send({
      message: "all notifications fetched successfully",
      allNotifications,
    });
  })
);
router.post(
  "/makeread/:notificationId",
  [verifyUserToken],
  asyncHandler(async (req, res) => {
      const { notificationId } = req.params;
        const notification = await models.notifications.update(
            {
                is_read: true,
            },
            {
                where: {
                    notification_id: notificationId,
                },
            }
        );
        res.status(200).send({
            message: "notification updated successfully",
            notification,
        });

  })
);
router.post(
    "/allread",
    [verifyUserToken],
    asyncHandler(async (req, res) => {
          const notification = await models.notifications.update(
              {
                  is_read: true,
              },
              {
                  where: {
                    reciever_id: req.user.id,
                  },
              }
          );
          res.status(200).send({
              message: "notification updated successfully",
              notification,
          });
  
    })
  );
module.exports = router;
