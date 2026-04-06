// backend/controllers/post/create-repost.controller.js

import { createRepostUseCase } from "../../use-cases/post/create-repost.use-case.js";
import { sendUseCaseResponse } from "../auth/auth-shared.js";

/**
 * Create Repost Controller — Thin HTTP adapter.
 * Parses request, delegates to createRepostUseCase, returns response.
 */
export async function handleCreateRepost(req, res) {
  const { postId } = req.params;
  const { userId } = req.user;
  const { repostComment } = req.body;

  const result = await createRepostUseCase({ userId, postId, repostComment });

  return sendUseCaseResponse(req, res, result);
}
