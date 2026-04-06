// backend/__tests__/integration/post-delete.test.js

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

describe("DELETE /api/v1/posts/:postId", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await Post.deleteMany({});
  });

  describe("Happy Path", () => {
    it("author can delete own post", async () => {
      const { accessToken, user } = await registerVerifyAndLogin(app, emailService);

      // Create original post
      const createRes = await request(app)
        .post("/api/v1/posts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          content: "Original content",
        });

      const postId = createRes.body.data.post._id;

      // Delete the post
      const deleteRes = await request(app)
        .delete(`/api/v1/posts/${postId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      // LAYER 1: HTTP status
      expect(deleteRes.status).toBe(200);

      // LAYER 2: Response body
      expect(deleteRes.body.success).toBe(true);
      expect(deleteRes.body.message).toBe("Post deleted successfully.");
      expect(deleteRes.body.data).toBeUndefined();

      // LAYER 3: DB state
      const deletedPost = await Post.findById(postId);
      expect(deletedPost).toBeDefined();
      expect(deletedPost.author.toString()).toBe(user.id);
      expect(deletedPost.isDeleted).toBe(true);
      expect(deletedPost.deletedAt).toBeInstanceOf(Date);
      expect(deletedPost.deletedBy.toString()).toBe(user.id);
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

      // Attempt to delete as user B
      const deleteRes = await request(app)
        .delete(`/api/v1/posts/${postId}`)
        .set("Authorization", `Bearer ${otherToken}`);

      // LAYER 1: HTTP status
      expect(deleteRes.status).toBe(403);

      // LAYER 2: Response body
      expect(deleteRes.body.success).toBe(false);
      expect(deleteRes.body.errorCode).toBe("POST_DELETE_FORBIDDEN");

      // LAYER 3: DB state - verify post not deleted
      const unchangedPost = await Post.findById(postId);
      expect(unchangedPost.content).toBe("Author's original content");
      expect(unchangedPost.author.toString()).toBe(author.id);
      expect(unchangedPost.isDeleted).toBe(false);
    });

    it("missing token returns 401", async () => {
      const postId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .delete(`/api/v1/posts/${postId}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe("Not Found", () => {
    it("valid but non-existent post id returns 404", async () => {
      const { accessToken } = await registerVerifyAndLogin(app, emailService);
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .delete(`/api/v1/posts/${fakeId}`)
        .set("Authorization", `Bearer ${accessToken}`);

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
        .delete(`/api/v1/posts/${deletedPost._id}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("POST_NOT_FOUND");
    });
  });

  describe("Validation Failure", () => {
    it("validation failure for invalid postId returns 400", async () => {
      const { accessToken } = await registerVerifyAndLogin(app, emailService);

      const res = await request(app)
        .delete("/api/v1/posts/invalid-id")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("BadRequest");
    });
  });

  describe("Response Contract Verification", () => {
    it("returns success message only, no data field", async () => {
      const { accessToken, user } = await registerVerifyAndLogin(app, emailService);

      // Create post
      const createRes = await request(app)
        .post("/api/v1/posts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          content: "Original content",
        });

      const postId = createRes.body.data.post._id;

      // Delete post
      const res = await request(app)
        .delete(`/api/v1/posts/${postId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Post deleted successfully.");
      expect(res.body.data).toBeUndefined();
      expect(res.body.errorCode).toBeUndefined();
    });
  });
});
