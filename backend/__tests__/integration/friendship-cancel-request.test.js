// backend/__tests__/integration/friendship-cancel-request.test.js

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

describe("DELETE /api/v1/friends/requests/:friendshipId/cancel", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await Friendship.deleteMany({});
  });

  describe("Happy path: requester cancels pending sent request", () => {
    it("cancels the friend request and hard deletes the friendship", async () => {
      // Create requester and recipient
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

      // Seed pending friendship (requester -> recipient)
      const friendship = await Friendship.create({
        requester: requester.id,
        recipient: recipient.id,
        status: "pending",
      });

      // Requester cancels the request
      const res = await request(app)
        .delete(`/api/v1/friends/requests/${friendship._id}/cancel`)
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

  describe("Validation failure: invalid friendshipId", () => {
    it("returns 400 for invalid friendshipId format", async () => {
      const { accessToken: token } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "user@test.com" }
      );

      const res = await request(app)
        .delete("/api/v1/friends/requests/not-a-valid-id/cancel")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("BadRequest");
    });
  });

  describe("Auth failure: no token", () => {
    it("returns 401 when no authorization header is provided", async () => {
      const res = await request(app)
        .delete("/api/v1/friends/requests/507f1f77bcf86cd799439011/cancel");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe("Authorization failure: recipient cannot cancel incoming request", () => {
    it("returns 403 when recipient tries to cancel an incoming request", async () => {
      // Create requester and recipient
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

      // Seed pending friendship (requester -> recipient)
      const friendship = await Friendship.create({
        requester: requester.id,
        recipient: recipient.id,
        status: "pending",
      });

      // Recipient tries to cancel the incoming request
      const res = await request(app)
        .delete(`/api/v1/friends/requests/${friendship._id}/cancel`)
        .set("Authorization", `Bearer ${recipientToken}`);

      expect(res.status).toBe(403);
      expect(res.body.errorCode).toBe("FRIEND_REQUEST_FORBIDDEN");

      // DB assertion: friendship still exists and status remains "pending"
      const unchangedFriendship = await Friendship.findById(friendship._id);
      expect(unchangedFriendship).not.toBeNull();
      expect(unchangedFriendship.status).toBe("pending");
    });
  });

  describe("State failure: non-pending request cannot be canceled", () => {
    it("returns 409 when trying to cancel an already accepted friendship", async () => {
      // Create requester and recipient
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

      // Seed friendship with status: "accepted"
      const friendship = await Friendship.create({
        requester: requester.id,
        recipient: recipient.id,
        status: "accepted",
      });

      // Requester tries to cancel
      const res = await request(app)
        .delete(`/api/v1/friends/requests/${friendship._id}/cancel`)
        .set("Authorization", `Bearer ${requesterToken}`);

      expect(res.status).toBe(409);
      expect(res.body.errorCode).toBe("FRIEND_REQUEST_NOT_PENDING");

      // DB assertion: friendship still exists and status remains "accepted"
      const unchangedFriendship = await Friendship.findById(friendship._id);
      expect(unchangedFriendship).not.toBeNull();
      expect(unchangedFriendship.status).toBe("accepted");
    });
  });
});
