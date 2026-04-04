// backend/routes/friendship/friendship-routes.js

import express from "express";
import { authTokenMiddleware } from "../../middleware/auth/authTokenMiddleware.js";
import {
  friendRequestLimiter,
  friendListLimiter,
  friendRequestDecisionLimiter,
} from "../../middleware/security/rate-limiters.js";
import {
  sendFriendRequestValidationRules,
  friendshipIdValidationRules,
} from "../../validators/index.js";
import { handleValidationErrors } from "../../middleware/validation/index.js";
import { handleSendFriendRequest } from "../../controllers/friendship/send-friend-request.controller.js";
import { handleGetIncomingFriendRequests } from "../../controllers/friendship/get-incoming-friend-requests.controller.js";
import { handleGetOutgoingFriendRequests } from "../../controllers/friendship/get-outgoing-friend-requests.controller.js";
import { handleGetFriends } from "../../controllers/friendship/get-friends.controller.js";
import { handleAcceptFriendRequest } from "../../controllers/friendship/accept-friend-request.controller.js";

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

// GET /api/v1/friends/requests/incoming — List incoming pending requests
router.get(
  "/requests/incoming",
  friendListLimiter,
  authTokenMiddleware,
  handleGetIncomingFriendRequests
);

// GET /api/v1/friends/requests/outgoing — List outgoing pending requests
router.get(
  "/requests/outgoing",
  friendListLimiter,
  authTokenMiddleware,
  handleGetOutgoingFriendRequests
);

// GET /api/v1/friends — List accepted friends
router.get(
  "/",
  friendListLimiter,
  authTokenMiddleware,
  handleGetFriends
);

// PATCH /api/v1/friends/requests/:friendshipId/accept — Accept a friend request
router.patch(
  "/requests/:friendshipId/accept",
  friendRequestDecisionLimiter,
  authTokenMiddleware,
  friendshipIdValidationRules,
  handleValidationErrors,
  handleAcceptFriendRequest
);

export default router;
