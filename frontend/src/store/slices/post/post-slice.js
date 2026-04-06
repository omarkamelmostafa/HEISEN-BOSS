// frontend/src/store/slices/post/post-slice.js
import { createSlice } from "@reduxjs/toolkit";
import { fetchFeed, fetchUserPosts, fetchPostById } from "./post-thunks";

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
