// backend/__tests__/integration/repost-create.test.js

import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import app from "../../app.js";
import Post from "../../model/Post.js";
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

describe("POST /api/v1/posts/:postId/repost", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await Post.deleteMany({});
    await User.deleteMany({});
    await Like.deleteMany({});
    await RefreshToken.deleteMany({});
  });

  describe("Happy Path", () => {
    it("creates repost with repostComment and increments original post repostsCount", async () => {
      // Create user A (original post author)
      const { accessToken: authorToken, user: author } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "author@test.com" }
      );

      // Create user B (reposter)
      const { accessToken: reposterToken, user: reposter } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "reposter@test.com" }
      );

      // Create original post by user A
      const originalPost = await Post.create({
        author: author.id,
        content: "Original post content",
        repostsCount: 0,
      });

      // Act: User B reposts with a comment
      const repostComment = "Awesome post!";
      const res = await request(app)
        .post(`/api/v1/posts/${originalPost._id}/repost`)
        .set("Authorization", `Bearer ${reposterToken}`)
        .send({ repostComment });

      // LAYER 1: HTTP status
      expect(res.status).toBe(201);

      // LAYER 2: Response body
      expect(res.body.success).toBe(true);
      expect(res.body.data.post.isRepost).toBe(true);
      expect(res.body.data.post.originalPost).toBe(originalPost._id.toString());
      expect(res.body.data.post.repostComment).toBe(repostComment);
      expect(res.body.data.post.author).toBe(reposter.id);

      // LAYER 3: DB state - repost created
      const repostId = res.body.data.post._id;
      const dbRepost = await Post.findById(repostId);
      expect(dbRepost.isRepost).toBe(true);
      expect(dbRepost.originalPost.toString()).toBe(originalPost._id.toString());
      expect(dbRepost.repostComment).toBe(repostComment);
      expect(dbRepost.author.toString()).toBe(reposter.id);

      // LAYER 3: DB state - original post repostsCount incremented
      const dbOriginal = await Post.findById(originalPost._id);
      expect(dbOriginal.repostsCount).toBe(1);
    });

    it("creates repost without repostComment (null) and increments original post repostsCount", async () => {
      // Create user A (original post author)
      const { accessToken: authorToken, user: author } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "author2@test.com" }
      );

      // Create user B (reposter)
      const { accessToken: reposterToken, user: reposter } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "reposter2@test.com" }
      );

      // Create original post by user A
      const originalPost = await Post.create({
        author: author.id,
        content: "Original post content 2",
        repostsCount: 0,
      });

      // Act: User B reposts without a comment
      const res = await request(app)
        .post(`/api/v1/posts/${originalPost._id}/repost`)
        .set("Authorization", `Bearer ${reposterToken}`)
        .send({});

      // LAYER 1: HTTP status
      expect(res.status).toBe(201);

      // LAYER 2: Response body
      expect(res.body.success).toBe(true);
      expect(res.body.data.post.isRepost).toBe(true);
      expect(res.body.data.post.originalPost).toBe(originalPost._id.toString());
      expect(res.body.data.post.repostComment).toBeNull();
      expect(res.body.data.post.author).toBe(reposter.id);

      // LAYER 3: DB state - repost created
      const repostId = res.body.data.post._id;
      const dbRepost = await Post.findById(repostId);
      expect(dbRepost.isRepost).toBe(true);
      expect(dbRepost.originalPost.toString()).toBe(originalPost._id.toString());
      expect(dbRepost.repostComment).toBeNull();
      expect(dbRepost.author.toString()).toBe(reposter.id);

      // LAYER 3: DB state - original post repostsCount incremented
      const dbOriginal = await Post.findById(originalPost._id);
      expect(dbOriginal.repostsCount).toBe(1);
    });
  });

  describe("Auth Failure", () => {
    it("returns 401 when no token is provided", async () => {
      const { accessToken, user } = await registerVerifyAndLogin(app, emailService);

      // Create a post
      const post = await Post.create({
        author: user.id,
        content: "Test post for auth",
        repostsCount: 0,
      });

      // Create another user
      const { accessToken: otherToken } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "otherauth@test.com" }
      );

      // Get a valid post ID but don't send token
      const res = await request(app)
        .post(`/api/v1/posts/${post._id}/repost`)
        .send({ repostComment: "Test" });

      // Assert
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);

      // Verify no repost was created
      const repostCount = await Post.countDocuments({ isRepost: true });
      expect(repostCount).toBe(0);

      // Verify original post unchanged
      const dbOriginal = await Post.findById(post._id);
      expect(dbOriginal.repostsCount).toBe(0);
    });
  });

  describe("Authorization Failure", () => {
    it("self-repost returns 403 with POST_REPOST_FORBIDDEN", async () => {
      // Create user A
      const { accessToken: authorToken, user: author } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "selfreposter@test.com" }
      );

      // Create original post by user A
      const originalPost = await Post.create({
        author: author.id,
        content: "My own post",
        repostsCount: 0,
      });

      // Act: User A attempts to repost their own post
      const res = await request(app)
        .post(`/api/v1/posts/${originalPost._id}/repost`)
        .set("Authorization", `Bearer ${authorToken}`)
        .send({ repostComment: "Trying to repost my own post" });

      // LAYER 1: HTTP status
      expect(res.status).toBe(403);

      // LAYER 2: Response body
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("POST_REPOST_FORBIDDEN");

      // LAYER 3: DB state unchanged
      const dbOriginal = await Post.findById(originalPost._id);
      expect(dbOriginal.repostsCount).toBe(0);

      // Verify no repost was created
      const repostCount = await Post.countDocuments({ isRepost: true });
      expect(repostCount).toBe(0);
    });
  });

  describe("Validation Failure", () => {
    it("returns 400 for invalid postId format", async () => {
      const { accessToken } = await registerVerifyAndLogin(app, emailService);

      const res = await request(app)
        .post("/api/v1/posts/invalid-id/repost")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ repostComment: "Test" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("BadRequest");
    });

    it("returns 400 when repostComment exceeds 500 characters", async () => {
      const { accessToken, user } = await registerVerifyAndLogin(app, emailService);

      // Create a post
      const post = await Post.create({
        author: user.id,
        content: "Test post",
        repostsCount: 0,
      });

      // Create another user to attempt repost
      const { accessToken: otherToken } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "otherlong@test.com" }
      );

      const longComment = "a".repeat(501);

      const res = await request(app)
        .post(`/api/v1/posts/${post._id}/repost`)
        .set("Authorization", `Bearer ${otherToken}`)
        .send({ repostComment: longComment });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("Repost Chain", () => {
    it("reposting a repost points to original post and increments original's count", async () => {
      // Create User B (original post author)
      const { accessToken: authorBToken, user: authorB } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "authorb@test.com" }
      );

      // Create User C (middle reposter)
      const { accessToken: reposterCToken, user: reposterC } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "reposterc@test.com" }
      );

      // Create User A (final reposter)
      const { accessToken: reposterAToken, user: reposterA } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "repostera@test.com" }
      );

      // Create original Post A by User B
      const originalPost = await Post.create({
        author: authorB.id,
        content: "Original post by B",
        repostsCount: 0,
      });

      // User C reposts Post A (creates Repost B)
      const repostBRes = await request(app)
        .post(`/api/v1/posts/${originalPost._id}/repost`)
        .set("Authorization", `Bearer ${reposterCToken}`)
        .send({ repostComment: "C's repost" });

      expect(repostBRes.status).toBe(201);
      const repostBId = repostBRes.body.data.post._id;

      // Verify original post repostsCount is now 1
      let dbOriginal = await Post.findById(originalPost._id);
      expect(dbOriginal.repostsCount).toBe(1);

      // User A reposts Repost B
      const repostARes = await request(app)
        .post(`/api/v1/posts/${repostBId}/repost`)
        .set("Authorization", `Bearer ${reposterAToken}`)
        .send({ repostComment: "A's repost of repost" });

      // LAYER 1: HTTP status
      expect(repostARes.status).toBe(201);

      // LAYER 2: Response body
      expect(repostARes.body.success).toBe(true);
      expect(repostARes.body.data.post.isRepost).toBe(true);
      // originalPost should point to Post A (the original), not Repost B
      expect(repostARes.body.data.post.originalPost).toBe(originalPost._id.toString());
      expect(repostARes.body.data.post.repostComment).toBe("A's repost of repost");
      expect(repostARes.body.data.post.author).toBe(reposterA.id);

      // LAYER 3: DB state - new repost created
      const repostAId = repostARes.body.data.post._id;
      const dbRepostA = await Post.findById(repostAId);
      expect(dbRepostA.isRepost).toBe(true);
      expect(dbRepostA.originalPost.toString()).toBe(originalPost._id.toString());
      expect(dbRepostA.author.toString()).toBe(reposterA.id);

      // LAYER 3: DB state - original Post A's repostsCount incremented (now 2)
      dbOriginal = await Post.findById(originalPost._id);
      expect(dbOriginal.repostsCount).toBe(2);

      // Verify Repost B's count was NOT incremented
      const dbRepostB = await Post.findById(repostBId);
      expect(dbRepostB.repostsCount).toBe(0);
    });
  });

  describe("Not Found", () => {
    it("returns 404 when original post does not exist", async () => {
      const { accessToken } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "notfound@test.com" }
      );

      const fakePostId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .post(`/api/v1/posts/${fakePostId}/repost`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ repostComment: "Test" });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("POST_NOT_FOUND");
    });

    it("returns 404 when original post is soft-deleted", async () => {
      // Create user A (author)
      const { accessToken: authorToken, user: author } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "deletedauthor@test.com" }
      );

      // Create user B (reposter)
      const { accessToken: reposterToken } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "reposterdeleted@test.com" }
      );

      // Create soft-deleted post by user A
      const deletedPost = await Post.create({
        author: author.id,
        content: "Deleted post",
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: author.id,
        repostsCount: 0,
      });

      const res = await request(app)
        .post(`/api/v1/posts/${deletedPost._id}/repost`)
        .set("Authorization", `Bearer ${reposterToken}`)
        .send({ repostComment: "Test" });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("POST_NOT_FOUND");

      // Verify no repost was created
      const repostCount = await Post.countDocuments({ isRepost: true });
      expect(repostCount).toBe(0);
    });
  });
});
