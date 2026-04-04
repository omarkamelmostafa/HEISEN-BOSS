// backend/__tests__/integration/post-get-feed.test.js

import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import app from "../../app.js";
import Post from "../../model/Post.js";
import Friendship from "../../model/Friendship.js";
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

describe("GET /api/v1/posts/feed", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await Post.deleteMany({});
    await Friendship.deleteMany({});
  });

  describe("Authorization", () => {
    it("returns 401 for unauthenticated request", async () => {
      const res = await request(app)
        .get("/api/v1/posts/feed");

      // LAYER 1: HTTP status
      expect(res.status).toBe(401);

      // LAYER 2: Response body
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBeDefined();
    });
  });

  describe("Validation", () => {
    it("returns 400 for invalid cursor", async () => {
      const { accessToken } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "cursoruser@test.com" }
      );

      const res = await request(app)
        .get("/api/v1/posts/feed?cursor=123")
        .set("Authorization", `Bearer ${accessToken}`);

      // LAYER 1: HTTP status
      expect(res.status).toBe(400);

      // LAYER 2: Response body
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("BadRequest");
      expect(res.body.message).toMatch(/cursor/i);
    });

    it("returns 400 for invalid limit", async () => {
      const { accessToken } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "limituser@test.com" }
      );

      const res = await request(app)
        .get("/api/v1/posts/feed?limit=999")
        .set("Authorization", `Bearer ${accessToken}`);

      // LAYER 1: HTTP status
      expect(res.status).toBe(400);

      // LAYER 2: Response body
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("BadRequest");
      expect(res.body.message).toMatch(/limit/i);
    });
  });

  describe("Happy Path — Friend Posts", () => {
    it("returns accepted friends' posts newest-first", async () => {
      // Create current user
      const { accessToken: currentToken, user: currentUser } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "current@test.com" }
      );

      // Create accepted friend with posts
      const { user: acceptedFriend } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "friend@test.com" }
      );

      // Create non-friend with a post
      const { user: nonFriend } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "nonfriend@test.com" }
      );

      // Create accepted friendship
      await Friendship.create({
        requester: currentUser.id,
        recipient: acceptedFriend.id,
        status: "accepted",
      });

      // Create posts for accepted friend (sequentially for deterministic ordering)
      const friendPost1 = await Post.create({
        author: acceptedFriend.id,
        content: "Friend post 1",
      });

      const friendPost2 = await Post.create({
        author: acceptedFriend.id,
        content: "Friend post 2",
      });

      // Create post for non-friend (should not appear in feed)
      await Post.create({
        author: nonFriend.id,
        content: "Non-friend post",
      });

      // Create post for current user (should not appear in feed via friends query)
      await Post.create({
        author: currentUser.id,
        content: "My own post",
      });

      const res = await request(app)
        .get("/api/v1/posts/feed")
        .set("Authorization", `Bearer ${currentToken}`);

      // LAYER 1: HTTP status
      expect(res.status).toBe(200);

      // LAYER 2: Response body
      expect(res.body.success).toBe(true);
      expect(res.body.data.posts).toBeDefined();
      expect(Array.isArray(res.body.data.posts)).toBe(true);
      expect(res.body.data.posts.length).toBeGreaterThanOrEqual(2);

      // Verify posts belong to accepted friend only
      const postIds = res.body.data.posts.map(p => p._id);
      expect(postIds).toContain(friendPost1._id.toString());
      expect(postIds).toContain(friendPost2._id.toString());

      // Verify non-friend post is not included
      const nonFriendPost = await Post.findOne({ author: nonFriend.id });
      expect(postIds).not.toContain(nonFriendPost._id.toString());

      // Verify posts are ordered newest-first by _id
      const friendPostIds = res.body.data.posts
        .filter(p => p.author === acceptedFriend.id || p.author._id === acceptedFriend.id)
        .map(p => p._id);

      // Newest post should come first
      expect(friendPostIds[0]).toBe(friendPost2._id.toString());
      expect(friendPostIds[1]).toBe(friendPost1._id.toString());

      // LAYER 3: DB state verification
      const dbFriendPosts = await Post.find({
        author: acceptedFriend.id,
        isDeleted: false,
      }).sort({ _id: -1 }).lean();

      expect(dbFriendPosts.length).toBeGreaterThanOrEqual(2);

      // Verify response IDs align with DB query
      const dbPostIds = dbFriendPosts.map(p => p._id.toString());
      expect(postIds).toContain(dbPostIds[0]);
      expect(postIds).toContain(dbPostIds[1]);
    });

    it("paginates the friends branch with nextCursor and hasMore", async () => {
      // Create current user
      const { accessToken: currentToken, user: currentUser } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "pagination@test.com" }
      );

      // Create accepted friend
      const { user: acceptedFriend } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "paginationfriend@test.com" }
      );

      // Create accepted friendship
      await Friendship.create({
        requester: currentUser.id,
        recipient: acceptedFriend.id,
        status: "accepted",
      });

      // Create 3 posts for pagination test
      const post1 = await Post.create({
        author: acceptedFriend.id,
        content: "Post 1 - oldest",
      });

      const post2 = await Post.create({
        author: acceptedFriend.id,
        content: "Post 2 - middle",
      });

      const post3 = await Post.create({
        author: acceptedFriend.id,
        content: "Post 3 - newest",
      });

      // Request first page with limit=2
      const firstRes = await request(app)
        .get("/api/v1/posts/feed?limit=2")
        .set("Authorization", `Bearer ${currentToken}`);

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
        .get(`/api/v1/posts/feed?limit=2&cursor=${nextCursor}`)
        .set("Authorization", `Bearer ${currentToken}`);

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
      const totalFriendPosts = await Post.countDocuments({
        author: acceptedFriend.id,
        isDeleted: false,
      });
      expect(totalFriendPosts).toBe(3);

      // Total posts returned across both pages should equal total in DB
      const totalReturned = firstRes.body.data.posts.length + secondRes.body.data.posts.length;
      expect(totalReturned).toBe(totalFriendPosts);
    });
  });

  describe("Discovery Mode", () => {
    it("excludes own posts when user has no friends", async () => {
      // Setup: Create current user with no friendships
      const { accessToken, user: currentUser } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "discovery1@test.com" }
      );

      // Create 2 non-friend users with posts
      const { user: stranger1 } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "stranger1@test.com" }
      );

      const { user: stranger2 } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "stranger2@test.com" }
      );

      // Create 1 post by current user
      await Post.create({
        author: currentUser.id,
        content: "My own post",
      });

      // Create posts by non-friends (for discovery to return)
      const strangerPost1 = await Post.create({
        author: stranger1.id,
        content: "Stranger post 1",
      });

      const strangerPost2 = await Post.create({
        author: stranger2.id,
        content: "Stranger post 2",
      });

      // Request discovery feed
      const res = await request(app)
        .get("/api/v1/posts/feed?limit=2")
        .set("Authorization", `Bearer ${accessToken}`);

      // LAYER 1: HTTP status
      expect(res.status).toBe(200);

      // LAYER 2: Response body contract
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.posts)).toBe(true);
      expect(res.body.data.nextCursor).toBeNull();
      expect(res.body.data.hasMore).toBe(false);
      expect(res.body.data.pagination).toBeUndefined();

      // LAYER 3: DB state + exclusion verification
      const ownPostInDb = await Post.findOne({ author: currentUser.id });
      expect(ownPostInDb).not.toBeNull();

      const returnedAuthorIds = res.body.data.posts.map(p =>
        typeof p.author === "object" ? p.author._id.toString() : p.author.toString()
      );

      // Verify own post is excluded
      expect(returnedAuthorIds).not.toContain(currentUser.id.toString());

      // Verify we got the stranger posts (discovery returned something)
      const returnedPostIds = res.body.data.posts.map(p => p._id);
      expect(returnedPostIds).toContain(strangerPost1._id.toString());
      expect(returnedPostIds).toContain(strangerPost2._id.toString());
    });

    it("excludes accepted friends' posts when friends-branch is empty via valid cursor", async () => {
      // Setup: Create current user, accepted friend, and stranger
      const { accessToken, user: currentUser } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "discovery2@test.com" }
      );

      const { user: friendUser } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "discovery2friend@test.com" }
      );

      const { user: strangerUser } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "discovery2stranger@test.com" }
      );

      // Create accepted friendship
      await Friendship.create({
        requester: currentUser.id,
        recipient: friendUser.id,
        status: "accepted",
      });

      // Create friend posts (sequentially - oldest first)
      const friendPostOldest = await Post.create({
        author: friendUser.id,
        content: "Friend post oldest",
      });

      const friendPostNewer = await Post.create({
        author: friendUser.id,
        content: "Friend post newer",
      });

      // Create own post (to also validate own exclusion)
      await Post.create({
        author: currentUser.id,
        content: "My own post",
      });

      // Create stranger post (to ensure discovery returns something)
      const strangerPost = await Post.create({
        author: strangerUser.id,
        content: "Stranger post for discovery",
      });

      // Define cursor as the oldest friend post ID (valid MongoId)
      // This triggers discovery because friends branch uses `_id: { $lt: cursor }`
      const cursor = friendPostOldest._id.toString();

      // Request with cursor that makes friends-branch return 0 posts
      const res = await request(app)
        .get(`/api/v1/posts/feed?cursor=${cursor}&limit=2`)
        .set("Authorization", `Bearer ${accessToken}`);

      // LAYER 1: HTTP status
      expect(res.status).toBe(200);

      // LAYER 2: Response body contract
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.posts)).toBe(true);
      expect(res.body.data.nextCursor).toBeNull();
      expect(res.body.data.hasMore).toBe(false);
      expect(res.body.data.pagination).toBeUndefined();

      // LAYER 3: Exclusion verification
      const returnedAuthorIds = res.body.data.posts.map(p =>
        typeof p.author === "object" ? p.author._id.toString() : p.author.toString()
      );

      // Verify current user's posts are excluded
      expect(returnedAuthorIds).not.toContain(currentUser.id.toString());

      // Verify friend's posts are excluded
      expect(returnedAuthorIds).not.toContain(friendUser.id.toString());

      // Verify discovery ran and returned at least one eligible post
      const returnedPostIds = res.body.data.posts.map(p => p._id);
      expect(returnedPostIds).toContain(strangerPost._id.toString());
    });
  });
});
