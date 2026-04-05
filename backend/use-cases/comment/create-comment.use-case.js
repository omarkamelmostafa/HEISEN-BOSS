// backend/use-cases/comment/create-comment.use-case.js

import Comment from "../../model/Comment.js";
import Post from "../../model/Post.js";
import logger from "../../utilities/general/logger.js";

/**
 * Create Comment Use Case — Pure business logic, no req/res.
 *
 * @param {Object} dto
 * @param {string} dto.userId
 * @param {string} dto.postId
 * @param {string} dto.content
 * @returns {Object} { success, statusCode, message, data?, errorCode? }
 */
export async function createCommentUseCase({ userId, postId, content }) {
  try {
    // Verify the post exists and is not soft-deleted
    const post = await Post.findOne({ _id: postId, isDeleted: false });

    if (!post) {
      return {
        success: false,
        statusCode: 404,
        message: "Post not found.",
        errorCode: "POST_NOT_FOUND",
      };
    }

    // Create the comment
    const comment = await Comment.create({
      author: userId,
      post: postId,
      content,
    });

    // Populate author before returning
    await comment.populate({
      path: "author",
      select: "firstname lastname avatar.url",
    });

    // Atomically increment post comments counter
    await Post.updateOne(
      { _id: postId },
      { $inc: { commentsCount: 1 } }
    );

    return {
      success: true,
      statusCode: 201,
      message: "Comment created successfully.",
      data: { comment: comment.toJSON() },
    };
  } catch (error) {
    logger.error({ err: error, userId, postId }, "Create comment use-case error");

    return {
      success: false,
      statusCode: 500,
      message: "Failed to create comment.",
      errorCode: "CREATE_COMMENT_FAILED",
    };
  }
}
