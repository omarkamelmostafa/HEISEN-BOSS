// backend/__tests__/integration/friendship-send-request.test.js

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

describe("POST /api/v1/friends/requests", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await Friendship.deleteMany({});
  });

  describe("Happy Path", () => {
    it("sends a friend request and creates a pending friendship", async () => {
      // Create sender user
      const { accessToken: senderToken, user: sender } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "sender@test.com" }
      );

      // Create recipient user
      const { user: recipient } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "recipient@test.com" }
      );

      // Send friend request
      const res = await request(app)
        .post("/api/v1/friends/requests")
        .set("Authorization", `Bearer ${senderToken}`)
        .send({ recipientId: recipient.id });

      // LAYER 1: HTTP status
      expect(res.status).toBe(201);

      // LAYER 2: Response body
      expect(res.body.success).toBe(true);
      expect(res.body.data.friendship.status).toBe("pending");

      // LAYER 3: DB state
      const friendship = await Friendship.findOne({
        requester: sender.id,
        recipient: recipient.id,
      });
      expect(friendship).toBeDefined();
      expect(friendship.requester.toString()).toBe(sender.id);
      expect(friendship.recipient.toString()).toBe(recipient.id);
      expect(friendship.status).toBe("pending");
    });
  });

  describe("Validation Failure", () => {
    it("rejects friend request with invalid recipientId", async () => {
      const { accessToken } = await registerVerifyAndLogin(app, emailService);

      const res = await request(app)
        .post("/api/v1/friends/requests")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ recipientId: "not-a-valid-id" });

      // LAYER 1: HTTP status
      expect(res.status).toBe(400);

      // LAYER 2: Response body
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("BadRequest");

      // LAYER 3: DB state
      const count = await Friendship.countDocuments();
      expect(count).toBe(0);
    });
  });

  describe("Authorization Failure", () => {
    it("rejects friend request without token", async () => {
      const res = await request(app)
        .post("/api/v1/friends/requests")
        .send({ recipientId: "507f1f77bcf86cd799439011" });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe("Self-request Prevention", () => {
    it("rejects sending friend request to self", async () => {
      const { accessToken, user } = await registerVerifyAndLogin(app, emailService);

      const res = await request(app)
        .post("/api/v1/friends/requests")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ recipientId: user.id });

      // LAYER 1: HTTP status
      expect(res.status).toBe(400);

      // LAYER 2: Response body
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("INVALID_FRIEND_REQUEST");

      // LAYER 3: DB state
      const count = await Friendship.countDocuments();
      expect(count).toBe(0);
    });
  });

  describe("Reverse-direction Duplicate Prevention", () => {
    it("prevents duplicate friend request in reverse direction", async () => {
      // Create user A
      const { accessToken: tokenA, user: userA } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "usera@test.com" }
      );

      // Create user B
      const { accessToken: tokenB, user: userB } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "userb@test.com" }
      );

      // User A sends friend request to User B
      const firstRes = await request(app)
        .post("/api/v1/friends/requests")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ recipientId: userB.id });

      expect(firstRes.status).toBe(201);
      expect(firstRes.body.success).toBe(true);

      // User B tries to send friend request to User A (reverse direction)
      const secondRes = await request(app)
        .post("/api/v1/friends/requests")
        .set("Authorization", `Bearer ${tokenB}`)
        .send({ recipientId: userA.id });

      // LAYER 1: HTTP status
      expect(secondRes.status).toBe(409);

      // LAYER 2: Response body
      expect(secondRes.body.success).toBe(false);
      expect(secondRes.body.errorCode).toBe("FRIEND_REQUEST_EXISTS");

      // LAYER 3: DB state - still exactly one friendship
      const count = await Friendship.countDocuments();
      expect(count).toBe(1);
    });
  });
});
