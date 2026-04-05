// backend/__tests__/integration/post-get-user-posts.test.js

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

describe("GET /api/v1/posts/user/:userId", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await Post.deleteMany({});
  });

  describe("Happy Path", () => {
    it("returns posts for a user with multiple posts", async () => {
      const { accessToken, user } = await registerVerifyAndLogin(app, emailService);

      // Create posts directly for deterministic ordering
      const post1 = await Post.create({
        author: user.id,
        content: "User post 1 - oldest",
      });

      const post2 = await Post.create({
        author: user.id,
        content: "User post 2 - middle",
      });

      const post3 = await Post.create({
        author: user.id,
        content: "User post 3 - newest",
      });

      const res = await request(app)
        .get(`/api/v1/posts/user/${user.id}`)
        .set("Authorization", `Bearer ${accessToken}`);

      // LAYER 1: HTTP status
      expect(res.status).toBe(200);

      // LAYER 2: Response body
      expect(res.body.success).toBe(true);
      expect(res.body.data.posts).toBeDefined();
      expect(Array.isArray(res.body.data.posts)).toBe(true);
      expect(res.body.data.posts.length).toBe(3);

      // Verify all posts belong to the user
      const postIds = res.body.data.posts.map(p => p._id);
      expect(postIds).toContain(post1._id.toString());
      expect(postIds).toContain(post2._id.toString());
      expect(postIds).toContain(post3._id.toString());

      // Verify newest-first ordering (post3 first)
      expect(postIds[0]).toBe(post3._id.toString());
      expect(postIds[1]).toBe(post2._id.toString());
      expect(postIds[2]).toBe(post1._id.toString());

      // Verify author population
      res.body.data.posts.forEach(post => {
        expect(typeof post.author).toBe("object");
        expect(post.author._id).toBe(user.id);
        expect(post.author.firstname).toBeDefined();
        expect(post.author.lastname).toBeDefined();
        expect(post.author.avatar).toBeDefined();
        expect(post.author.email).toBeUndefined();
        expect(post.author.password).toBeUndefined();
      });

      // Verify pagination fields
      expect(res.body.data.nextCursor).toBeNull();
      expect(res.body.data.hasMore).toBe(false);

      // LAYER 3: DB state verification
      const userPosts = await Post.find({ author: user.id, isDeleted: false }).sort({ _id: -1 });
      expect(userPosts.length).toBe(3);
    });

    it("returns only posts for the requested user", async () => {
      // Create User A
      const { accessToken: userAToken, user: userA } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "usera@test.com" }
      );

      // Create User B
      const { user: userB } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "userb@test.com" }
      );

      // Create posts for User A
      const userAPost1 = await Post.create({
        author: userA.id,
        content: "User A post 1",
      });

      const userAPost2 = await Post.create({
        author: userA.id,
        content: "User A post 2",
      });

      // Create posts for User B
      await Post.create({
        author: userB.id,
        content: "User B post 1",
      });

      await Post.create({
        author: userB.id,
        content: "User B post 2",
      });

      const res = await request(app)
        .get(`/api/v1/posts/user/${userA.id}`)
        .set("Authorization", `Bearer ${userAToken}`);

      // LAYER 1: HTTP status
      expect(res.status).toBe(200);

      // LAYER 2: Response body - verify only User A's posts returned
      expect(res.body.success).toBe(true);
      expect(res.body.data.posts.length).toBe(2);

      const returnedAuthorIds = res.body.data.posts.map(p =>
        typeof p.author === "object" ? p.author._id : p.author
      );

      // All posts should belong to User A
      returnedAuthorIds.forEach(authorId => {
        expect(authorId.toString()).toBe(userA.id);
      });

      const postIds = res.body.data.posts.map(p => p._id);
      expect(postIds).toContain(userAPost1._id.toString());
      expect(postIds).toContain(userAPost2._id.toString());

      // LAYER 3: DB verification
      const userAPostsInDb = await Post.countDocuments({ author: userA.id, isDeleted: false });
      const userBPostsInDb = await Post.countDocuments({ author: userB.id, isDeleted: false });
      expect(userAPostsInDb).toBe(2);
      expect(userBPostsInDb).toBe(2);
    });

    it("excludes soft-deleted posts", async () => {
      const { accessToken, user } = await registerVerifyAndLogin(app, emailService);

      // Create active posts
      const activePost = await Post.create({
        author: user.id,
        content: "Active post",
      });

      // Create soft-deleted post directly in DB
      const deletedPost = await Post.create({
        author: user.id,
        content: "Deleted post",
        isDeleted: true,
      });

      const res = await request(app)
        .get(`/api/v1/posts/user/${user.id}`)
        .set("Authorization", `Bearer ${accessToken}`);

      // LAYER 1: HTTP status
      expect(res.status).toBe(200);

      // LAYER 2: Response body - verify only active post returned
      expect(res.body.success).toBe(true);
      expect(res.body.data.posts.length).toBe(1);
      expect(res.body.data.posts[0]._id).toBe(activePost._id.toString());

      const postIds = res.body.data.posts.map(p => p._id);
      expect(postIds).not.toContain(deletedPost._id.toString());

      // LAYER 3: DB state - verify deleted post still exists but is excluded
      const deletedPostInDb = await Post.findById(deletedPost._id);
      expect(deletedPostInDb).toBeDefined();
      expect(deletedPostInDb.isDeleted).toBe(true);
    });

    it("paginates with cursor and hasMore", async () => {
      const { accessToken, user } = await registerVerifyAndLogin(app, emailService);

      // Create 3 posts for pagination test
      const post1 = await Post.create({
        author: user.id,
        content: "Post 1 - oldest",
      });

      const post2 = await Post.create({
        author: user.id,
        content: "Post 2 - middle",
      });

      const post3 = await Post.create({
        author: user.id,
        content: "Post 3 - newest",
      });

      // Request first page with limit=2
      const firstRes = await request(app)
        .get(`/api/v1/posts/user/${user.id}?limit=2`)
        .set("Authorization", `Bearer ${accessToken}`);

      // LAYER 1: HTTP status
      expect(firstRes.status).toBe(200);

      // LAYER 2: Response body assertions for first page
      expect(firstRes.body.success).toBe(true);
      expect(firstRes.body.data.posts).toHaveLength(2);
      expect(firstRes.body.data.hasMore).toBe(true);
      expect(firstRes.body.data.nextCursor).toBeTruthy();
      expect(typeof firstRes.body.data.nextCursor).toBe("string");

      // Verify first page contains newest posts (post3, post2)
      const firstPageIds = firstRes.body.data.posts.map(p => p._id);
      expect(firstPageIds).toContain(post3._id.toString());
      expect(firstPageIds).toContain(post2._id.toString());
      expect(firstPageIds).not.toContain(post1._id.toString());

      // Request second page with cursor
      const nextCursor = firstRes.body.data.nextCursor;
      const secondRes = await request(app)
        .get(`/api/v1/posts/user/${user.id}?limit=2&cursor=${nextCursor}`)
        .set("Authorization", `Bearer ${accessToken}`);

      // LAYER 1: HTTP status
      expect(secondRes.status).toBe(200);

      // LAYER 2: Response body assertions for second page
      expect(secondRes.body.success).toBe(true);
      expect(secondRes.body.data.posts.length).toBeGreaterThanOrEqual(1);
      expect(secondRes.body.data.hasMore).toBe(false);
      expect(secondRes.body.data.nextCursor).toBeNull();

      // Verify second page contains remaining posts (post1)
      const secondPageIds = secondRes.body.data.posts.map(p => p._id);
      expect(secondPageIds).toContain(post1._id.toString());

      // Verify no overlap between pages
      const overlap = firstPageIds.filter(id => secondPageIds.includes(id));
      expect(overlap).toHaveLength(0);

      // LAYER 3: DB state verification
      const totalUserPosts = await Post.countDocuments({
        author: user.id,
        isDeleted: false,
      });
      expect(totalUserPosts).toBe(3);

      // Total posts returned across both pages should equal total in DB
      const totalReturned = firstRes.body.data.posts.length + secondRes.body.data.posts.length;
      expect(totalReturned).toBe(totalUserPosts);
    });
  });

  describe("Validation", () => {
    it("returns 400 for invalid userId", async () => {
      const { accessToken } = await registerVerifyAndLogin(app, emailService);

      const res = await request(app)
        .get("/api/v1/posts/user/invalid-id")
        .set("Authorization", `Bearer ${accessToken}`);

      // LAYER 1: HTTP status
      expect(res.status).toBe(400);

      // LAYER 2: Response body
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("BadRequest");
      expect(res.body.message).toMatch(/User ID/i);
    });
  });

  describe("Authorization", () => {
    it("returns 401 for missing token", async () => {
      const fakeUserId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .get(`/api/v1/posts/user/${fakeUserId}`);

      // LAYER 1: HTTP status
      expect(res.status).toBe(401);

      // LAYER 2: Response body
      expect(res.body.success).toBe(false);
      if (res.body.errorCode) {
        expect(res.body.errorCode).toBeDefined();
      }
    });
  });

  describe("Empty Results", () => {
    it("returns empty result for valid nonexistent user", async () => {
      const { accessToken } = await registerVerifyAndLogin(app, emailService);
      const fakeUserId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .get(`/api/v1/posts/user/${fakeUserId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      // LAYER 1: HTTP status
      expect(res.status).toBe(200);

      // LAYER 2: Response body - empty result envelope
      expect(res.body.success).toBe(true);
      expect(res.body.data.posts).toBeDefined();
      expect(Array.isArray(res.body.data.posts)).toBe(true);
      expect(res.body.data.posts.length).toBe(0);
      expect(res.body.data.nextCursor).toBeNull();
      expect(res.body.data.hasMore).toBe(false);
    });

    it("returns empty result for existing user with zero posts", async () => {
      const { accessToken, user } = await registerVerifyAndLogin(app, emailService);
      // User exists but has no posts

      const res = await request(app)
        .get(`/api/v1/posts/user/${user.id}`)
        .set("Authorization", `Bearer ${accessToken}`);

      // LAYER 1: HTTP status
      expect(res.status).toBe(200);

      // LAYER 2: Response body - empty result envelope
      expect(res.body.success).toBe(true);
      expect(res.body.data.posts).toBeDefined();
      expect(Array.isArray(res.body.data.posts)).toBe(true);
      expect(res.body.data.posts.length).toBe(0);
      expect(res.body.data.nextCursor).toBeNull();
      expect(res.body.data.hasMore).toBe(false);
    });
  });

  describe("Response Contract Verification", () => {
    it("returns populated author with correct fields", async () => {
      const { accessToken, user } = await registerVerifyAndLogin(app, emailService);

      // Create a post
      const post = await Post.create({
        author: user.id,
        content: "Test post",
      });

      const res = await request(app)
        .get(`/api/v1/posts/user/${user.id}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify author population on returned post
      const returnedPost = res.body.data.posts[0];
      expect(typeof returnedPost.author).toBe("object");
      expect(returnedPost.author._id).toBe(user.id);
      expect(returnedPost.author.firstname).toBeDefined();
      expect(returnedPost.author.lastname).toBeDefined();
      expect(returnedPost.author.avatar).toBeDefined();
      expect(returnedPost.author.email).toBeUndefined();
      expect(returnedPost.author.password).toBeUndefined();

      // Verify count fields
      expect(returnedPost.likesCount).toBe(0);
      expect(returnedPost.commentsCount).toBe(0);
      expect(returnedPost.repostsCount).toBe(0);
    });
  });
});
