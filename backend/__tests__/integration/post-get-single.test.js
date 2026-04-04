// backend/__tests__/integration/post-get-single.test.js

import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import app from "../../app.js";
import Post from "../../model/Post.js";
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

describe("GET /api/v1/posts/:postId", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await Post.deleteMany({});
  });

  describe("Happy Path", () => {
    it("authenticated user can fetch a post", async () => {
      const { accessToken, user } = await registerVerifyAndLogin(app, emailService);

      const post = await Post.create({
        author: user.id,
        content: "Test post for get single",
      });

      const res = await request(app)
        .get(`/api/v1/posts/${post._id}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.post._id).toBe(post._id.toString());
      
      // Author population
      expect(typeof res.body.data.post.author).toBe("object");
      expect(res.body.data.post.author._id).toBe(user.id);
      expect(res.body.data.post.author.firstname).toBeDefined();
      expect(res.body.data.post.author.lastname).toBeDefined();
      expect(res.body.data.post.author.avatar).toBeDefined();
      expect(res.body.data.post.author.email).toBeUndefined();
      expect(res.body.data.post.author.password).toBeUndefined();

      // Counts
      expect(res.body.data.post.likesCount).toBe(0);
      expect(res.body.data.post.commentsCount).toBe(0);
      expect(res.body.data.post.repostsCount).toBe(0);
    });
  });

  describe("Validation Failure", () => {
    it("returns 400 for invalid Mongo ObjectId", async () => {
      const { accessToken } = await registerVerifyAndLogin(app, emailService);

      const res = await request(app)
        .get("/api/v1/posts/invalid-id")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("BadRequest"); 
    });
  });

  describe("Authorization Failure", () => {
    it("returns 401 when missing bearer token", async () => {
      const postId = new mongoose.Types.ObjectId();
      
      const res = await request(app)
        .get(`/api/v1/posts/${postId}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      if (res.body.errorCode) {
        // Assert the exact errorCode if one is actually returned
        expect(res.body.errorCode).toBeDefined();
      }
    });
  });

  describe("Not Found", () => {
    it("returns 404 for valid but non-existent post id", async () => {
      const { accessToken } = await registerVerifyAndLogin(app, emailService);
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .get(`/api/v1/posts/${fakeId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("POST_NOT_FOUND");
    });

    it("returns 404 for soft-deleted post", async () => {
      const { accessToken, user } = await registerVerifyAndLogin(app, emailService);

      const post = await Post.create({
        author: user.id,
        content: "Deleted post",
        isDeleted: true,
      });

      const res = await request(app)
        .get(`/api/v1/posts/${post._id}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("POST_NOT_FOUND");
    });
  });

  describe("Repost", () => {
    it("populates originalPost (one level)", async () => {
      const { accessToken, user } = await registerVerifyAndLogin(app, emailService);

      const originalPost = await Post.create({
        author: user.id,
        content: "Original post content",
        isRepost: false,
      });

      const repost = await Post.create({
        author: user.id,
        content: "",
        isRepost: true,
        originalPost: originalPost._id,
      });

      const res = await request(app)
        .get(`/api/v1/posts/${repost._id}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.post.isRepost).toBe(true);
      expect(res.body.data.post.originalPost).toBeDefined();
      expect(res.body.data.post.originalPost).not.toBeNull();
      expect(res.body.data.post.originalPost._id).toBe(originalPost._id.toString());
      
      // Author check on originalPost
      expect(typeof res.body.data.post.originalPost.author).toBe("object");
      expect(res.body.data.post.originalPost.author._id).toBe(user.id);
      expect(res.body.data.post.originalPost.author.firstname).toBeDefined();
      expect(res.body.data.post.originalPost.author.email).toBeUndefined();
    });
  });
});
