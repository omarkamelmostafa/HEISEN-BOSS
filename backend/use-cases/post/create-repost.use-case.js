// backend/use-cases/post/create-repost.use-case.js

import Post from "../../model/Post.js";
import User from "../../model/User.js";
import logger from "../../utilities/general/logger.js";

/**
 * Create Repost Use Case — Pure business logic, no req/res.
 *
 * @param {Object} dto
 * @param {string} dto.userId
 * @param {string} dto.postId
 * @param {string} [dto.repostComment]
 * @returns {Object} { success, statusCode, message, data?, errorCode? }
 */
export async function createRepostUseCase({ userId, postId, repostComment }) {
  try {
    // Verify the user exists and is active
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      return {
        success: false,
        statusCode: 404,
        message: "User not found or deactivated.",
        errorCode: "USER_NOT_FOUND",
      };
    }

    // Load target post (must exist and not be soft-deleted)
    const targetPost = await Post.findOne({ _id: postId, isDeleted: false });
    if (!targetPost) {
      return {
        success: false,
        statusCode: 404,
        message: "Post not found.",
        errorCode: "POST_NOT_FOUND",
      };
    }

    // Determine original post id (follow repost chain to root)
    let originalId;
    if (targetPost.isRepost) {
      // Target is a repost - use its originalPost as the root
      originalId = targetPost.originalPost;
      // Verify the original post is not soft-deleted
      const originalPost = await Post.findOne({ _id: originalId, isDeleted: false });
      if (!originalPost) {
        return {
          success: false,
          statusCode: 404,
          message: "Original post not found.",
          errorCode: "POST_NOT_FOUND",
        };
      }
    } else {
      // Target is the original post
      originalId = targetPost._id;
    }

    // Self-repost prevention
    const originalPost = await Post.findById(originalId);
    if (originalPost.author.toString() === userId) {
      return {
        success: false,
        statusCode: 403,
        message: "Cannot repost your own post.",
        errorCode: "POST_REPOST_FORBIDDEN",
      };
    }

    // Create repost document
    let repost;
    try {
      repost = await Post.create({
        author: userId,
        isRepost: true,
        originalPost: originalId,
        repostComment: repostComment || null,
        content: null,
        image: null,
        imagePublicId: null,
      });
    } catch (dbError) {
      logger.error({ err: dbError, userId, postId }, "Create repost use-case DB error");
      return {
        success: false,
        statusCode: 500,
        message: "Failed to create repost.",
        errorCode: "CREATE_REPOST_FAILED",
      };
    }

    // Increment repostsCount on the original post
    try {
      await Post.findByIdAndUpdate(originalId, { $inc: { repostsCount: 1 } });
    } catch (incError) {
      logger.error({ err: incError, originalId }, "Failed to increment repostsCount");
      // Non-fatal: repost was created successfully
    }

    return {
      success: true,
      statusCode: 201,
      message: "Repost created successfully.",
      data: { post: repost.toJSON() },
    };
  } catch (error) {
    logger.error({ err: error, userId, postId }, "Create repost use-case error");

    return {
      success: false,
      statusCode: 500,
      message: "Failed to create repost.",
      errorCode: "CREATE_REPOST_FAILED",
    };
  }
}
