// backend/use-cases/post/update-post.use-case.js

import Post from "../../model/Post.js";
import logger from "../../utilities/general/logger.js";

/**
 * Update Post Use Case
 *
 * @param {Object} dto
 * @param {string} dto.postId
 * @param {string} dto.userId
 * @param {string} [dto.content]
 * @param {string} [dto.image]
 * @returns {Object} { success, statusCode, message, data?, errorCode? }
 */
export async function updatePostUseCase({ postId, userId, content, image }) {
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
        message: "You are not authorized to update this post.",
        errorCode: "POST_UPDATE_FORBIDDEN",
      };
    }

    // Determine allowed update fields
    const hasContentUpdate = content !== undefined;
    const hasImageUpdate = image !== undefined;

    if (!hasContentUpdate && !hasImageUpdate) {
      return {
        success: false,
        statusCode: 400,
        message: "No valid fields to update.",
        errorCode: "NO_FIELDS_TO_UPDATE",
      };
    }

    // Apply updates only for fields explicitly provided
    if (hasContentUpdate) {
      post.content = content;
    }
    if (hasImageUpdate) {
      post.image = image;
    }

    await post.save();

    // Populate response matching get-post pattern
    const populatedPost = await Post.findById(post._id)
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

    return {
      success: true,
      statusCode: 200,
      message: "Post updated successfully.",
      data: { post: populatedPost },
    };
  } catch (error) {
    logger.error({ err: error, postId, userId }, "Update post use-case error");

    return {
      success: false,
      statusCode: 500,
      message: "Failed to update post.",
      errorCode: "UPDATE_POST_FAILED",
    };
  }
}
