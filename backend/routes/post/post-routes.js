// backend/routes/post/post-routes.js

import express from "express";
import { authTokenMiddleware } from "../../middleware/auth/authTokenMiddleware.js";
import { createPostLimiter } from "../../middleware/security/rate-limiters.js";
import { createPostValidationRules } from "../../validators/index.js";
import { handleValidationErrors } from "../../middleware/validation/index.js";
import { handleCreatePost } from "../../controllers/post/create-post.controller.js";

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

export default router;
