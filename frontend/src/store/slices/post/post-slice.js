// frontend/src/store/slices/post/post-slice.js
import { createSlice } from "@reduxjs/toolkit";
import { fetchFeed, fetchUserPosts, fetchPostById, createPost, updatePost, deletePost } from "./post-thunks";

const initialState = {
  // ==================== POST LISTS ====================
  feedPosts: [],
  userPosts: [],

  // ==================== SINGLE POST ====================
  currentPost: null,

  // ==================== PAGINATION STATE ====================
  feedCursor: null,
  userPostsCursor: null,
  feedHasMore: true,
  userPostsHasMore: true,

  // ==================== STATUS STATE ====================
  isLoading: false,
  isMutating: false,
  error: null,
};

const postSlice = createSlice({
  name: "post",
  initialState,
  reducers: {
    // ==================== SYNC REDUCERS ====================

    // Reset error to null
    clearPostError: (state) => {
      state.error = null;
    },

    // Reset currentPost to null
    resetCurrentPost: (state) => {
      state.currentPost = null;
    },

    // Reset feed state (feedPosts, feedCursor, feedHasMore)
    resetFeedState: (state) => {
      state.feedPosts = [];
      state.feedCursor = null;
      state.feedHasMore = true;
    },

    // Reset user posts state (userPosts, userPostsCursor, userPostsHasMore)
    resetUserPostsState: (state) => {
      state.userPosts = [];
      state.userPostsCursor = null;
      state.userPostsHasMore = true;
    },

    // Reset entire slice to initial state
    clearPostState: (state) => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    // ==================== READ THUNKS: PENDING ====================
    builder
      .addCase(fetchFeed.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserPosts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPostById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      });

    // ==================== READ THUNKS: FULFILLED ====================
    builder
      .addCase(fetchFeed.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;

        const { posts, hasMore, nextCursor } = action.payload.data;

        if (action.meta.arg?.cursor) {
          // Append mode: de-duplicate by _id before assignment
          const existingIds = new Set(state.feedPosts.map((p) => p._id));
          const newPosts = posts.filter((p) => !existingIds.has(p._id));
          state.feedPosts.push(...newPosts);
        } else {
          // Replace mode: initial load or refresh
          state.feedPosts = posts;
        }

        state.feedCursor = nextCursor ?? null;
        state.feedHasMore = hasMore ?? false;
      })
      .addCase(fetchUserPosts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;

        const { posts, hasMore, nextCursor } = action.payload.data;

        if (action.meta.arg?.cursor) {
          // Append mode: de-duplicate by _id before assignment
          const existingIds = new Set(state.userPosts.map((p) => p._id));
          const newPosts = posts.filter((p) => !existingIds.has(p._id));
          state.userPosts.push(...newPosts);
        } else {
          // Replace mode: initial load or refresh
          state.userPosts = posts;
        }

        state.userPostsCursor = nextCursor ?? null;
        state.userPostsHasMore = hasMore ?? false;
      })
      .addCase(fetchPostById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        state.currentPost = action.payload.data.post;
      });

    // ==================== READ THUNKS: REJECTED ====================
    builder
      .addCase(fetchFeed.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchUserPosts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchPostById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // ==================== MUTATION THUNKS: PENDING ====================
    builder
      .addCase(createPost.pending, (state) => {
        state.isMutating = true;
        state.error = null;
      })
      .addCase(updatePost.pending, (state) => {
        state.isMutating = true;
        state.error = null;
      })
      .addCase(deletePost.pending, (state) => {
        state.isMutating = true;
        state.error = null;
      });

    // ==================== MUTATION THUNKS: FULFILLED ====================
    builder
      .addCase(createPost.fulfilled, (state, action) => {
        state.isMutating = false;
        state.error = null;

        const createdPost = action.payload.data.post;

        // Prepend to feedPosts only if not already present
        if (createdPost && createdPost._id) {
          const existsInFeed = state.feedPosts.some((p) => p._id === createdPost._id);
          if (!existsInFeed) {
            state.feedPosts.unshift(createdPost);
          }
        }
        // Do not modify userPosts - we don't know which user's posts are loaded
      })
      .addCase(updatePost.fulfilled, (state, action) => {
        state.isMutating = false;
        state.error = null;

        const updatedPost = action.payload.data.post;

        if (updatedPost && updatedPost._id) {
          // Replace in feedPosts if found
          const feedIndex = state.feedPosts.findIndex((p) => p._id === updatedPost._id);
          if (feedIndex !== -1) {
            state.feedPosts[feedIndex] = updatedPost;
          }

          // Replace in userPosts if found
          const userPostsIndex = state.userPosts.findIndex((p) => p._id === updatedPost._id);
          if (userPostsIndex !== -1) {
            state.userPosts[userPostsIndex] = updatedPost;
          }

          // Replace currentPost if it's the same post
          if (state.currentPost && state.currentPost._id === updatedPost._id) {
            state.currentPost = updatedPost;
          }
        }
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        state.isMutating = false;
        state.error = null;

        // Use action.meta.arg for postId (thunk arg) - NOT action.payload.data.post
        const deletedPostId = action.meta.arg;

        if (deletedPostId) {
          // Remove from feedPosts
          state.feedPosts = state.feedPosts.filter((p) => p._id !== deletedPostId);

          // Remove from userPosts
          state.userPosts = state.userPosts.filter((p) => p._id !== deletedPostId);

          // Clear currentPost if it's the deleted post
          if (state.currentPost && state.currentPost._id === deletedPostId) {
            state.currentPost = null;
          }
        }
      });

    // ==================== MUTATION THUNKS: REJECTED ====================
    builder
      .addCase(createPost.rejected, (state, action) => {
        state.isMutating = false;
        state.error = action.payload;
      })
      .addCase(updatePost.rejected, (state, action) => {
        state.isMutating = false;
        state.error = action.payload;
      })
      .addCase(deletePost.rejected, (state, action) => {
        state.isMutating = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearPostError,
  resetCurrentPost,
  resetFeedState,
  resetUserPostsState,
  clearPostState,
} = postSlice.actions;

export default postSlice.reducer;
