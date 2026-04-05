// backend/controllers/comment/delete-comment.controller.js

import { deleteCommentUseCase } from "../../use-cases/comment/delete-comment.use-case.js";
import { sendUseCaseResponse } from "../auth/auth-shared.js";

/**
 * Delete Comment Controller — Thin HTTP adapter.
 * Parses request, delegates to deleteCommentUseCase, returns response.
 */
export async function handleDeleteComment(req, res) {
  const userId = req.user.userId;
  const postId = req.params.postId;
  const commentId = req.params.commentId;

  const result = await deleteCommentUseCase({ userId, postId, commentId });

  return sendUseCaseResponse(req, res, result);
}
