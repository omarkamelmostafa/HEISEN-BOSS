// frontend/src/store/slices/post/post-thunks.js
import { postService } from "@/services/domain/post-service";
import { createAppThunk } from "@/store/utils/thunk-utils";

/**
 * Fetch feed posts with cursor-based pagination
 */
export const fetchFeed = createAppThunk(
  "post/fetchFeed",
  async ({ cursor = null, limit = 10 } = {}, { signal }) => {
    const response = await postService.getFeed(cursor, limit, { signal });
    return response.data;
  },
  "Failed to load feed"
);

/**
 * Fetch user posts with cursor-based pagination
 */
export const fetchUserPosts = createAppThunk(
  "post/fetchUserPosts",
  async ({ userId, cursor = null, limit = 10 }, { signal }) => {
    const response = await postService.getUserPosts(userId, cursor, limit, { signal });
    return response.data;
  },
  "Failed to load user posts"
);

/**
 * Fetch a single post by ID
 */
export const fetchPostById = createAppThunk(
  "post/fetchPostById",
  async (postId, { signal }) => {
    const response = await postService.getPostById(postId, { signal });
    return response.data;
  },
  "Failed to load post"
);

/**
 * Create a new post
 * Supports both regular post data and FormData for image uploads
 */
export const createPost = createAppThunk(
  "post/createPost",
  async (postData, { signal }) => {
    const isFormData = postData instanceof FormData;
    const response = isFormData
      ? await postService.createPostWithImage(postData, null, { signal })
      : await postService.createPost(postData, { signal });
    return response.data;
  },
  "Failed to create post"
);

/**
 * Update an existing post
 * Arg shape: { postId, updateData }
 */
export const updatePost = createAppThunk(
  "post/updatePost",
  async ({ postId, updateData }, { signal }) => {
    const response = await postService.updatePost(postId, updateData, { signal });
    return response.data;
  },
  "Failed to update post"
);

/**
 * Delete a post by ID
 * Keeps direct postId so action.meta.arg is simple
 */
export const deletePost = createAppThunk(
  "post/deletePost",
  async (postId, { signal }) => {
    const response = await postService.deletePost(postId, { signal });
    return response.data;
  },
  "Failed to delete post"
);

/**
 * Toggle like on a post
 * Returns { liked, likesCount } in payload.data
 */
export const toggleLike = createAppThunk(
  "post/toggleLike",
  async (postId, { signal }) => {
    const response = await postService.toggleLike(postId, { signal });
    return response.data;
  },
  "Failed to toggle like"
);

/**
 * Create a repost of an existing post
 * Arg shape: { postId, repostData = {} }
 * Returns full repost post object in payload.data.post
 */
export const createRepost = createAppThunk(
  "post/createRepost",
  async ({ postId, repostData = {} }, { signal }) => {
    const response = await postService.createRepost(postId, repostData, { signal });
    return response.data;
  },
  "Failed to create repost"
);
