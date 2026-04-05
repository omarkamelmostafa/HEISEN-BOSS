// backend/routes/like/like-routes.js

import express from "express";
import { authTokenMiddleware } from "../../middleware/auth/authTokenMiddleware.js";
import { toggleLikeLimiter } from "../../middleware/security/index.js";
import { postIdValidationRules } from "../../validators/index.js";
import { handleValidationErrors } from "../../middleware/validation/index.js";
import { handleToggleLike } from "../../controllers/like/toggle-like.controller.js";

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

export default router;
