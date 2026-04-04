// backend/controllers/post/delete-post.controller.js

import { deletePostUseCase } from "../../use-cases/post/delete-post.use-case.js";
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

    if (!result.success) {
      return res.status(result.statusCode).json({
        success: result.success,
        message: result.message,
        errorCode: result.errorCode,
      });
    }

    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
    });
  } catch (error) {
    logger.error({ err: error, postId: req.params.postId, userId: req.user?.id }, "Delete post controller error");
    next(error);
  }
}
