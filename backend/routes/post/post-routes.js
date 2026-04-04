// backend/routes/post/post-routes.js

import express from "express";
import { authTokenMiddleware } from "../../middleware/auth/authTokenMiddleware.js";
import { createPostLimiter, feedLimiter } from "../../middleware/security/rate-limiters.js";
import { createPostValidationRules, feedQueryValidationRules } from "../../validators/index.js";
import { handleValidationErrors } from "../../middleware/validation/index.js";
import { handleCreatePost } from "../../controllers/post/create-post.controller.js";
import { handleGetFeed } from "../../controllers/post/get-feed.controller.js";

const router = express.Router();

// POST /api/v1/posts
router.post(
  "/",
  createPostLimiter,
  authTokenMiddleware,
  createPostValidationRules,
  handleValidationErrors,
  handleCreatePost
);

// GET /api/v1/posts/feed
router.get(
  "/feed",
  feedLimiter,
  authTokenMiddleware,
  feedQueryValidationRules,
  handleValidationErrors,
  handleGetFeed
);

export default router;
