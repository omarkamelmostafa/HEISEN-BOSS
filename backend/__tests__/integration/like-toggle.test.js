// backend/__tests__/integration/like-toggle.test.js

import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import app from "../../app.js";
import Post from "../../model/Post.js";
import Like from "../../model/Like.js";
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

describe("POST /api/v1/posts/:postId/like", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await Post.deleteMany({});
    await Like.deleteMany({});
  });

  describe("Happy Path", () => {
    it("first toggle creates like", async () => {
      const { accessToken, user } = await registerVerifyAndLogin(app, emailService);

      // Create a post
      const createRes = await request(app)
        .post("/api/v1/posts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          content: "Test post for liking",
        });

      const postId = createRes.body.data.post._id;
      const userId = user.id;

      // Act: Toggle like on
      const res = await request(app)
        .post(`/api/v1/posts/${postId}/like`)
        .set("Authorization", `Bearer ${accessToken}`);

      // LAYER 1: HTTP status
      expect(res.status).toBe(200);

      // LAYER 2: Response body
      expect(res.body.success).toBe(true);
      expect(res.body.data.liked).toBe(true);
      expect(res.body.data.likesCount).toBe(1);

      // LAYER 3: DB state
      const likeDoc = await Like.findOne({ user: userId, post: postId });
      expect(likeDoc).toBeDefined();
      expect(likeDoc.user.toString()).toBe(userId);
      expect(likeDoc.post.toString()).toBe(postId);

      const postDoc = await Post.findById(postId);
      expect(postDoc.likesCount).toBe(1);
    });

    it("second toggle removes like", async () => {
      const { accessToken, user } = await registerVerifyAndLogin(app, emailService);

      // Create a post
      const createRes = await request(app)
        .post("/api/v1/posts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          content: "Test post for unliking",
        });

      const postId = createRes.body.data.post._id;
      const userId = user.id;

      // First toggle: create like
      await request(app)
        .post(`/api/v1/posts/${postId}/like`)
        .set("Authorization", `Bearer ${accessToken}`);

      // Act: Second toggle - remove like
      const res = await request(app)
        .post(`/api/v1/posts/${postId}/like`)
        .set("Authorization", `Bearer ${accessToken}`);

      // LAYER 1: HTTP status
      expect(res.status).toBe(200);

      // LAYER 2: Response body
      expect(res.body.success).toBe(true);
      expect(res.body.data.liked).toBe(false);
      expect(res.body.data.likesCount).toBe(0);

      // LAYER 3: DB state
      const likeDoc = await Like.findOne({ user: userId, post: postId });
      expect(likeDoc).toBeNull();

      const postDoc = await Post.findById(postId);
      expect(postDoc.likesCount).toBe(0);
    });
  });

  describe("Validation Failure", () => {
    it("invalid postId returns 400", async () => {
      const { accessToken } = await registerVerifyAndLogin(app, emailService);

      // Act: POST with invalid postId
      const res = await request(app)
        .post("/api/v1/posts/not-a-mongo-id/like")
        .set("Authorization", `Bearer ${accessToken}`);

      // LAYER 1: HTTP status
      expect(res.status).toBe(400);

      // LAYER 2: Response body
      expect(res.body.success).toBe(false);

      // LAYER 3: DB state - no like created
      const likeCount = await Like.countDocuments({});
      expect(likeCount).toBe(0);
    });
  });

  describe("Authentication Failure", () => {
    it("missing token returns 401", async () => {
      const postId = new mongoose.Types.ObjectId();

      // Act: POST without Authorization header
      const res = await request(app)
        .post(`/api/v1/posts/${postId}/like`);

      // LAYER 1: HTTP status
      expect(res.status).toBe(401);

      // LAYER 2: Response body
      expect(res.body.success).toBe(false);

      // LAYER 3: DB state - no like created
      const likeCount = await Like.countDocuments({});
      expect(likeCount).toBe(0);
    });
  });

  describe("Not Found", () => {
    it("non-existent post returns 404", async () => {
      const { accessToken } = await registerVerifyAndLogin(app, emailService);

      // Generate a valid ObjectId with no Post doc
      const fakePostId = new mongoose.Types.ObjectId();

      // Act: POST with valid but non-existent postId
      const res = await request(app)
        .post(`/api/v1/posts/${fakePostId}/like`)
        .set("Authorization", `Bearer ${accessToken}`);

      // LAYER 1: HTTP status
      expect(res.status).toBe(404);

      // LAYER 2: Response body
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("POST_NOT_FOUND");

      // LAYER 3: DB state - no like created
      const likeDoc = await Like.findOne({ post: fakePostId });
      expect(likeDoc).toBeNull();
    });

    it("soft-deleted post returns 404", async () => {
      const { accessToken, user } = await registerVerifyAndLogin(app, emailService);

      // Create a soft-deleted post directly in DB
      const deletedPost = await Post.create({
        author: user.id,
        content: "Deleted post content",
        isDeleted: true,
      });

      // Act: POST to soft-deleted post
      const res = await request(app)
        .post(`/api/v1/posts/${deletedPost._id}/like`)
        .set("Authorization", `Bearer ${accessToken}`);

      // LAYER 1: HTTP status
      expect(res.status).toBe(404);

      // LAYER 2: Response body
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("POST_NOT_FOUND");

      // LAYER 3: DB state - no like created
      const likeDoc = await Like.findOne({ post: deletedPost._id });
      expect(likeDoc).toBeNull();
    });
  });
});
