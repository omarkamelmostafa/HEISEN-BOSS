// backend/controllers/post/create-post.controller.js

import { createPostUseCase } from "../../use-cases/post/create-post.use-case.js";
import { sendUseCaseResponse } from "../auth/auth-shared.js";

/**
 * Create Post Controller — Thin HTTP adapter.
 * Parses request, delegates to createPostUseCase, returns response.
 */
export async function handleCreatePost(req, res) {
  const { content, image } = req.body;
  const userId = req.user.userId;

  // Support uploaded file (multipart) or body URL (JSON)
  const imageFile = req.file
    ? { buffer: req.file.buffer, mimetype: req.file.mimetype }
    : undefined;

  const result = await createPostUseCase({ userId, content, image, imageFile });

  return sendUseCaseResponse(req, res, result);
}
