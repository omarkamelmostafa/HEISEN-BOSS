// backend/use-cases/post/get-post.use-case.js

import mongoose from "mongoose";
import Post from "../../model/Post.js";
import logger from "../../utilities/general/logger.js";

/**
 * Get Single Post Use Case
 *
 * @param {Object} dto
 * @param {string} dto.postId
 * @returns {Object} { success, statusCode, message, data?, errorCode? }
 */
export async function getPostUseCase({ postId }) {
  try {
    const post = await Post.findOne({ _id: postId, isDeleted: false })
      .populate("author", "firstname lastname avatar")
      .populate({
        path: "originalPost",
        match: { isDeleted: false },
        populate: {
          path: "author",
          select: "firstname lastname avatar",
        },
      })
      .lean();

    if (!post) {
      return {
        success: false,
        statusCode: 404,
        message: "Post not found.",
        errorCode: "POST_NOT_FOUND",
      };
    }

    return {
      success: true,
      statusCode: 200,
      message: "Post retrieved successfully.",
      data: { post },
    };
  } catch (error) {
    logger.error({ err: error, postId }, "Get post use-case error");

    return {
      success: false,
      statusCode: 500,
      message: "Failed to retrieve post.",
      errorCode: "GET_POST_FAILED",
    };
  }
}
