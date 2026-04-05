// backend/use-cases/post/get-user-posts.use-case.js

import mongoose from "mongoose";
import Post from "../../model/Post.js";
import logger from "../../utilities/general/logger.js";

/**
 * Get User Posts Use Case — Returns posts by a specific user.
 *
 * @param {Object} dto
 * @param {string} dto.userId
 * @param {string} dto.targetUserId
 * @param {string} [dto.cursor]
 * @param {number} [dto.limit]
 * @returns {Object} { success, statusCode, message, data?, errorCode? }
 */
export async function getUserPostsUseCase({ userId, targetUserId, cursor, limit }) {
  try {
    // Normalize inputs
    const pageLimit = limit || 20;

    // Query user posts
    const userQuery = {
      isDeleted: false,
      author: targetUserId,
    };

    if (cursor) {
      userQuery._id = { $lt: cursor };
    }

    const posts = await Post.find(userQuery)
      .sort({ _id: -1 })
      .limit(pageLimit + 1)
      .populate("author", "firstname lastname avatar")
      .lean();

    // Determine pagination
    const hasMore = posts.length > pageLimit;
    const resultPosts = hasMore ? posts.slice(0, pageLimit) : posts;
    const nextCursor = hasMore ? resultPosts[resultPosts.length - 1]._id.toString() : null;

    return {
      success: true,
      statusCode: 200,
      message: "User posts loaded successfully.",
      data: {
        posts: resultPosts,
        nextCursor,
        hasMore,
      },
    };
  } catch (error) {
    logger.error({ err: error, userId, targetUserId }, "Get user posts use-case error");

    return {
      success: false,
      statusCode: 500,
      message: "Failed to load user posts.",
      errorCode: "GET_USER_POSTS_FAILED",
    };
  }
}
