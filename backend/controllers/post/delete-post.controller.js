// backend/controllers/post/delete-post.controller.js

import { deletePostUseCase } from "../../use-cases/post/delete-post.use-case.js";
import { sendUseCaseResponse } from "../auth/auth-shared.js";
import logger from "../../utilities/general/logger.js";

/**
 * Delete Post Controller
 *
 * Handles HTTP DELETE /api/v1/posts/:postId requests
 * Extracts postId and userId from request, delegates to use case
 */
export async function handleDeletePost(req, res, next) {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;

    const result = await deletePostUseCase({ postId, userId });

    return sendUseCaseResponse(req, res, result);
  } catch (error) {
    logger.error({ err: error, postId: req.params.postId, userId: req.user?.id }, "Delete post controller error");
    next(error);
  }
}
