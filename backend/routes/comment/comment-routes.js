// backend/routes/comment/comment-routes.js

import express from "express";
import { authTokenMiddleware } from "../../middleware/auth/authTokenMiddleware.js";
import { createCommentLimiter } from "../../middleware/security/index.js";
import { postIdValidationRules } from "../../validators/index.js";
import { createCommentValidationRules } from "../../validators/index.js";
import { handleValidationErrors } from "../../middleware/validation/index.js";
import { handleCreateComment } from "../../controllers/comment/create-comment.controller.js";

const router = express.Router({ mergeParams: true });

// POST /api/v1/posts/:postId/comments
router.post(
  "/:postId/comments",
  createCommentLimiter,
  authTokenMiddleware,
  postIdValidationRules,
  createCommentValidationRules,
  handleValidationErrors,
  handleCreateComment
);

export default router;
