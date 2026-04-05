// backend/routes/post/post-routes.js

import express from "express";
import { authTokenMiddleware } from "../../middleware/auth/authTokenMiddleware.js";
import { handleGetUserPosts } from "../../controllers/post/get-user-posts.controller.js";
import { createPostLimiter, feedLimiter, getPostLimiter, updatePostLimiter, deletePostLimiter, getUserPostsLimiter } from "../../middleware/security/rate-limiters.js";
import { createPostValidationRules, feedQueryValidationRules, postIdValidationRules, updatePostValidationRules, userIdValidationRules } from "../../validators/index.js";
import { handleValidationErrors } from "../../middleware/validation/index.js";
import { handleCreatePost } from "../../controllers/post/create-post.controller.js";
import { handleGetFeed } from "../../controllers/post/get-feed.controller.js";
import { handleGetPost } from "../../controllers/post/get-post.controller.js";
import { handleUpdatePost } from "../../controllers/post/update-post.controller.js";
import { handleDeletePost } from "../../controllers/post/delete-post.controller.js";

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

// GET /api/v1/posts/user/:userId
router.get(
  "/user/:userId",
  getUserPostsLimiter,
  authTokenMiddleware,
  userIdValidationRules,
  feedQueryValidationRules,
  handleValidationErrors,
  handleGetUserPosts
);

// GET /api/v1/posts/:postId
router.get(
  "/:postId",
  getPostLimiter,
  authTokenMiddleware,
  postIdValidationRules,
  handleValidationErrors,
  handleGetPost
);

// PATCH /api/v1/posts/:postId
router.patch(
  "/:postId",
  updatePostLimiter,
  authTokenMiddleware,
  postIdValidationRules,
  updatePostValidationRules,
  handleValidationErrors,
  handleUpdatePost
);

// DELETE /api/v1/posts/:postId
router.delete(
  "/:postId",
  deletePostLimiter,
  authTokenMiddleware,
  postIdValidationRules,
  handleValidationErrors,
  handleDeletePost
);

export default router;
