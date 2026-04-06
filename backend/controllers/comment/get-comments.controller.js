// backend/controllers/comment/get-comments.controller.js

import { getCommentsUseCase } from "../../use-cases/comment/get-comments.use-case.js";
import { sendUseCaseResponse } from "../auth/auth-shared.js";

/**
 * Handle GET /api/v1/posts/:postId/comments
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function handleGetComments(req, res) {
  const { postId } = req.params;
  const { cursor, limit } = req.query;

  const result = await getCommentsUseCase({ postId, cursor, limit });

  return sendUseCaseResponse(req, res, result);
}
