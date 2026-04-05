// backend/use-cases/comment/delete-comment.use-case.js

import Comment from "../../model/Comment.js";
import Post from "../../model/Post.js";
import logger from "../../utilities/general/logger.js";

/**
 * Delete Comment Use Case
 *
 * @param {Object} dto
 * @param {string} dto.userId
 * @param {string} dto.postId
 * @param {string} dto.commentId
 * @returns {Object} { success, statusCode, message, errorCode? }
 */
export async function deleteCommentUseCase({ userId, postId, commentId }) {
  try {
    // Verify post exists and is not soft-deleted
    const post = await Post.findOne({ _id: postId, isDeleted: false });

    if (!post) {
      return {
        success: false,
        statusCode: 404,
        message: "Post not found.",
        errorCode: "POST_NOT_FOUND",
      };
    }

    // Fetch comment that must belong to the post and not be soft-deleted
    const comment = await Comment.findOne({
      _id: commentId,
      post: postId,
      isDeleted: false,
    });

    if (!comment) {
      return {
        success: false,
        statusCode: 404,
        message: "Comment not found.",
        errorCode: "COMMENT_NOT_FOUND",
      };
    }

    // Ownership check — only comment author can delete
    if (comment.author.toString() !== userId) {
      return {
        success: false,
        statusCode: 403,
        message: "You are not authorized to delete this comment.",
        errorCode: "COMMENT_DELETE_FORBIDDEN",
      };
    }

    // Soft delete the comment
    comment.isDeleted = true;
    comment.deletedAt = new Date();
    comment.deletedBy = userId;

    await comment.save();

    // Decrement post comments counter
    await Post.updateOne(
      { _id: postId },
      { $inc: { commentsCount: -1 } }
    );

    return {
      success: true,
      statusCode: 200,
      message: "Comment deleted successfully.",
    };
  } catch (error) {
    logger.error(
      { err: error, userId, postId, commentId },
      "Delete comment use-case error"
    );

    return {
      success: false,
      statusCode: 500,
      message: "Failed to delete comment.",
      errorCode: "DELETE_COMMENT_FAILED",
    };
  }
}
