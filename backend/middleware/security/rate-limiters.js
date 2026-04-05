// backend/middleware/security/rate-limiters.js
// Endpoint-specific rate limiters for auth routes (FR-029).
// All use Redis-backed express-rate-limit for persistence across restarts.

import { createRateLimiterMiddleware } from "./rate-limiter-middleware.js";

/**
 * Login: 10 requests per 5 minutes per IP
 */
export const loginLimiter = createRateLimiterMiddleware({
  windowMs: parseInt(process.env.RATE_LIMIT_LOGIN_WINDOW_MS, 10) || 5 * 60 * 1000,
  max: Math.max(parseInt(process.env.RATE_LIMIT_LOGIN_MAX, 10) || 10, 10), // 10 requests per 5 minutes per IP
  message: {
    text: "Too many login attempts. Please try again in 15 minutes.",
    errorCode: "RATE_LIMITED",
  },
  prefix: "rl:login:",
});

/**
 * Register: 5 requests per 15 minutes per IP
 */
export const registerLimiter = createRateLimiterMiddleware({
  windowMs: parseInt(process.env.RATE_LIMIT_REGISTER_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_REGISTER_MAX, 10) || 5, // 5 requests per 15 minutes per IP 
  message: {
    text: "Too many registration attempts. Please try again later.",
    errorCode: "RATE_LIMITED",
  },
  prefix: "rl:register:",
});

/**
 * Forgot Password: 3 requests per 15 minutes per IP
 */
export const forgotPasswordLimiter = createRateLimiterMiddleware({
  windowMs: parseInt(process.env.RATE_LIMIT_FORGOT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_FORGOT_MAX, 10) || 3,
  message: {
    text: "Too many password reset attempts. Please try again later.",
    errorCode: "RATE_LIMITED",
  },
  prefix: "rl:forgot:",
});

/**
 * Refresh Token: 30 requests per minute per IP
 */
export const refreshLimiter = createRateLimiterMiddleware({
  windowMs: parseInt(process.env.RATE_LIMIT_REFRESH_WINDOW_MS, 10) || 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_REFRESH_MAX, 10) || 30,
  message: {
    text: "Too many refresh attempts. Please try again shortly.",
    errorCode: "RATE_LIMITED",
  },
  prefix: "rl:refresh:",
});

/**
 * Reset Password: 3 requests per 15 minutes per IP
 */
export const resetPasswordLimiter = createRateLimiterMiddleware({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    text: "Too many password reset attempts. Please try again in 15 minutes.",
    errorCode: "RATE_LIMITED",
  },
  prefix: "rl:reset:",
});

/**
 * Verify Email: 10 requests per 15 minutes per IP
 */
export const verifyEmailLimiter = createRateLimiterMiddleware({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    text: "Too many verification attempts. Please try again in 15 minutes.",
    errorCode: "RATE_LIMITED",
  },
  prefix: "rl:verify:",
});

/**
 * Resend Verification: 3 requests per 15 minutes per IP
 */
export const resendVerificationLimiter = createRateLimiterMiddleware({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: {
    text: "Too many resend attempts. Please try again in 15 minutes.",
    errorCode: "RATE_LIMITED",
  },
  prefix: "rl:resend:",
});

/**
 * User Me: 60 requests per 15 minutes per IP
 */
export const userMeLimiter = createRateLimiterMiddleware({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: {
    text: "Too many requests. Please try again later.",
    errorCode: "RATE_LIMITED",
  },
  prefix: "rl:userme:",
});

/**
 * Health: 30 requests per 15 minutes per IP
 */
export const healthLimiter = createRateLimiterMiddleware({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: {
    text: "Too many health check requests.",
    errorCode: "RATE_LIMITED",
  },
  prefix: "rl:health:",
});

/**
 * Logout: 30 requests per 15 minutes per IP
 */
export const logoutLimiter = createRateLimiterMiddleware({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: {
    text: "Too many logout attempts. Please try again later.",
    errorCode: "RATE_LIMITED",
  },
  prefix: "rl:logout:",
});

/**
 * Update Profile: 10 requests per 15 minutes per IP
 */
export const updateProfileLimiter = createRateLimiterMiddleware({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    text: "Too many profile update attempts. Please try again later.",
    errorCode: "RATE_LIMITED",
  },
  prefix: "rl:updateprofile:",
});

/**
 * Email Confirm: 10 requests per 15 minutes per IP
 */
export const emailConfirmLimiter = createRateLimiterMiddleware({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    text: "Too many email confirmation attempts. Please try again later.",
    errorCode: "RATE_LIMITED",
  },
  prefix: "rl:email-confirm:",
});

