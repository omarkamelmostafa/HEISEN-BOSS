// backend/__tests__/integration/friendship-list-requests.test.js

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

describe("GET /api/v1/friends/requests/incoming", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await Friendship.deleteMany({});
  });

  describe("Happy Path", () => {
    it("returns only pending incoming requests for the authenticated user", async () => {
      // Create current user
      const { accessToken: currentToken, user: currentUser } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "current@test.com" }
      );

      // Create requester A
      const { user: requesterA } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "requestera@test.com" }
      );

      // Create requester B
      const { user: requesterB } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "requesterb@test.com" }
      );

      // Create unrelated user
      const { user: unrelatedUser } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "unrelated@test.com" }
      );

      // Insert friendship documents directly
      // Requester A -> current user, status pending
      await Friendship.create({
        requester: requesterA.id,
        recipient: currentUser.id,
        status: "pending",
      });

      // Requester B -> current user, status pending
      await Friendship.create({
        requester: requesterB.id,
        recipient: currentUser.id,
        status: "pending",
      });

      // Current user -> requester A, status accepted (should NOT appear in incoming)
      await Friendship.create({
        requester: currentUser.id,
        recipient: requesterA.id,
        status: "accepted",
      });

      // Unrelated user -> requester A, status pending (should NOT appear)
      await Friendship.create({
        requester: unrelatedUser.id,
        recipient: requesterA.id,
        status: "pending",
      });

      // Request incoming list
      const res = await request(app)
        .get("/api/v1/friends/requests/incoming")
        .set("Authorization", `Bearer ${currentToken}`);

      // LAYER 1: HTTP status
      expect(res.status).toBe(200);

      // LAYER 2: Response body
      expect(res.body.success).toBe(true);
      expect(res.body.data.requests).toHaveLength(2);
      expect(res.body.data.requests.every(r => r.status === "pending")).toBe(true);

      // Verify requester ids match requester A and B only
      const requesterIds = res.body.data.requests.map(r => r.requester._id || r.requester);
      expect(requesterIds).toContain(requesterA.id);
      expect(requesterIds).toContain(requesterB.id);
      expect(requesterIds).not.toContain(unrelatedUser.id);

      // LAYER 3: DB assertion
      const pendingCount = await Friendship.countDocuments({
        recipient: currentUser.id,
        status: "pending",
      });
      expect(pendingCount).toBe(2);
    });
  });

  describe("Authorization Failure", () => {
    it("rejects request without token", async () => {
      const res = await request(app)
        .get("/api/v1/friends/requests/incoming");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});

describe("GET /api/v1/friends/requests/outgoing", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await Friendship.deleteMany({});
  });

  describe("Happy Path", () => {
    it("returns only pending outgoing requests for the authenticated user", async () => {
      // Create current user
      const { accessToken: currentToken, user: currentUser } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "current2@test.com" }
      );

      // Create recipient A
      const { user: recipientA } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "recipienta@test.com" }
      );

      // Create recipient B
      const { user: recipientB } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "recipientb@test.com" }
      );

      // Create unrelated user
      const { user: unrelatedUser } = await registerVerifyAndLogin(
        app,
        emailService,
        { email: "unrelated2@test.com" }
      );

      // Insert friendship documents directly
      // Current user -> recipient A, status pending
      await Friendship.create({
        requester: currentUser.id,
        recipient: recipientA.id,
        status: "pending",
      });

      // Current user -> recipient B, status pending
      await Friendship.create({
        requester: currentUser.id,
        recipient: recipientB.id,
        status: "pending",
      });

      // Recipient A -> current user, status accepted (should NOT appear in outgoing)
      await Friendship.create({
        requester: recipientA.id,
        recipient: currentUser.id,
        status: "accepted",
      });

      // Unrelated user -> recipient A, status pending (should NOT appear)
      await Friendship.create({
        requester: unrelatedUser.id,
        recipient: recipientA.id,
        status: "pending",
      });

      // Request outgoing list
      const res = await request(app)
        .get("/api/v1/friends/requests/outgoing")
        .set("Authorization", `Bearer ${currentToken}`);

      // LAYER 1: HTTP status
      expect(res.status).toBe(200);

      // LAYER 2: Response body
      expect(res.body.success).toBe(true);
      expect(res.body.data.requests).toHaveLength(2);
      expect(res.body.data.requests.every(r => r.status === "pending")).toBe(true);

      // Verify recipient ids match recipient A and B only
      const recipientIds = res.body.data.requests.map(r => r.recipient._id || r.recipient);
      expect(recipientIds).toContain(recipientA.id);
      expect(recipientIds).toContain(recipientB.id);
      expect(recipientIds).not.toContain(unrelatedUser.id);

      // LAYER 3: DB assertion
      const pendingCount = await Friendship.countDocuments({
        requester: currentUser.id,
        status: "pending",
      });
      expect(pendingCount).toBe(2);
    });
  });

  describe("Authorization Failure", () => {
    it("rejects request without token", async () => {
      const res = await request(app)
        .get("/api/v1/friends/requests/outgoing");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
