// backend/controllers/like/toggle-like.controller.js

import { toggleLikeUseCase } from "../../use-cases/like/toggle-like.use-case.js";
import { sendUseCaseResponse } from "../auth/auth-shared.js";

/**
 * Toggle Like Controller — Thin HTTP adapter.
 * Parses request, delegates to toggleLikeUseCase, returns response.
 */
export async function handleToggleLike(req, res) {
  const postId = req.params.postId;
  const userId = req.user.userId;

  const result = await toggleLikeUseCase({ userId, postId });

  return sendUseCaseResponse(req, res, result);
}