/**
 * Email Change: 3 requests per hour per IP
 */
export const emailChangeLimiter = createRateLimiterMiddleware({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    text: "Too many email change requests. Please try again later.",
    errorCode: "RATE_LIMITED",
  },
  prefix: "rl:emailchange:",
});

/**
 * Change Password: 5 requests per 15 minutes per IP
 */
export const changePasswordLimiter = createRateLimiterMiddleware({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    text: "Too many password change attempts. Please try again later.",
    errorCode: "RATE_LIMITED",
  },
  prefix: "rl:changepw:",
});

/**
 * Toggle 2FA: 5 requests per 15 minutes per IP
 */
export const toggle2faLimiter = createRateLimiterMiddleware({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    text: "Too many 2FA toggle attempts. Please try again later.",
    errorCode: "RATE_LIMITED",
  },
  prefix: "rl:toggle2fa:",
});

/**
 * Verify 2FA: 10 requests per 15 minutes per IP
 */
export const verify2faLimiter = createRateLimiterMiddleware({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    text: "Too many verification attempts. Please try again later.",
    errorCode: "RATE_LIMITED",
  },
  prefix: "rl:verify2fa:",
});

/**
 * Resend 2FA: 3 requests per 15 minutes per IP
 */
export const resend2faLimiter = createRateLimiterMiddleware({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: {
    text: "Too many resend attempts. Please try again later.",
    errorCode: "RATE_LIMITED",
  },
  prefix: "rl:resend-2fa:",
});

/**
 * Avatar Upload: 10 requests per 15 minutes per IP
 */
export const avatarUploadLimiter = createRateLimiterMiddleware({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    text: "Too many upload attempts. Please try again later.",
    errorCode: "RATE_LIMITED",
  },
  prefix: "rl:avatar-upload:",
});

/**
 * Create Post: 10 requests per 15 minutes per IP
 */
