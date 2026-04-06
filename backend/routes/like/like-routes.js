// backend/routes/like/like-routes.js

import express from "express";
import { authTokenMiddleware } from "../../middleware/auth/authTokenMiddleware.js";
import { toggleLikeLimiter, repostLimiter } from "../../middleware/security/index.js";
import { postIdValidationRules, repostCommentValidationRules } from "../../validators/index.js";
import { handleValidationErrors } from "../../middleware/validation/index.js";
import { handleToggleLike } from "../../controllers/like/toggle-like.controller.js";
import { handleCreateRepost } from "../../controllers/post/create-repost.controller.js";

const router = express.Router({ mergeParams: true });

// POST /api/v1/posts/:postId/like
router.post(
  "/:postId/like",
  toggleLikeLimiter,
  authTokenMiddleware,
  postIdValidationRules,
  handleValidationErrors,
  handleToggleLike
);

// POST /api/v1/posts/:postId/repost
router.post(
  "/:postId/repost",
  repostLimiter,
  authTokenMiddleware,
  postIdValidationRules,
  repostCommentValidationRules,
  handleValidationErrors,
  handleCreateRepost
);

export default router;
