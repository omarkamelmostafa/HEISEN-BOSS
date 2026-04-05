// backend/use-cases/post/create-post.use-case.js

import Post from "../../model/Post.js";
import User from "../../model/User.js";
import logger from "../../utilities/general/logger.js";
import { CloudinaryService } from "../../services/cloudinaryService.js";

/**
 * Create Post Use Case — Pure business logic, no req/res.
 *
 * @param {Object} dto
 * @param {string} dto.userId
 * @param {string} dto.content
 * @param {Object} [dto.imageFile]
 * @param {Buffer} dto.imageFile.buffer
 * @param {string} dto.imageFile.mimetype
 * @returns {Object} { success, statusCode, message, data?, errorCode? }
 */
export async function createPostUseCase({ userId, content, image, imageFile }) {
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

    let uploadedImage = null;
    let imagePublicId = null;

    // Handle image file upload (takes precedence over body URL)
    if (imageFile?.buffer) {
      try {
        const uploadResult = await CloudinaryService.uploadPostImage(
          userId,
          imageFile.buffer,
          imageFile.mimetype
        );
        uploadedImage = uploadResult.url;
        imagePublicId = uploadResult.publicId;
      } catch (uploadError) {
        logger.error({ err: uploadError, userId }, "Post image upload failed");
        return {
          success: false,
          statusCode: 500,
          message: "Failed to upload image.",
          errorCode: "IMAGE_UPLOAD_FAILED",
        };
      }
    } else if (image) {
      // Use body URL for image (backward compatibility)
      uploadedImage = image;
    }

    // Create the post
    let post;
    try {
      post = await Post.create({
        author: userId,
        content,
        image: uploadedImage,
        imagePublicId,
      });
    } catch (dbError) {
      // Best-effort cleanup if Cloudinary upload succeeded but DB failed
      if (imagePublicId) {
        try {
          await CloudinaryService.deleteImage(imagePublicId);
        } catch (cleanupError) {
          logger.error(
            { err: cleanupError, publicId: imagePublicId, userId },
            "Failed to cleanup uploaded post image after DB error"
          );
        }
      }
      throw dbError;
    }

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
