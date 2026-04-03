// backend/use-cases/post/create-post.use-case.js

import Post from "../../model/Post.js";
import User from "../../model/User.js";
import logger from "../../utilities/general/logger.js";

/**
 * Create Post Use Case — Pure business logic, no req/res.
 *
 * @param {Object} dto
 * @param {string} dto.userId
 * @param {string} dto.content
 * @param {string} [dto.image]
 * @returns {Object} { success, statusCode, message, data?, errorCode? }
 */
export async function createPostUseCase({ userId, content, image }) {
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

    // Create the post
    const post = await Post.create({
      author: userId,
      content,
      image: image || null,
    });

    return {
      success: true,
      statusCode: 201,
      message: "Post created successfully.",
      data: { post: post.toJSON() },
    };
  } catch (error) {
    logger.error({ err: error, userId }, "Create post use-case error");

    return {
      success: false,
      statusCode: 500,
      message: "Failed to create post.",
      errorCode: "CREATE_POST_FAILED",
    };
  }
}
