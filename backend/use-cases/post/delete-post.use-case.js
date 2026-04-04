// backend/use-cases/post/delete-post.use-case.js

import Post from "../../model/Post.js";
import logger from "../../utilities/general/logger.js";

/**
 * Delete Post Use Case
 *
 * @param {Object} dto
 * @param {string} dto.postId
 * @param {string} dto.userId
 * @returns {Object} { success, statusCode, message, data?, errorCode? }
 */
export async function deletePostUseCase({ postId, userId }) {
  try {
    // Find non-deleted post
    const post = await Post.findOne({ _id: postId, isDeleted: false });

    if (!post) {
      return {
        success: false,
        statusCode: 404,
        message: "Post not found.",
        errorCode: "POST_NOT_FOUND",
      };
    }

    // Ownership check
    if (post.author.toString() !== userId) {
      return {
        success: false,
        statusCode: 403,
        message: "You are not authorized to delete this post.",
        errorCode: "POST_DELETE_FORBIDDEN",
      };
    }

    // Soft delete the post
    post.isDeleted = true;
    post.deletedAt = new Date();
    post.deletedBy = userId;

    await post.save();

    return {
      success: true,
      statusCode: 200,
      message: "Post deleted successfully.",
    };
  } catch (error) {
    logger.error({ err: error, postId, userId }, "Delete post use-case error");

    return {
      success: false,
      statusCode: 500,
      message: "Failed to delete post.",
      errorCode: "DELETE_POST_FAILED",
    };
  }
}
