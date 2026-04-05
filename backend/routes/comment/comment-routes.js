// backend/routes/comment/comment-routes.js

import express from "express";
import { authTokenMiddleware } from "../../middleware/auth/authTokenMiddleware.js";
import {
  createCommentLimiter,
  getCommentsLimiter,
} from "../../middleware/security/index.js";
import {
  postIdValidationRules,
  createCommentValidationRules,
  feedQueryValidationRules,
} from "../../validators/index.js";
import { handleValidationErrors } from "../../middleware/validation/index.js";
import { handleCreateComment } from "../../controllers/comment/create-comment.controller.js";
import { handleGetComments } from "../../controllers/comment/get-comments.controller.js";

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

// GET /api/v1/posts/:postId/comments
router.get(
  "/:postId/comments",
  getCommentsLimiter,
  authTokenMiddleware,
  postIdValidationRules,
  feedQueryValidationRules,
  handleValidationErrors,
  handleGetComments
);

export default router;
