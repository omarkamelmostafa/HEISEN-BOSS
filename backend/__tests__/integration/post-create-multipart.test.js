import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import app from "../../app.js";
import Post from "../../model/Post.js";
import emailService from "../../services/email/email.service.js";
import { registerVerifyAndLogin } from "./helpers.js";
import fs from 'fs';
import path from 'path';

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

// Mock CloudinaryService
vi.mock("../../services/cloudinaryService.js", () => ({
  CloudinaryService: {
    createUserFolder: vi.fn().mockResolvedValue({ success: true }),
    uploadPostImage: vi.fn().mockResolvedValue({
      success: true,
      url: 'https://cloudinary.com/test/image.jpg',
      publicId: 'test_public_id'
    })
  }
}));

describe("Manual POST /api/v1/posts multipart tests", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await Post.deleteMany({});
  });

  it("creates a post with multipart image upload", async () => {
    const { accessToken } = await registerVerifyAndLogin(app, emailService);

    // Create a test image file (1x1 PNG)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0x57, 0x63, 0xF8, 0x0F, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);

    const res = await request(app)
      .post("/api/v1/posts")
      .set("Authorization", `Bearer ${accessToken}`)
      .attach('image', testImageBuffer, 'test.png')
      .field('content', 'hello with image');

    // LAYER 1: HTTP status
    expect(res.status).toBe(201);

    // LAYER 2: Response body
    expect(res.body.success).toBe(true);
    expect(res.body.data.post.content).toBe('hello with image');
    expect(res.body.data.post.image).toBe('https://cloudinary.com/test/image.jpg');
    expect(res.body.data.post.imagePublicId).toBeUndefined(); // Should not expose this

    // LAYER 3: DB state
    const createdPost = await Post.findById(res.body.data.post._id);
    expect(createdPost).toBeDefined();
    expect(createdPost.content).toBe('hello with image');
    expect(createdPost.image).toBe('https://cloudinary.com/test/image.jpg');
    expect(createdPost.imagePublicId).toBe('test_public_id');
  });

  it("rejects multipart upload with wrong file type", async () => {
    const { accessToken } = await registerVerifyAndLogin(app, emailService);

    const wrongFileBuffer = Buffer.from('This is not an image', 'utf8');

    const res = await request(app)
      .post("/api/v1/posts")
      .set("Authorization", `Bearer ${accessToken}`)
      .attach('image', wrongFileBuffer, 'wrong.txt')
      .field('content', 'hello with wrong file');

    // Should return 400 for invalid file type
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errorCode).toBeDefined();
  });

  it("creates a post with JSON content (no file)", async () => {
    const { accessToken } = await registerVerifyAndLogin(app, emailService);

    const res = await request(app)
      .post("/api/v1/posts")
      .set("Authorization", `Bearer ${accessToken}`)
      .set("Content-Type", "application/json")
      .send({ content: "hello" });

    // LAYER 1: HTTP status
    expect(res.status).toBe(201);

    // LAYER 2: Response body
    expect(res.body.success).toBe(true);
    expect(res.body.data.post.content).toBe("hello");
    expect(res.body.data.post.image).toBe(null);

    // LAYER 3: DB state
    const createdPost = await Post.findById(res.body.data.post._id);
    expect(createdPost).toBeDefined();
    expect(createdPost.content).toBe("hello");
    expect(createdPost.image).toBe(null);
    expect(createdPost.imagePublicId).toBe(null);
  });
});
