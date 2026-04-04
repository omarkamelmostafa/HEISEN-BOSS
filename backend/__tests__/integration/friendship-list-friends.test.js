// backend/__tests__/integration/friendship-list-friends.test.js

import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import app from "../../app.js";
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

describe("GET /api/v1/friends", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await Friendship.deleteMany({});
  });

  describe("Happy Path — mixed direction accepted friends", () => {
    it("returns accepted friends where current user is sometimes requester and sometimes recipient", async () => {
      // Create current user
      const { accessToken: currentToken, user: currentUser } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "current@test.com" }
      );

      // Create friend A
      const { user: friendA } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "frienda@test.com" }
      );

      // Create friend B
      const { user: friendB } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "friendb@test.com" }
      );

      // Create unrelated user
      const { user: unrelatedUser } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "unrelated@test.com" }
      );

      // Insert friendship documents directly
      // Current user -> friend A, status accepted (current user is requester)
      await Friendship.create({
        requester: currentUser.id,
        recipient: friendA.id,
        status: "accepted",
      });

      // Friend B -> current user, status accepted (current user is recipient)
      await Friendship.create({
        requester: friendB.id,
        recipient: currentUser.id,
        status: "accepted",
      });

      // Current user -> unrelated user, status pending (should NOT appear)
      await Friendship.create({
        requester: currentUser.id,
        recipient: unrelatedUser.id,
        status: "pending",
      });

      // Unrelated user -> friend A, status accepted (should NOT appear)
      await Friendship.create({
        requester: unrelatedUser.id,
        recipient: friendA.id,
        status: "accepted",
      });

      // Request friends list
      const res = await request(app)
        .get("/api/v1/friends")
        .set("Authorization", `Bearer ${currentToken}`);

      // LAYER 1: HTTP status
      expect(res.status).toBe(200);

      // LAYER 2: Response body
      expect(res.body.success).toBe(true);
      expect(res.body.data.friends).toHaveLength(2);

      // Verify returned friend ids match friend A and friend B only
      const friendIds = res.body.data.friends.map(f => f.friend._id || f.friend);
      expect(friendIds).toContain(friendA.id);
      expect(friendIds).toContain(friendB.id);
      expect(friendIds).not.toContain(unrelatedUser.id);

      // Verify normalized friend field exists
      expect(res.body.data.friends.every(f => f.friend && f.friend.firstname && f.friend.lastname)).toBe(true);

      // LAYER 3: DB assertion
      const acceptedCount = await Friendship.countDocuments({
        status: "accepted",
        $or: [{ requester: currentUser.id }, { recipient: currentUser.id }],
      });
      expect(acceptedCount).toBe(2);
    });
  });

  describe("Empty state", () => {
    it("returns empty list when user has no accepted friends", async () => {
      // Create current user
      const { accessToken: currentToken } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "current@test.com" }
      );

      // Create unrelated users with friendships not involving current user
      const { user: unrelatedUser1 } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "unrelated1@test.com" }
      );
      const { user: unrelatedUser2 } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "unrelated2@test.com" }
      );

      await Friendship.create({
        requester: unrelatedUser1.id,
        recipient: unrelatedUser2.id,
        status: "accepted",
      });

      // Request friends list
      const res = await request(app)
        .get("/api/v1/friends")
        .set("Authorization", `Bearer ${currentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.friends).toEqual([]);
    });
  });

  describe("Authorization failure", () => {
    it("rejects request without token", async () => {
      const res = await request(app)
        .get("/api/v1/friends");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe("Excludes non-accepted statuses", () => {
    it("does not return pending, rejected, or blocked relationships", async () => {
      // Create current user
      const { accessToken: currentToken, user: currentUser } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "current@test.com" }
      );

      // Create 3 other users
      const { user: user1 } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "user1@test.com" }
      );
      const { user: user2 } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "user2@test.com" }
      );
      const { user: user3 } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "user3@test.com" }
      );

      // Insert non-accepted friendships
      await Friendship.create({
        requester: currentUser.id,
        recipient: user1.id,
        status: "pending",
      });
      await Friendship.create({
        requester: user2.id,
        recipient: currentUser.id,
        status: "rejected",
      });
      await Friendship.create({
        requester: currentUser.id,
        recipient: user3.id,
        status: "blocked",
      });

      // Request friends list
      const res = await request(app)
        .get("/api/v1/friends")
        .set("Authorization", `Bearer ${currentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.friends).toEqual([]);
    });
  });
});
