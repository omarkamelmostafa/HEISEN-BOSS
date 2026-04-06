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