export const createPostLimiter = createRateLimiterMiddleware({
  windowMs: parseInt(process.env.RATE_LIMIT_CREATE_POST_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: Math.max(parseInt(process.env.RATE_LIMIT_CREATE_POST_MAX, 10) || 10, 10),
  message: {
    text: "Too many posts created. Please try again later.",
    errorCode: "RATE_LIMITED",
  },
  prefix: "rl:createpost:",
});

/**
 * Friend Request: 3 requests per hour per IP
 */
export const friendRequestLimiter = createRateLimiterMiddleware({
  windowMs: parseInt(process.env.RATE_LIMIT_FRIEND_REQUEST_WINDOW_MS, 10) || 60 * 60 * 1000,
  max: Math.max(parseInt(process.env.RATE_LIMIT_FRIEND_REQUEST_MAX, 10) || 3, 3),
  message: {
    text: "Too many friend request attempts. Please try again later.",
    errorCode: "RATE_LIMITED",
  },
  prefix: "rl:friendrequest:",
});

/**
 * Friend Request Decision (accept/reject): 20 requests per 15 minutes per IP
 */
export const friendRequestDecisionLimiter = createRateLimiterMiddleware({
  windowMs: parseInt(process.env.RATE_LIMIT_FRIEND_REQUEST_DECISION_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: Math.max(parseInt(process.env.RATE_LIMIT_FRIEND_REQUEST_DECISION_MAX, 10) || 20, 20),
  message: {
    text: "Too many friend request decisions. Please try again later.",
    errorCode: "RATE_LIMITED",
  },
  prefix: "rl:frienddecision:",
});

/**
 * Friend List: 60 requests per 15 minutes per IP
 */
export const friendListLimiter = createRateLimiterMiddleware({
  windowMs: parseInt(process.env.RATE_LIMIT_FRIEND_LIST_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: Math.max(parseInt(process.env.RATE_LIMIT_FRIEND_LIST_MAX, 10) || 60, 60),
  message: {
    text: "Too many friendship list requests. Please try again later.",
    errorCode: "RATE_LIMITED",
  },
  prefix: "rl:friendlist:",
});

/**
 * Friend Request Cancel: 10 requests per 15 minutes per IP
 */
export const friendRequestCancelLimiter = createRateLimiterMiddleware({
  windowMs: parseInt(process.env.RATE_LIMIT_FRIEND_REQUEST_CANCEL_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: Math.max(parseInt(process.env.RATE_LIMIT_FRIEND_REQUEST_CANCEL_MAX, 10) || 10, 10),
  message: {
    text: "Too many friend request cancellations. Please try again later.",
    errorCode: "RATE_LIMITED",
  },
  prefix: "rl:friendcancel:",
});

/**
 * Unfriend: 20 requests per 15 minutes per IP
 */
export const unfriendLimiter = createRateLimiterMiddleware({
  windowMs: parseInt(process.env.RATE_LIMIT_UNFRIEND_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: Math.max(parseInt(process.env.RATE_LIMIT_UNFRIEND_MAX, 10) || 20, 20),
  message: {
    text: "Too many unfriend attempts. Please try again later.",
    errorCode: "RATE_LIMITED",
  },
  prefix: "rl:unfriend:",
});

/**
 * Feed: 60 requests per 15 minutes per IP
 */
export const feedLimiter = createRateLimiterMiddleware({
  windowMs: parseInt(process.env.RATE_LIMIT_FEED_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: Math.max(parseInt(process.env.RATE_LIMIT_FEED_MAX, 10) || 60, 60),
  message: {
    text: "Too many feed requests. Please try again later.",
    errorCode: "RATE_LIMITED",
  },
  prefix: "rl:feed:",
});

/**
 * Get Single Post: 60 requests per 15 minutes per IP
 */
export const getPostLimiter = createRateLimiterMiddleware({
  windowMs: parseInt(process.env.RATE_LIMIT_GET_POST_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: Math.max(parseInt(process.env.RATE_LIMIT_GET_POST_MAX, 10) || 60, 60),
  message: {
    text: "Too many post requests. Please try again later.",
    errorCode: "RATE_LIMITED",
  },
  prefix: "rl:getpost:",
});

/**
 * Update Post: 10 requests per 15 minutes per IP
 */
export const updatePostLimiter = createRateLimiterMiddleware({
  windowMs: parseInt(process.env.RATE_LIMIT_UPDATE_POST_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: Math.max(parseInt(process.env.RATE_LIMIT_UPDATE_POST_MAX, 10) || 10, 10),
  message: {
    text: "Too many post update attempts. Please try again later.",
    errorCode: "RATE_LIMITED",
  },
  prefix: "rl:updatepost:",
});

/**
 * Delete Post: 10 requests per 15 minutes per IP
 */
export const deletePostLimiter = createRateLimiterMiddleware({
  windowMs: parseInt(process.env.RATE_LIMIT_DELETE_POST_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: Math.max(parseInt(process.env.RATE_LIMIT_DELETE_POST_MAX, 10) || 10, 10),
  message: {
    text: "Too many post delete attempts. Please try again later.",
    errorCode: "RATE_LIMITED",
  },
  prefix: "rl:deletepost:",
});

/**
 * Get User Posts: 60 requests per 15 minutes per IP
 */
export const getUserPostsLimiter = createRateLimiterMiddleware({
  windowMs: parseInt(process.env.RATE_LIMIT_GET_USER_POSTS_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: Math.max(parseInt(process.env.RATE_LIMIT_GET_USER_POSTS_MAX, 10) || 60, 60),
  message: {
    text: "Too many user posts requests. Please try again later.",
    errorCode: "RATE_LIMITED",
  },
  prefix: "rl:getuserposts:",
});

/**
 * Create Comment: 20 requests per 15 minutes per IP
 */
export const createCommentLimiter = createRateLimiterMiddleware({
  windowMs: parseInt(process.env.RATE_LIMIT_CREATE_COMMENT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: Math.max(parseInt(process.env.RATE_LIMIT_CREATE_COMMENT_MAX, 10) || 20, 20),
  message: {
    text: "Too many comments created. Please try again later.",
    errorCode: "RATE_LIMITED",
  },
  prefix: "rl:createcomment:",
});

/**
 * Delete Comment: 30 requests per 15 minutes per IP
 */
export const deleteCommentLimiter = createRateLimiterMiddleware({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: {
    text: "Too many comment delete attempts. Please try again later.",
    errorCode: "RATE_LIMITED",
  },
  prefix: "rl:deletecomment:",
});
/**
 * Get Comments: 60 requests per 15 minutes per IP
 */
export const getCommentsLimiter = createRateLimiterMiddleware({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: {
    text: "Too many comments requests. Please try again later.",
    errorCode: "RATE_LIMITED",
  },
  prefix: "rl:getcomments:",
});

/**
 * Toggle Like: 30 requests per 15 minutes per IP
 */
export const toggleLikeLimiter = createRateLimiterMiddleware({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: {
    text: "Too many like actions. Please try again later.",
    errorCode: "RATE_LIMITED",
  },
  prefix: "rl:togglelike:",
});
