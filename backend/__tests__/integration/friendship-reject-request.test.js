// backend/__tests__/integration/friendship-reject-request.test.js

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

describe("PATCH /api/v1/friends/requests/:friendshipId/reject", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await Friendship.deleteMany({});
  });

  describe("Happy path: recipient rejects pending request", () => {
    it("rejects the friend request and updates status to rejected", async () => {
      // Create requester and recipient
      const { user: requester, accessToken: _requesterToken } = await registerVerifyAndLogin(
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

      // Recipient rejects the request
      const res = await request(app)
        .patch(`/api/v1/friends/requests/${friendship._id}/reject`)
        .set("Authorization", `Bearer ${recipientToken}`);

      // Assert response
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.friendship.status).toBe("rejected");

      // DB assertion: friendship re-read by id has status === "rejected"
      const updatedFriendship = await Friendship.findById(friendship._id);
      expect(updatedFriendship.status).toBe("rejected");
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
        .patch("/api/v1/friends/requests/not-a-valid-id/reject")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("BadRequest");
    });
  });

  describe("Auth failure: no token", () => {
    it("returns 401 when no authorization header is provided", async () => {
      const res = await request(app)
        .patch("/api/v1/friends/requests/507f1f77bcf86cd799439011/reject");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe("Authorization failure: requester cannot reject own sent request", () => {
    it("returns 403 when requester tries to reject their own sent request", async () => {
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

      // Seed pending friendship where current user is requester
      const friendship = await Friendship.create({
        requester: requester.id,
        recipient: recipient.id,
        status: "pending",
      });

      // Requester tries to reject their own sent request
      const res = await request(app)
        .patch(`/api/v1/friends/requests/${friendship._id}/reject`)
        .set("Authorization", `Bearer ${requesterToken}`);

      expect(res.status).toBe(403);
      expect(res.body.errorCode).toBe("FRIEND_REQUEST_FORBIDDEN");

      // DB assertion: status remains "pending"
      const unchangedFriendship = await Friendship.findById(friendship._id);
      expect(unchangedFriendship.status).toBe("pending");
    });
  });

  describe("State failure: non-pending cannot be rejected", () => {
    it("returns 409 when trying to reject an already accepted friendship", async () => {
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

      // Seed friendship with status: "accepted"
      const friendship = await Friendship.create({
        requester: requester.id,
        recipient: recipient.id,
        status: "accepted",
      });

      // Recipient tries to reject
      const res = await request(app)
        .patch(`/api/v1/friends/requests/${friendship._id}/reject`)
        .set("Authorization", `Bearer ${recipientToken}`);

      expect(res.status).toBe(409);
      expect(res.body.errorCode).toBe("FRIEND_REQUEST_NOT_PENDING");

      // DB assertion: status remains "accepted"
      const unchangedFriendship = await Friendship.findById(friendship._id);
      expect(unchangedFriendship.status).toBe("accepted");
    });
  });
});
