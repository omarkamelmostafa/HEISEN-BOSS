// frontend/src/services/api/endpoints/post-endpoints.js

// Post API endpoints configuration
// Centralized endpoint management for maintainability

class PostEndpoints {
  constructor() {
    // Paths relative to axios base URL (already includes /api/v1)
    this.BASE = "/api";
    this.VERSION = `/v${process.env.NEXT_PUBLIC_API_VERSION || '1'}`;
    this.PREFIX = "/posts";
  }

  // ==================== ACTUAL ENDPOINTS ====================

  /** POST /posts - Create new post */
  get CREATE() {
    return this.PREFIX;
  }

  /** GET /posts/feed - Get feed posts */
  get FEED() {
    return `${this.PREFIX}/feed`;
  }

  /** GET /posts/user/:userId - Get posts by user */
  USER_POSTS(userId) {
    return `${this.PREFIX}/user/${userId}`;
  }

  /** GET /posts/:postId - Get single post */
  GET_BY_ID(postId) {
    return `${this.PREFIX}/${postId}`;
  }

  /** PATCH /posts/:postId - Update post */
  UPDATE(postId) {
    return `${this.PREFIX}/${postId}`;
  }

  /** DELETE /posts/:postId - Delete post */
  DELETE(postId) {
    return `${this.PREFIX}/${postId}`;
  }

  // ==================== QUERY PARAMETER BUILDERS ====================

  /**
   * Build URL with query parameters
   * Supports cursor-based pagination for feed and user posts
   */
  buildUrl(baseUrl, params = {}) {
    if (!params || Object.keys(params).length === 0) {
      return baseUrl;
    }

    const queryString = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        queryString.append(key, value.toString());
      }
    });

    const query = queryString.toString();
    return query ? `${baseUrl}?${query}` : baseUrl;
  }

  /**
   * Cursor-based pagination helper
   * @param {string} url - Base URL
   * @param {string} [cursor] - MongoDB ObjectId cursor for pagination
   * @param {number} [limit=10] - Number of items per page (1-50)
   * @returns {string} URL with pagination params
   */
  withCursorPagination(url, cursor = null, limit = 10) {
    const params = {};
    if (cursor) params.cursor = cursor;
    if (limit) params.limit = limit;
    return this.buildUrl(url, params);
  }

  /**
   * Build feed URL with pagination
   * @param {string} [cursor] - Cursor for pagination
   * @param {number} [limit=10] - Items per page
   * @returns {string} Feed URL with query params
   */
  feedWithPagination(cursor = null, limit = 10) {
    return this.withCursorPagination(this.FEED, cursor, limit);
  }

  /**
   * Build user posts URL with pagination
   * @param {string} userId - User ID
   * @param {string} [cursor] - Cursor for pagination
   * @param {number} [limit=10] - Items per page
   * @returns {string} User posts URL with query params
   */
  userPostsWithPagination(userId, cursor = null, limit = 10) {
    return this.withCursorPagination(this.USER_POSTS(userId), cursor, limit);
  }

  // ==================== UTILITY METHODS ====================

  /** Get current API configuration */
  get config() {
    return {
      base: this.BASE,
      version: this.VERSION,
      prefix: this.PREFIX,
      apiVersion: process.env.NEXT_PUBLIC_API_VERSION || '1',
      environment: process.env.NODE_ENV || 'development',
    };
  }
}

// Singleton instance
export const postEndpoints = new PostEndpoints();
