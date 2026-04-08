// frontend/src/services/domain/post-service.js
import { privateClient } from "@/services/api/client";
import { postEndpoints } from "@/services/api/endpoints";
import { normalizeResponse } from "@/lib/utils/error-utils";
import { translateApiError } from "@/lib/i18n/api-error-translator";

/**
 * Post Service
 * Pure data-access layer for post CRUD operations and feed management.
 *
 * Design rules:
 *   - NO console.log/error (callers decide how to handle errors)
 *   - NO Redux dispatches (callers own state updates)
 *   - NO mixed concerns (config separated from business data)
 *   - Returns normalized responses; throws normalized errors
 */
class PostService {
  constructor() {
    // Service initialization - no cache or persistent state
  }

  // ==================== POST CRUD OPERATIONS ====================

  /**
   * Create a new post
   * @param {Object} postData - Post data (content, image URL, etc.)
   * @param {Object} [config={}] - Axios request config (signal, headers, etc.)
   * @returns {Promise<Object>} Normalized response
   */
  async createPost(postData, config = {}) {
    const response = await privateClient.post(
      postEndpoints.CREATE,
      postData,
      config
    );
    return normalizeResponse(response);
  }

  /**
   * Create a new post with image upload (multipart/form-data)
   * @param {FormData} formData - FormData containing post content and image file
   * @param {Function} [onProgress=null] - Upload progress callback
   * @param {Object} [config={}] - Axios request config
   * @returns {Promise<Object>} Normalized response
   */
  async createPostWithImage(formData, onProgress = null, config = {}) {
    if (!(formData instanceof FormData)) {
      throw new Error(translateApiError("INVALID_FILE", "Invalid form data provided"));
    }

    const response = await privateClient.upload(
      postEndpoints.CREATE,
      formData,
      onProgress,
      config
    );
    return normalizeResponse(response);
  }

  /**
   * Get feed posts with cursor-based pagination
   * @param {string} [cursor=null] - Cursor for pagination (MongoDB ObjectId)
   * @param {number} [limit=10] - Number of posts to fetch (1-50)
   * @param {Object} [config={}] - Axios request config
   * @returns {Promise<Object>} Normalized response
   */
  async getFeed(cursor = null, limit = 10, config = {}) {
    const url = postEndpoints.feedWithPagination(cursor, limit);
    const response = await privateClient.get(url, config);
    return normalizeResponse(response);
  }

  /**
   * Get posts by a specific user with cursor-based pagination
   * @param {string} userId - User ID
   * @param {string} [cursor=null] - Cursor for pagination (MongoDB ObjectId)
   * @param {number} [limit=10] - Number of posts to fetch (1-50)
   * @param {Object} [config={}] - Axios request config
   * @returns {Promise<Object>} Normalized response
   */
  async getUserPosts(userId, cursor = null, limit = 10, config = {}) {
    const url = postEndpoints.userPostsWithPagination(userId, cursor, limit);
    const response = await privateClient.get(url, config);
    return normalizeResponse(response);
  }

  /**
   * Get a single post by ID
   * @param {string} postId - Post ID
   * @param {Object} [config={}] - Axios request config
   * @returns {Promise<Object>} Normalized response
   */
  async getPostById(postId, config = {}) {
    const response = await privateClient.get(
      postEndpoints.GET_BY_ID(postId),
      config
    );
    return normalizeResponse(response);
  }

  /**
   * Update a post
   * @param {string} postId - Post ID
   * @param {Object} updateData - Fields to update (content, image)
   * @param {Object} [config={}] - Axios request config
   * @returns {Promise<Object>} Normalized response
   */
  async updatePost(postId, updateData, config = {}) {
    const response = await privateClient.patch(
      postEndpoints.UPDATE(postId),
      updateData,
      config
    );
    return normalizeResponse(response);
  }

  /**
   * Delete a post
   * @param {string} postId - Post ID
   * @param {Object} [config={}] - Axios request config
   * @returns {Promise<Object>} Normalized response
   */
  async deletePost(postId, config = {}) {
    const response = await privateClient.delete(
      postEndpoints.DELETE(postId),
      config
    );
    return normalizeResponse(response);
  }

  // ==================== ENGAGEMENT OPERATIONS ====================

  /**
   * Toggle like on a post (like/unlike)
   * @param {string} postId - Post ID
   * @param {Object} [config={}] - Axios request config
   * @returns {Promise<Object>} Normalized response
   */
  async toggleLike(postId, config = {}) {
    const response = await privateClient.post(
      postEndpoints.LIKE(postId),
      {},
      config
    );
    return normalizeResponse(response);
  }

  /**
   * Create a repost of a post
   * @param {string} postId - Post ID to repost
   * @param {Object} [repostData={}] - Optional repost data (repostComment)
   * @param {Object} [config={}] - Axios request config
   * @returns {Promise<Object>} Normalized response
   */
  async createRepost(postId, repostData = {}, config = {}) {
    const response = await privateClient.post(
      postEndpoints.REPOST(postId),
      repostData,
      config
    );
    return normalizeResponse(response);
  }

  /**
   * Get comments for a post with cursor-based pagination
   * @param {string} postId - Post ID
   * @param {string} [cursor=null] - Cursor for pagination (MongoDB ObjectId)
   * @param {number} [limit=10] - Number of comments to fetch (1-50)
   * @param {Object} [config={}] - Axios request config
   * @returns {Promise<Object>} Normalized response
   */
  async getComments(postId, cursor = null, limit = 10, config = {}) {
    const url = postEndpoints.commentsWithPagination(postId, cursor, limit);
    const response = await privateClient.get(url, config);
    return normalizeResponse(response);
  }

  /**
   * Create a comment on a post
   * @param {string} postId - Post ID
   * @param {Object} commentData - Comment data ({ content })
   * @param {Object} [config={}] - Axios request config
   * @returns {Promise<Object>} Normalized response
   */
  async createComment(postId, commentData, config = {}) {
    const response = await privateClient.post(
      postEndpoints.COMMENT(postId),
      commentData,
      config
    );
    return normalizeResponse(response);
  }

  /**
   * Delete a comment
   * @param {string} postId - Post ID
   * @param {string} commentId - Comment ID
   * @param {Object} [config={}] - Axios request config
   * @returns {Promise<Object>} Normalized response
   */
  async deleteComment(postId, commentId, config = {}) {
    const response = await privateClient.delete(
      postEndpoints.DELETE_COMMENT(postId, commentId),
      config
    );
    return normalizeResponse(response);
  }
}

// Singleton instance
export const postService = new PostService();
export default postService;
