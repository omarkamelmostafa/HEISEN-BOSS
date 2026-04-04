// backend/__tests__/integration/friendship-accept-request.test.js

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
    createUserFolder: vi.fn().mockResolvedValue({ success: true }),
  },
}));

describe("PATCH /api/v1/friends/requests/:friendshipId/accept", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await Friendship.deleteMany({});
  });

  describe("Happy path", () => {
    it("recipient can accept a pending friend request", async () => {
      // Create requester with helper
      const { user: requester } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "requester@test.com" }
      );

      // Create recipient with helper
      const { accessToken: recipientToken, user: recipient } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "recipient@test.com" }
      );

      // Insert pending friendship directly: requester -> recipient, status pending
      const friendship = await Friendship.create({
        requester: requester.id,
        recipient: recipient.id,
        status: "pending",
      });

      // Request: PATCH with recipient token
      const res = await request(app)
        .patch(`/api/v1/friends/requests/${friendship._id}/accept`)
        .set("Authorization", `Bearer ${recipientToken}`);

      // Assert: status 200
      expect(res.status).toBe(200);
      // Assert: response.body.success === true
      expect(res.body.success).toBe(true);
      // Assert: response.body.data.friendship.status === "accepted"
      expect(res.body.data.friendship.status).toBe("accepted");

      // DB assertion: re-read friendship by id, status === "accepted"
      const updatedFriendship = await Friendship.findById(friendship._id);
      expect(updatedFriendship.status).toBe("accepted");
    });
  });

  describe("Validation failure", () => {
    it("rejects invalid friendshipId with 400", async () => {
      // Create authenticated user
      const { accessToken } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "user@test.com" }
      );

      // Request: PATCH with invalid friendshipId
      const res = await request(app)
        .patch("/api/v1/friends/requests/not-a-valid-id/accept")
        .set("Authorization", `Bearer ${accessToken}`);

      // Assert: status 400
      expect(res.status).toBe(400);
      // Assert: response.body.success === false
      expect(res.body.success).toBe(false);
      // Assert: response.body.errorCode === "BadRequest"
      expect(res.body.errorCode).toBe("BadRequest");
    });
  });

  describe("Authorization failure", () => {
    it("rejects request without token with 401", async () => {
      // Create a valid ObjectId for the test (won't be found, but that's fine for auth test)
      const fakeFriendshipId = "507f1f77bcf86cd799439011";

      // Request: PATCH without token
      const res = await request(app)
        .patch(`/api/v1/friends/requests/${fakeFriendshipId}/accept`);

      // Assert: status 401
      expect(res.status).toBe(401);
      // Assert: response.body.success === false
      expect(res.body.success).toBe(false);
    });
  });

  describe("Requester cannot accept own sent request", () => {
    it("returns 403 when requester tries to accept their own request", async () => {
      // Create requester
      const { accessToken: requesterToken, user: requester } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "requester@test.com" }
      );

      // Create recipient
      const { user: recipient } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "recipient@test.com" }
      );

      // Insert pending friendship: requester -> recipient
      const friendship = await Friendship.create({
        requester: requester.id,
        recipient: recipient.id,
        status: "pending",
      });

      // Request: requester tries to call accept endpoint on their own sent request
      const res = await request(app)
        .patch(`/api/v1/friends/requests/${friendship._id}/accept`)
        .set("Authorization", `Bearer ${requesterToken}`);

      // Assert: status 403
      expect(res.status).toBe(403);
      // Assert: response.body.success === false
      expect(res.body.success).toBe(false);
      // Assert: response.body.errorCode === "FRIEND_REQUEST_FORBIDDEN"
      expect(res.body.errorCode).toBe("FRIEND_REQUEST_FORBIDDEN");

      // DB assertion: status remains "pending"
      const unchangedFriendship = await Friendship.findById(friendship._id);
      expect(unchangedFriendship.status).toBe("pending");
    });
  });

  describe("Non-pending request cannot be accepted", () => {
    it("returns 409 when trying to accept an already rejected friendship", async () => {
      // Create requester
      const { user: requester } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "requester@test.com" }
      );

      // Create recipient
      const { accessToken: recipientToken, user: recipient } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "recipient@test.com" }
      );

      // Insert friendship with status rejected
      const friendship = await Friendship.create({
        requester: requester.id,
        recipient: recipient.id,
        status: "rejected",
      });

      // Request: recipient calls accept endpoint
      const res = await request(app)
        .patch(`/api/v1/friends/requests/${friendship._id}/accept`)
        .set("Authorization", `Bearer ${recipientToken}`);

      // Assert: status 409
      expect(res.status).toBe(409);
      // Assert: response.body.success === false
      expect(res.body.success).toBe(false);
      // Assert: response.body.errorCode === "FRIEND_REQUEST_NOT_PENDING"
      expect(res.body.errorCode).toBe("FRIEND_REQUEST_NOT_PENDING");

      // DB assertion: status remains unchanged (rejected)
      const unchangedFriendship = await Friendship.findById(friendship._id);
      expect(unchangedFriendship.status).toBe("rejected");
    });

    it("returns 409 when trying to accept an already accepted friendship", async () => {
      // Create requester
      const { user: requester } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "requester@test.com" }
      );

      // Create recipient
      const { accessToken: recipientToken, user: recipient } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "recipient@test.com" }
      );

      // Insert friendship with status accepted
      const friendship = await Friendship.create({
        requester: requester.id,
        recipient: recipient.id,
        status: "accepted",
      });

      // Request: recipient calls accept endpoint
      const res = await request(app)
        .patch(`/api/v1/friends/requests/${friendship._id}/accept`)
        .set("Authorization", `Bearer ${recipientToken}`);

      // Assert: status 409
      expect(res.status).toBe(409);
      // Assert: response.body.success === false
      expect(res.body.success).toBe(false);
      // Assert: response.body.errorCode === "FRIEND_REQUEST_NOT_PENDING"
      expect(res.body.errorCode).toBe("FRIEND_REQUEST_NOT_PENDING");

      // DB assertion: status remains unchanged (accepted)
      const unchangedFriendship = await Friendship.findById(friendship._id);
      expect(unchangedFriendship.status).toBe("accepted");
    });
  });
});
