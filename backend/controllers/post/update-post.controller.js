// backend/controllers/post/update-post.controller.js

import { updatePostUseCase } from "../../use-cases/post/update-post.use-case.js";
import { sendUseCaseResponse } from "../auth/auth-shared.js";

/**
 * Update Post Controller — Thin HTTP adapter.
 * Parses request, delegates to updatePostUseCase, returns response.
 */
export async function handleUpdatePost(req, res) {
  const { postId } = req.params;
  const { content, image } = req.body;
  const userId = req.user.userId;

  const result = await updatePostUseCase({ postId, userId, content, image });

  return sendUseCaseResponse(req, res, result);
}
