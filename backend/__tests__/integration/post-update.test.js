// backend/__tests__/integration/post-update.test.js

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

describe("PATCH /api/v1/posts/:postId", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await Post.deleteMany({});
  });

  describe("Happy Path", () => {
    it("author can update own post content", async () => {
      const { accessToken, user } = await registerVerifyAndLogin(app, emailService);

      // Create original post
      const createRes = await request(app)
        .post("/api/v1/posts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          content: "Original content",
        });

      const postId = createRes.body.data.post._id;

      // Update the post
      const updateRes = await request(app)
        .patch(`/api/v1/posts/${postId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          content: "Updated content",
        });

      // LAYER 1: HTTP status
      expect(updateRes.status).toBe(200);

      // LAYER 2: Response body
      expect(updateRes.body.success).toBe(true);
      expect(updateRes.body.data.post.content).toBe("Updated content");
      expect(updateRes.body.data.post.author).toBeDefined();

      // LAYER 3: DB state
      const updatedPost = await Post.findById(postId);
      expect(updatedPost).toBeDefined();
      expect(updatedPost.author.toString()).toBe(user.id);
      expect(updatedPost.content).toBe("Updated content");
      expect(updatedPost.isDeleted).toBe(false);
    });

    it("author can update own post partially without changing omitted image", async () => {
      const { accessToken, user } = await registerVerifyAndLogin(app, emailService);

      // Create original post with image
      const createRes = await request(app)
        .post("/api/v1/posts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          content: "Original content",
          image: "https://example.com/original-image.jpg",
        });

      const postId = createRes.body.data.post._id;

      // Update only content, omit image
      const updateRes = await request(app)
        .patch(`/api/v1/posts/${postId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          content: "Updated content only",
        });

      // LAYER 1: HTTP status
      expect(updateRes.status).toBe(200);

      // LAYER 2: Response body
      expect(updateRes.body.success).toBe(true);
      expect(updateRes.body.data.post.content).toBe("Updated content only");
      expect(updateRes.body.data.post.image).toBe("https://example.com/original-image.jpg");

      // LAYER 3: DB state - verify image unchanged
      const updatedPost = await Post.findById(postId);
      expect(updatedPost.content).toBe("Updated content only");
      expect(updatedPost.image).toBe("https://example.com/original-image.jpg");
    });
  });

  describe("Authorization Failure", () => {
    it("non-author gets 403", async () => {
      // Create user A (author)
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

      // Create post as user A
      const createRes = await request(app)
        .post("/api/v1/posts")
        .set("Authorization", `Bearer ${authorToken}`)
        .send({
          content: "Author's original content",
        });

      const postId = createRes.body.data.post._id;

      // Attempt to update as user B
      const updateRes = await request(app)
        .patch(`/api/v1/posts/${postId}`)
        .set("Authorization", `Bearer ${otherToken}`)
        .send({
          content: "Malicious update attempt",
        });

      // LAYER 1: HTTP status
      expect(updateRes.status).toBe(403);

      // LAYER 2: Response body
      expect(updateRes.body.success).toBe(false);
      expect(updateRes.body.errorCode).toBe("POST_UPDATE_FORBIDDEN");

      // LAYER 3: DB state - verify post unchanged
      const unchangedPost = await Post.findById(postId);
      expect(unchangedPost.content).toBe("Author's original content");
      expect(unchangedPost.author.toString()).toBe(author.id);
    });

    it("missing token returns 401", async () => {
      const postId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .patch(`/api/v1/posts/${postId}`)
        .send({
          content: "Update without auth",
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe("Not Found", () => {
    it("valid but non-existent post id returns 404", async () => {
      const { accessToken } = await registerVerifyAndLogin(app, emailService);
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .patch(`/api/v1/posts/${fakeId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          content: "Update non-existent post",
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("POST_NOT_FOUND");
    });

    it("soft-deleted post returns 404", async () => {
      const { accessToken, user } = await registerVerifyAndLogin(app, emailService);

      // Create soft-deleted post directly in DB
      const deletedPost = await Post.create({
        author: user.id,
        content: "Deleted post content",
        isDeleted: true,
      });

      const res = await request(app)
        .patch(`/api/v1/posts/${deletedPost._id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          content: "Attempt to update deleted post",
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("POST_NOT_FOUND");
    });
  });

  describe("Validation Failure", () => {
    it("validation failure for invalid postId returns 400", async () => {
      const { accessToken } = await registerVerifyAndLogin(app, emailService);

      const res = await request(app)
        .patch("/api/v1/posts/invalid-id")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          content: "Update with invalid id",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("BadRequest");
    });

    it("empty payload returns 400 + NO_FIELDS_TO_UPDATE", async () => {
      const { accessToken, user } = await registerVerifyAndLogin(app, emailService);

      // Create a post first
      const createRes = await request(app)
        .post("/api/v1/posts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          content: "Original content",
        });

      const postId = createRes.body.data.post._id;

      // Attempt update with empty payload
      const res = await request(app)
        .patch(`/api/v1/posts/${postId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("NO_FIELDS_TO_UPDATE");

      // Verify post unchanged in DB
      const unchangedPost = await Post.findById(postId);
      expect(unchangedPost.content).toBe("Original content");
    });
  });

  describe("Field Whitelist", () => {
    it("forbidden fields do not mutate protected fields", async () => {
      const { accessToken, user } = await registerVerifyAndLogin(app, emailService);

      // Create original post
      const createRes = await request(app)
        .post("/api/v1/posts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          content: "Original content",
        });

      const postId = createRes.body.data.post._id;
      const originalAuthorId = user.id;

      // Attempt to update with forbidden fields
      const res = await request(app)
        .patch(`/api/v1/posts/${postId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          content: "Valid content update",
          author: new mongoose.Types.ObjectId(), // Forbidden field
          likesCount: 999, // Forbidden field
          isDeleted: true, // Forbidden field
        });

      // LAYER 1: HTTP status - should succeed because content is valid
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // LAYER 2: Response body - verify only content changed
      expect(res.body.data.post.content).toBe("Valid content update");
      expect(res.body.data.post.author._id).toBe(originalAuthorId);
      expect(res.body.data.post.likesCount).toBe(0);
      expect(res.body.data.post.isDeleted).toBe(false);

      // LAYER 3: DB state - verify forbidden fields unchanged
      const updatedPost = await Post.findById(postId);
      expect(updatedPost.content).toBe("Valid content update");
      expect(updatedPost.author.toString()).toBe(originalAuthorId);
      expect(updatedPost.likesCount).toBe(0);
      expect(updatedPost.isDeleted).toBe(false);
    });
  });

  describe("Response Contract Verification", () => {
    it("returns populated author with correct fields", async () => {
      const { accessToken, user } = await registerVerifyAndLogin(app, emailService);

      // Create post
      const createRes = await request(app)
        .post("/api/v1/posts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          content: "Original content",
        });

      const postId = createRes.body.data.post._id;

      // Update post
      const res = await request(app)
        .patch(`/api/v1/posts/${postId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          content: "Updated content",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify author population
      expect(typeof res.body.data.post.author).toBe("object");
      expect(res.body.data.post.author._id).toBe(user.id);
      expect(res.body.data.post.author.firstname).toBeDefined();
      expect(res.body.data.post.author.lastname).toBeDefined();
      expect(res.body.data.post.author.avatar).toBeDefined();
      expect(res.body.data.post.author.email).toBeUndefined();
      expect(res.body.data.post.author.password).toBeUndefined();

      // Verify count fields
      expect(res.body.data.post.likesCount).toBe(0);
      expect(res.body.data.post.commentsCount).toBe(0);
      expect(res.body.data.post.repostsCount).toBe(0);
    });
  });
});
