// backend/__tests__/integration/comment-create.test.js

import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import app from "../../app.js";
import Post from "../../model/Post.js";
import Comment from "../../model/Comment.js";
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

describe("POST /api/v1/posts/:postId/comments", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await Post.deleteMany({});
    await Comment.deleteMany({});
  });

  describe("Happy Path", () => {
    it("creates a comment with populated author and increments post commentsCount", async () => {
      const { accessToken, user } = await registerVerifyAndLogin(app, emailService);

      // Create a post first
      const createPostRes = await request(app)
        .post("/api/v1/posts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          content: "Test post for comments",
        });

      expect(createPostRes.status).toBe(201);
      const postId = createPostRes.body.data.post._id;
      const initialCommentsCount = createPostRes.body.data.post.commentsCount || 0;

      // Create a comment
      const commentContent = "This is a test comment";
      const createCommentRes = await request(app)
        .post(`/api/v1/posts/${postId}/comments`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          content: commentContent,
        });

      // Assert HTTP status
      expect(createCommentRes.status).toBe(201);

      // Assert response structure
      expect(createCommentRes.body.success).toBe(true);
      expect(createCommentRes.body.data.comment.content).toBe(commentContent);

      // Assert author is populated (object, not ObjectId string)
      expect(typeof createCommentRes.body.data.comment.author).toBe("object");
      expect(createCommentRes.body.data.comment.author).toHaveProperty("firstname");
      expect(createCommentRes.body.data.comment.author).toHaveProperty("lastname");
      expect(createCommentRes.body.data.comment.author.firstname).toBe(user.firstname);
      expect(createCommentRes.body.data.comment.author.lastname).toBe(user.lastname);

      // Assert DB state: Comment exists
      const commentId = createCommentRes.body.data.comment._id;
      const dbComment = await Comment.findById(commentId);
      expect(dbComment).not.toBeNull();
      expect(dbComment.content).toBe(commentContent);
      expect(dbComment.author.toString()).toBe(user.id);
      expect(dbComment.post.toString()).toBe(postId);

      // Assert DB state: Post commentsCount incremented
      const dbPost = await Post.findById(postId);
      expect(dbPost.commentsCount).toBe(initialCommentsCount + 1);
    });
  });

  describe("Validation Failure", () => {
    it("returns 400 when content is empty", async () => {
      const { accessToken } = await registerVerifyAndLogin(app, emailService);

      // Create a post first
      const createPostRes = await request(app)
        .post("/api/v1/posts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          content: "Test post for comments",
        });

      const postId = createPostRes.body.data.post._id;

      // Try to create comment with empty content
      const createCommentRes = await request(app)
        .post(`/api/v1/posts/${postId}/comments`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          content: "",
        });

      // Assert HTTP status
      expect(createCommentRes.status).toBe(400);

      // Assert response structure
      expect(createCommentRes.body.success).toBe(false);

      // Assert DB state: no comment created
      const commentsCount = await Comment.countDocuments({ post: postId });
      expect(commentsCount).toBe(0);

      // Assert DB state: post commentsCount unchanged
      const dbPost = await Post.findById(postId);
      expect(dbPost.commentsCount).toBe(0);
    });
  });

  describe("Authorization Failure", () => {
    it("returns 401 when no token is provided", async () => {
      // Create a valid ObjectId for the postId parameter
      const postId = new mongoose.Types.ObjectId().toString();

      // Try to create comment without token
      const createCommentRes = await request(app)
        .post(`/api/v1/posts/${postId}/comments`)
        .send({
          content: "This should fail",
        });

      // Assert HTTP status
      expect(createCommentRes.status).toBe(401);

      // Assert DB state: no comment created
      const commentsCount = await Comment.countDocuments({});
      expect(commentsCount).toBe(0);
    });

    it("returns 401 when invalid token is provided", async () => {
      const postId = new mongoose.Types.ObjectId().toString();

      // Try to create comment with invalid token
      const createCommentRes = await request(app)
        .post(`/api/v1/posts/${postId}/comments`)
        .set("Authorization", "Bearer invalid-token")
        .send({
          content: "This should fail",
        });

      // Assert HTTP status
      expect(createCommentRes.status).toBe(401);

      // Assert DB state: no comment created
      const commentsCount = await Comment.countDocuments({});
      expect(commentsCount).toBe(0);
    });
  });
});
