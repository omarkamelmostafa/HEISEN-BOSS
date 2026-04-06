// backend/use-cases/like/toggle-like.use-case.js

import Like from "../../model/Like.js";
import Post from "../../model/Post.js";
import logger from "../../utilities/general/logger.js";

/**
 * Toggle Like Use Case — Pure business logic, no req/res.
 *
 * @param {Object} dto
 * @param {string} dto.userId
 * @param {string} dto.postId
 * @returns {Object} { success, statusCode, message, data?, errorCode? }
 */
export async function toggleLikeUseCase({ userId, postId }) {
  try {
    // A. Verify post exists and is not soft-deleted
    const post = await Post.findOne({ _id: postId, isDeleted: false });

    if (!post) {
      return {
        success: false,
        statusCode: 404,
        message: "Post not found.",
        errorCode: "POST_NOT_FOUND",
      };
    }

    // B. Check for existing like
    const existingLike = await Like.findOne({ user: userId, post: postId });

    // C. If like exists → unlike
    if (existingLike) {
      // Delete the like record
      await Like.deleteOne({ _id: existingLike._id });

      // Decrement post counter atomically
      const updatedPost = await Post.findByIdAndUpdate(
        postId,
        { $inc: { likesCount: -1 } },
        { new: true }
      );

      return {
        success: true,
        statusCode: 200,
        message: "Post unliked successfully.",
        data: { liked: false, likesCount: updatedPost.likesCount },
      };
    }

    // D. If like does not exist → like
    try {
      // Create Like record
      await Like.create({
        user: userId,
        post: postId,
      });

      // Increment post counter atomically
      const updatedPost = await Post.findByIdAndUpdate(
        postId,
        { $inc: { likesCount: 1 } },
        { new: true }
      );

      return {
        success: true,
        statusCode: 200,
        message: "Post liked successfully.",
        data: { liked: true, likesCount: updatedPost.likesCount },
      };
    } catch (createError) {
      // E. Duplicate-key safety (race condition)
      if (createError.code === 11000) {
        // MongoDB duplicate key error — like already exists due to race
        logger.warn(
          { userId, postId, error: createError.message },
          "Like toggle race condition detected — like already exists"
        );

        // Fetch current post count
        const currentPost = await Post.findById(postId);

        return {
          success: true,
          statusCode: 200,
          message: "Post liked successfully.",
          data: { liked: true, likesCount: currentPost.likesCount },
        };
      }

      // Re-throw unexpected errors to be caught by outer catch
      throw createError;
    }
  } catch (error) {
    // F. Unexpected errors
    logger.error({ err: error, userId, postId }, "Toggle like use-case error");

    return {
      success: false,
      statusCode: 500,
      message: "Failed to toggle like.",
      errorCode: "TOGGLE_LIKE_FAILED",
    };
  }
}
