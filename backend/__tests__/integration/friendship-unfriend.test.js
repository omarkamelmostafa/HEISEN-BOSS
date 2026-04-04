// backend/__tests__/integration/friendship-unfriend.test.js

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

describe("DELETE /api/v1/friends/:friendshipId", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await Friendship.deleteMany({});
  });

  describe("Happy path: requester can unfriend", () => {
    it("removes the friendship when requester initiates unfriend", async () => {
      // Create requester with token and recipient
      const { user: requester, accessToken: requesterToken } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "requester@test.com" }
      );
      const { user: recipient } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "recipient@test.com" }
      );

      // Seed accepted friendship (requester -> recipient)
      const friendship = await Friendship.create({
        requester: requester.id,
        recipient: recipient.id,
        status: "accepted",
      });

      // Requester unfriends
      const res = await request(app)
        .delete(`/api/v1/friends/${friendship._id}`)
        .set("Authorization", `Bearer ${requesterToken}`);

      // Assert response
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.friendshipId).toBe(friendship._id.toString());

      // DB assertion: friendship is deleted
      const deletedFriendship = await Friendship.findById(friendship._id);
      expect(deletedFriendship).toBeNull();
    });
  });

  describe("Happy path: recipient can unfriend", () => {
    it("removes the friendship when recipient initiates unfriend", async () => {
      // Create requester and recipient with token
      const { user: requester } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "requester@test.com" }
      );
      const { user: recipient, accessToken: recipientToken } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "recipient@test.com" }
      );

      // Seed accepted friendship (requester -> recipient)
      const friendship = await Friendship.create({
        requester: requester.id,
        recipient: recipient.id,
        status: "accepted",
      });

      // Recipient unfriends
      const res = await request(app)
        .delete(`/api/v1/friends/${friendship._id}`)
        .set("Authorization", `Bearer ${recipientToken}`);

      // Assert response
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // DB assertion: friendship is deleted
      const deletedFriendship = await Friendship.findById(friendship._id);
      expect(deletedFriendship).toBeNull();
    });
  });

  describe("Validation failure: invalid friendshipId", () => {
    it("returns 400 for invalid friendshipId format", async () => {
      const { accessToken: token } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "user@test.com" }
      );

      const res = await request(app)
        .delete("/api/v1/friends/not-a-valid-id")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("BadRequest");
    });
  });

  describe("Auth failure: no token", () => {
    it("returns 401 when no authorization header is provided", async () => {
      const res = await request(app)
        .delete("/api/v1/friends/507f1f77bcf86cd799439011");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe("Authorization failure: non-participant cannot unfriend", () => {
    it("returns 403 when outsider tries to unfriend", async () => {
      // Create requester, recipient, and outsider
      const { user: requester } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "requester@test.com" }
      );
      const { user: recipient } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "recipient@test.com" }
      );
      const { user: outsider, accessToken: outsiderToken } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "outsider@test.com" }
      );

      // Seed accepted friendship (requester -> recipient)
      const friendship = await Friendship.create({
        requester: requester.id,
        recipient: recipient.id,
        status: "accepted",
      });

      // Outsider tries to unfriend
      const res = await request(app)
        .delete(`/api/v1/friends/${friendship._id}`)
        .set("Authorization", `Bearer ${outsiderToken}`);

      expect(res.status).toBe(403);
      expect(res.body.errorCode).toBe("FRIENDSHIP_FORBIDDEN");

      // DB assertion: friendship still exists and status remains "accepted"
      const unchangedFriendship = await Friendship.findById(friendship._id);
      expect(unchangedFriendship).not.toBeNull();
      expect(unchangedFriendship.status).toBe("accepted");
    });
  });

  describe("State failure: non-accepted friendship cannot be unfriended", () => {
    it("returns 409 when trying to unfriend a pending friendship", async () => {
      // Create requester with token and recipient
      const { user: requester, accessToken: requesterToken } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "requester@test.com" }
      );
      const { user: recipient } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "recipient@test.com" }
      );

      // Seed friendship with status: "pending"
      const friendship = await Friendship.create({
        requester: requester.id,
        recipient: recipient.id,
        status: "pending",
      });

      // Requester tries to unfriend
      const res = await request(app)
        .delete(`/api/v1/friends/${friendship._id}`)
        .set("Authorization", `Bearer ${requesterToken}`);

      expect(res.status).toBe(409);
      expect(res.body.errorCode).toBe("FRIENDSHIP_NOT_ACCEPTED");

      // DB assertion: friendship still exists and status remains "pending"
      const unchangedFriendship = await Friendship.findById(friendship._id);
      expect(unchangedFriendship).not.toBeNull();
      expect(unchangedFriendship.status).toBe("pending");
    });
  });
});
