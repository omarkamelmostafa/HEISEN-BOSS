// backend/__tests__/integration/comment-delete.test.js

import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import app from "../../app.js";
import Post from "../../model/Post.js";
import Comment from "../../model/Comment.js";
import User from "../../model/User.js";
import Like from "../../model/Like.js";
import RefreshToken from "../../model/RefreshToken.js";
import emailService from "../../services/email/email.service.js";
import { registerVerifyAndLogin } from "./helpers.js";

// Mock EmailService
vi.mock("../../services/email/email.service.js", () => {
  const mockInstance = {
    sendVerificationEmail: vi.fn().mockResolvedValue({ success: true }),
    sendPasswordResetEmail: vi.fn().mockResolvedValue({ success: true }),
    sendWelcomeEmail: vi.fn().mockResolvedValue({ success: true }),
    sendResetSuccessEmail: vi.fn().mockResolvedValue({ success: true }),
  };
  return {
    EmailService: vi.fn().mockImplementation(function () {
      return mockInstance;
    }),
    default: mockInstance,
  };
});

vi.mock("../../services/cloudinaryService.js", () => ({
  CloudinaryService: {
    createUserFolder: vi.fn().mockResolvedValue({ success: true })
  }
}));

describe("DELETE /api/v1/posts/:postId/comments/:commentId", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await Post.deleteMany({});
    await Comment.deleteMany({});
    await User.deleteMany({});
    await Like.deleteMany({});
    await RefreshToken.deleteMany({});
  });

  describe("Happy Path", () => {
    it("author can soft-delete own comment and decrements post commentsCount", async () => {
      const { accessToken, user } = await registerVerifyAndLogin(app, emailService);

      // Create a post with commentsCount: 1
      const post = await Post.create({
        author: user.id,
        content: "Test post for comment deletion",
        commentsCount: 1,
      });

      // Create a comment by the user
      const comment = await Comment.create({
        author: user.id,
        post: post._id,
        content: "Comment to be deleted",
        isDeleted: false,
      });

      // Act: Delete the comment
      const res = await request(app)
        .delete(`/api/v1/posts/${post._id}/comments/${comment._id}`)
        .set("Authorization", `Bearer ${accessToken}`);

      // LAYER 1: HTTP status
      expect(res.status).toBe(200);

      // LAYER 2: Response body
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Comment deleted successfully.");

      // LAYER 3: DB state - comment soft-deleted
      const dbComment = await Comment.findById(comment._id);
      expect(dbComment.isDeleted).toBe(true);
      expect(dbComment.deletedBy.toString()).toBe(user.id);
      expect(dbComment.deletedAt).toBeInstanceOf(Date);

      // LAYER 3: DB state - post commentsCount decremented
      const dbPost = await Post.findById(post._id);
      expect(dbPost.commentsCount).toBe(0);
    });
  });

  describe("Authorization Failure", () => {
    it("non-author gets 403 with COMMENT_DELETE_FORBIDDEN", async () => {
      // Create user A (comment author)
      const { accessToken: authorToken, user: author } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "author@test.com" }
      );

      // Create user B (non-author)
      const { accessToken: otherToken } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "otheruser@test.com" }
      );

      // Create a post by author
      const post = await Post.create({
        author: author.id,
        content: "Test post",
        commentsCount: 1,
      });

      // Create a comment by user A
      const comment = await Comment.create({
        author: author.id,
        post: post._id,
        content: "Author's comment",
        isDeleted: false,
      });

      // Act: Attempt to delete as user B
      const res = await request(app)
        .delete(`/api/v1/posts/${post._id}/comments/${comment._id}`)
        .set("Authorization", `Bearer ${otherToken}`);

      // LAYER 1: HTTP status
      expect(res.status).toBe(403);

      // LAYER 2: Response body
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("COMMENT_DELETE_FORBIDDEN");

      // LAYER 3: DB state unchanged
      const dbComment = await Comment.findById(comment._id);
      expect(dbComment.isDeleted).toBe(false);
      expect(dbComment.deletedBy).toBeNull();

      const dbPost = await Post.findById(post._id);
      expect(dbPost.commentsCount).toBe(1);
    });
  });

  describe("Auth Failure", () => {
    it("returns 401 when no token is provided", async () => {
      const { accessToken, user } = await registerVerifyAndLogin(app, emailService);

      // Create a post
      const post = await Post.create({
        author: user.id,
        content: "Test post",
        commentsCount: 1,
      });

      // Create a comment
      const comment = await Comment.create({
        author: user.id,
        post: post._id,
        content: "Comment to delete",
        isDeleted: false,
      });

      // Act: Delete without token
      const res = await request(app)
        .delete(`/api/v1/posts/${post._id}/comments/${comment._id}`);

      // Assert
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);

      // Verify comment not deleted
      const dbComment = await Comment.findById(comment._id);
      expect(dbComment.isDeleted).toBe(false);
    });
  });

  describe("Validation Failure", () => {
    it("returns 400 for invalid postId format", async () => {
      const { accessToken } = await registerVerifyAndLogin(app, emailService);

      const res = await request(app)
        .delete("/api/v1/posts/invalid-post-id/comments/507f1f77bcf86cd799439011")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("BadRequest");
    });

    it("returns 400 for invalid commentId format", async () => {
      const { accessToken, user } = await registerVerifyAndLogin(app, emailService);

      // Create a post
      const post = await Post.create({
        author: user.id,
        content: "Test post",
        commentsCount: 0,
      });

      const res = await request(app)
        .delete(`/api/v1/posts/${post._id}/comments/invalid-id`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("BadRequest");
    });
  });

  describe("Not Found", () => {
    it("returns 404 when comment is already soft-deleted", async () => {
      const { accessToken, user } = await registerVerifyAndLogin(app, emailService);

      // Create a post
      const post = await Post.create({
        author: user.id,
        content: "Test post",
        commentsCount: 0,
      });

      // Create a soft-deleted comment
      const comment = await Comment.create({
        author: user.id,
        post: post._id,
        content: "Already deleted comment",
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: user.id,
      });

      const res = await request(app)
        .delete(`/api/v1/posts/${post._id}/comments/${comment._id}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("COMMENT_NOT_FOUND");
    });

    it("returns 404 when comment does not exist", async () => {
      const { accessToken, user } = await registerVerifyAndLogin(app, emailService);

      // Create a post
      const post = await Post.create({
        author: user.id,
        content: "Test post",
        commentsCount: 0,
      });

      const fakeCommentId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .delete(`/api/v1/posts/${post._id}/comments/${fakeCommentId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("COMMENT_NOT_FOUND");
    });

    it("returns 404 when comment belongs to different post", async () => {
      const { accessToken, user } = await registerVerifyAndLogin(app, emailService);

      // Create two posts
      const post1 = await Post.create({
        author: user.id,
        content: "Test post 1",
        commentsCount: 1,
      });

      const post2 = await Post.create({
        author: user.id,
        content: "Test post 2",
        commentsCount: 0,
      });

      // Create a comment on post1
      const comment = await Comment.create({
        author: user.id,
        post: post1._id,
        content: "Comment on post 1",
        isDeleted: false,
      });

      // Act: Try to delete comment using post2's ID
      const res = await request(app)
        .delete(`/api/v1/posts/${post2._id}/comments/${comment._id}`)
        .set("Authorization", `Bearer ${accessToken}`);

      // Assert
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("COMMENT_NOT_FOUND");

      // Verify comment not deleted
      const dbComment = await Comment.findById(comment._id);
      expect(dbComment.isDeleted).toBe(false);
    });
  });
});
