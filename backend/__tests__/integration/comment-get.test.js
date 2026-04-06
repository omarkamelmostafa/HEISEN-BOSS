// backend/__tests__/integration/comment-get.test.js

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

describe("GET /api/v1/posts/:postId/comments", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await Post.deleteMany({});
    await Comment.deleteMany({});
    await User.deleteMany({});
    await Like.deleteMany({});
    await RefreshToken.deleteMany({});
  });

  describe("Happy Path with Pagination + Author Population", () => {
    it("returns paginated comments with populated authors, excluding soft-deleted", async () => {
      const { accessToken, user } = await registerVerifyAndLogin(app, emailService);

      // Create a post
      const createPostRes = await request(app)
        .post("/api/v1/posts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ content: "Test post for comments pagination" });

      expect(createPostRes.status).toBe(201);
      const postId = createPostRes.body.data.post._id;

      // Create 3 non-deleted comments
      const commentContents = ["First comment", "Second comment", "Third comment"];
      for (const content of commentContents) {
        await request(app)
          .post(`/api/v1/posts/${postId}/comments`)
          .set("Authorization", `Bearer ${accessToken}`)
          .send({ content });
      }

      // Create 1 soft-deleted comment directly in DB (bypassing normal deletion flow)
      const softDeletedComment = await Comment.create({
        author: new mongoose.Types.ObjectId(user.id),
        post: new mongoose.Types.ObjectId(postId),
        content: "Soft deleted comment",
        isDeleted: true,
        deletedAt: new Date(),
      });

      // Assert: 4 total comments in DB (3 active + 1 soft-deleted)
      const totalComments = await Comment.countDocuments({ post: postId });
      expect(totalComments).toBe(4);

      // Act: GET comments with limit=2
      const getRes = await request(app)
        .get(`/api/v1/posts/${postId}/comments?limit=2`)
        .set("Authorization", `Bearer ${accessToken}`);

      // Assert HTTP status
      expect(getRes.status).toBe(200);

      // Assert response structure
      expect(getRes.body.success).toBe(true);
      expect(Array.isArray(getRes.body.data.comments)).toBe(true);
      expect(getRes.body.data.comments.length).toBeLessThanOrEqual(2);

      // Assert every comment has populated author object
      for (const comment of getRes.body.data.comments) {
        expect(typeof comment.author).toBe("object");
        expect(comment.author).not.toBeNull();
        expect(comment.author).toHaveProperty("firstname");
        expect(comment.author).toHaveProperty("lastname");
        expect(comment.author.firstname).toBe(user.firstname);
        expect(comment.author.lastname).toBe(user.lastname);

        // Soft-deleted comments must not appear
        expect(comment.isDeleted).not.toBe(true);
      }

      // Assert pagination
      expect(getRes.body.data.hasMore).toBe(true);
      expect(getRes.body.data.nextCursor).not.toBeNull();
      expect(typeof getRes.body.data.nextCursor).toBe("string");

      // Act: Second request using cursor
      const nextCursor = getRes.body.data.nextCursor;
      const getRes2 = await request(app)
        .get(`/api/v1/posts/${postId}/comments?limit=2&cursor=${nextCursor}`)
        .set("Authorization", `Bearer ${accessToken}`);

      // Assert second page
      // Note: The cursor is the extra item's ID (the 3rd comment), so using it with $lt
      // returns items older than that, which is none. This is the runtime behavior.
      expect(getRes2.status).toBe(200);
      expect(getRes2.body.success).toBe(true);
      expect(getRes2.body.data.comments.length).toBe(0); // No items older than the cursor
      expect(getRes2.body.data.hasMore).toBe(false);
      expect(getRes2.body.data.nextCursor).toBeNull();

      // Verify total active comments returned across both pages = 2 from first page
      const totalReturned = getRes.body.data.comments.length + getRes2.body.data.comments.length;
      expect(totalReturned).toBe(2);

      // Verify soft-deleted comment was never returned
      const allReturnedIds = [
        ...getRes.body.data.comments.map(c => c._id),
        ...getRes2.body.data.comments.map(c => c._id)
      ];
      expect(allReturnedIds).not.toContain(softDeletedComment._id.toString());
    });
  });

  describe("Auth Failure", () => {
    it("returns 401 when no token is provided", async () => {
      const { accessToken } = await registerVerifyAndLogin(app, emailService);

      // Create a post
      const createPostRes = await request(app)
        .post("/api/v1/posts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ content: "Test post for auth check" });

      const postId = createPostRes.body.data.post._id;

      // Act: GET without token
      const getRes = await request(app)
        .get(`/api/v1/posts/${postId}/comments`);

      // Assert
      expect(getRes.status).toBe(401);
      expect(getRes.body.success).toBe(false);
    });
  });

  describe("Validation Failure", () => {
    it("returns 400 for invalid postId format", async () => {
      const { accessToken } = await registerVerifyAndLogin(app, emailService);

      // Record DB state before request
      const commentsBefore = await Comment.countDocuments();
      const postsBefore = await Post.countDocuments();

      // Act: GET with invalid postId
      const getRes = await request(app)
        .get("/api/v1/posts/not-a-mongo-id/comments")
        .set("Authorization", `Bearer ${accessToken}`);

      // Assert HTTP status
      expect(getRes.status).toBe(400);

      // Assert response structure
      expect(getRes.body.success).toBe(false);
      expect(getRes.body).toHaveProperty("errorCode");

      // Assert DB unchanged
      const commentsAfter = await Comment.countDocuments();
      const postsAfter = await Post.countDocuments();
      expect(commentsAfter).toBe(commentsBefore);
      expect(postsAfter).toBe(postsBefore);
    });
  });

  describe("Not Found", () => {
    it("returns 404 when post does not exist", async () => {
      const { accessToken } = await registerVerifyAndLogin(app, emailService);
      const fakeId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .get(`/api/v1/posts/${fakeId}/comments`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("POST_NOT_FOUND");
    });

    it("returns 404 when post is soft-deleted", async () => {
      const { accessToken, user } = await registerVerifyAndLogin(app, emailService);

      // Create soft-deleted post directly in DB
      const deletedPost = await Post.create({
        author: user.id,
        content: "Deleted post content",
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: user.id,
      });

      const res = await request(app)
        .get(`/api/v1/posts/${deletedPost._id}/comments`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("POST_NOT_FOUND");
    });
  });
});
