// backend/routes/friendship/friendship-routes.js

import express from "express";
import { authTokenMiddleware } from "../../middleware/auth/authTokenMiddleware.js";
import { friendRequestLimiter } from "../../middleware/security/rate-limiters.js";
import { sendFriendRequestValidationRules } from "../../validators/index.js";
import { handleValidationErrors } from "../../middleware/validation/index.js";
import { handleSendFriendRequest } from "../../controllers/friendship/send-friend-request.controller.js";

const router = express.Router();

// POST /api/v1/friends/requests — Send a friend request
router.post(
  "/requests",
  friendRequestLimiter,
  authTokenMiddleware,
  sendFriendRequestValidationRules,
  handleValidationErrors,
  handleSendFriendRequest
);

export default router;
