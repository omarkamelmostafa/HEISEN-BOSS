// backend/controllers/comment/create-comment.controller.js

import { createCommentUseCase } from "../../use-cases/comment/create-comment.use-case.js";
import { sendUseCaseResponse } from "../auth/auth-shared.js";

/**
 * Create Comment Controller — Thin HTTP adapter.
 * Parses request, delegates to createCommentUseCase, returns response.
 */
export async function handleCreateComment(req, res) {
  const { content } = req.body;
  const userId = req.user.userId;
  const postId = req.params.postId;

  const result = await createCommentUseCase({ userId, postId, content });

  return sendUseCaseResponse(req, res, result);
}
