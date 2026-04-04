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

  const result = await createPostUseCase({ userId, content, image });

  return sendUseCaseResponse(req, res, result);
}
