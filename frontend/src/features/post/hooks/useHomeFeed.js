// frontend/src/features/post/hooks/useHomeFeed.js
import { useRef, useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  selectFeedPosts,
  selectFeedCursor,
  selectFeedHasMore,
  selectPostLoading,
} from "@/store/slices/post/post-selectors";
import {
  fetchFeed,
  deletePost,
  toggleLike,
  createRepost,
} from "@/store/slices/post/post-thunks";

/**
 * Home feed orchestration hook
 * - Reads feed state from Redux
 * - Fetches feed on mount (guarded against double-invocation)
 * - Supports guarded pagination
 * - Wires safe callbacks for like, delete, repost
 *
 * @returns {Object} Feed state and callbacks
 */
export function useHomeFeed() {
  const dispatch = useAppDispatch();

  // Selectors
  const posts = useAppSelector(selectFeedPosts);
  const cursor = useAppSelector(selectFeedCursor);
  const hasMore = useAppSelector(selectFeedHasMore);
  const isLoading = useAppSelector(selectPostLoading);

  // Mount guard to prevent duplicate initial fetch in Strict Mode
  const hasFetchedRef = useRef(false);

  // Initial fetch on mount
  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      dispatch(fetchFeed({ limit: 10 }));
    }
  }, [dispatch]);

  // Guarded pagination
  const loadMore = () => {
    if (isLoading) return;
    if (!hasMore) return;
    if (!cursor) return;

    dispatch(fetchFeed({ cursor, limit: 10 }));
  };

  // Safe mutation callbacks
  const onLike = async (postId) => {
    try {
      await dispatch(toggleLike(postId)).unwrap();
    } catch {
      // Silently catch to avoid unhandled promise rejections
      // No NotificationService/toasts in this step
    }
  };

  const onDelete = async (postId) => {
    try {
      await dispatch(deletePost(postId)).unwrap();
    } catch {
      // Silently catch to avoid unhandled promise rejections
      // No NotificationService/toasts in this step
    }
  };

  const onRepost = async (postId) => {
    try {
      await dispatch(createRepost({ postId, repostData: {} })).unwrap();
    } catch {
      // Silently catch to avoid unhandled promise rejections
      // No NotificationService/toasts in this step
    }
  };

  // Normalize posts with isLiked defaulting to false
  const normalizedPosts = useMemo(() => {
    return posts.map((post) => ({
      ...post,
      isLiked: Boolean(post.isLiked),
    }));
  }, [posts]);

  return {
    posts: normalizedPosts,
    isLoading,
    hasMore,
    loadMore,
    onLike,
    onDelete,
    onRepost,
  };
}
