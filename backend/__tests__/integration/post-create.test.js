// backend/__tests__/integration/post-create.test.js

import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
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

describe("POST /api/v1/posts", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await Post.deleteMany({});
  });

  describe("Happy Path", () => {
    it("creates a post for an authenticated user", async () => {
      const { accessToken, user } = await registerVerifyAndLogin(app, emailService);

      const res = await request(app)
        .post("/api/v1/posts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          content: "Hello from integration test",
        });

      // LAYER 1: HTTP status
      expect(res.status).toBe(201);

      // LAYER 2: Response body
      expect(res.body.success).toBe(true);
      expect(res.body.data.post.content).toBe("Hello from integration test");
      expect(res.body.data.post.author).toBeDefined();

      // LAYER 3: DB state
      const createdPost = await Post.findById(res.body.data.post._id);
      expect(createdPost).toBeDefined();
      expect(createdPost.author.toString()).toBe(user.id);
      expect(createdPost.content).toBe("Hello from integration test");
      expect(createdPost.isDeleted).toBe(false);
      expect(createdPost.likesCount).toBe(0);
      expect(createdPost.commentsCount).toBe(0);
      expect(createdPost.repostsCount).toBe(0);
    });

    it("creates a post with optional image URL", async () => {
      const { accessToken, user } = await registerVerifyAndLogin(app, emailService);

      const res = await request(app)
        .post("/api/v1/posts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          content: "Post with image",
          image: "https://example.com/image.jpg",
        });

      // LAYER 1: HTTP status
      expect(res.status).toBe(201);

      // LAYER 2: Response body
      expect(res.body.success).toBe(true);
      expect(res.body.data.post.content).toBe("Post with image");
      expect(res.body.data.post.image).toBe("https://example.com/image.jpg");

      // LAYER 3: DB state
      const createdPost = await Post.findById(res.body.data.post._id);
      expect(createdPost.image).toBe("https://example.com/image.jpg");
    });
  });

  describe("Validation Failure", () => {
    it("rejects post creation with empty content", async () => {
      const { accessToken } = await registerVerifyAndLogin(app, emailService);

      const res = await request(app)
        .post("/api/v1/posts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          content: "",
        });

      // LAYER 1: HTTP status
      expect(res.status).toBe(400);

      // LAYER 2: Response body
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("BadRequest");

      // LAYER 3: DB state
      const postCount = await Post.countDocuments();
      expect(postCount).toBe(0);
    });

    it("rejects post creation with missing content", async () => {
      const { accessToken } = await registerVerifyAndLogin(app, emailService);

      const res = await request(app)
        .post("/api/v1/posts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          image: "https://example.com/image.jpg",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("BadRequest");
    });

    it("rejects post creation with invalid image URL", async () => {
      const { accessToken } = await registerVerifyAndLogin(app, emailService);

      const res = await request(app)
        .post("/api/v1/posts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          content: "Test content",
          image: "not-a-valid-url",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("Authorization Failure", () => {
    it("rejects post creation without token", async () => {
      const res = await request(app)
        .post("/api/v1/posts")
        .send({
          content: "Hello from unauthenticated user",
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("rejects post creation with invalid token", async () => {
      const res = await request(app)
        .post("/api/v1/posts")
        .set("Authorization", "Bearer invalid-token")
        .send({
          content: "Hello with bad token",
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe("Post JSON Response", () => {
    it("does not expose imagePublicId in response", async () => {
      const { accessToken } = await registerVerifyAndLogin(app, emailService);

      const res = await request(app)
        .post("/api/v1/posts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          content: "Test content",
        });

      expect(res.status).toBe(201);
      expect(res.body.data.post).not.toHaveProperty("imagePublicId");
    });
  });
});
