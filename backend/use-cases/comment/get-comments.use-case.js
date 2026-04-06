// backend/use-cases/comment/get-comments.use-case.js

import Comment from "../../model/Comment.js";
import Post from "../../model/Post.js";
import logger from "../../utilities/general/logger.js";

/**
 * Get Comments Use Case — Returns paginated comments for a post.
 *
 * @param {Object} dto
 * @param {string} dto.postId
 * @param {string} [dto.cursor]
 * @param {number} [dto.limit]
 * @returns {Object} { success, statusCode, message, data?, errorCode? }
 */
export async function getCommentsUseCase({ postId, cursor, limit }) {
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

    // Normalize inputs
    const pageLimit = limit || 20;

    // Build comments query
    const query = {
      post: postId,
      isDeleted: false,
    };

    if (cursor) {
      query._id = { $lt: cursor };
    }

    // Fetch comments with author population
    const comments = await Comment.find(query)
      .sort({ _id: -1 })
      .limit(pageLimit + 1)
      .populate({
        path: "author",
        select: "firstname lastname avatar.url",
      })
      .lean();

    // Determine pagination
    const hasMore = comments.length > pageLimit;
    const resultComments = hasMore ? comments.slice(0, pageLimit) : comments;
    const nextCursor = hasMore
      ? comments[comments.length - 1]._id.toString()
      : null;

    return {
      success: true,
      statusCode: 200,
      message: "Comments loaded successfully.",
      data: {
        comments: resultComments,
        nextCursor,
        hasMore,
      },
    };
  } catch (error) {
    logger.error({ err: error, postId }, "Get comments use-case error");

    return {
      success: false,
      statusCode: 500,
      message: "Failed to load comments.",
      errorCode: "GET_COMMENTS_FAILED",
    };
  }
}
