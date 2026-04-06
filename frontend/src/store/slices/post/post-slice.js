// frontend/src/store/slices/post/post-slice.js
import { createSlice } from "@reduxjs/toolkit";

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
  // NOTE: extraReducers for thunks will be added in Batch 1B.2
});

export const {
  clearPostError,
  resetCurrentPost,
  resetFeedState,
  resetUserPostsState,
  clearPostState,
} = postSlice.actions;

export default postSlice.reducer;
