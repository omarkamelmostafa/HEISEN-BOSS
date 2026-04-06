// frontend/src/store/slices/post/post-selectors.js

// ==================== BASE SELECTORS ====================

// Full post state selector
export const selectPostState = (state) => state.post;

// ==================== POST LIST SELECTORS ====================

export const selectFeedPosts = (state) => state.post.feedPosts;
export const selectUserPosts = (state) => state.post.userPosts;

// ==================== SINGLE POST SELECTORS ====================

export const selectCurrentPost = (state) => state.post.currentPost;

// ==================== PAGINATION SELECTORS ====================

export const selectFeedCursor = (state) => state.post.feedCursor;
export const selectUserPostsCursor = (state) => state.post.userPostsCursor;
export const selectFeedHasMore = (state) => state.post.feedHasMore;
export const selectUserPostsHasMore = (state) => state.post.userPostsHasMore;

// ==================== STATUS SELECTORS ====================

export const selectPostLoading = (state) => state.post.isLoading;
export const selectPostMutating = (state) => state.post.isMutating;
export const selectPostError = (state) => state.post.error;
