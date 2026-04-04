// backend/controllers/post/get-feed.controller.js

import { getFeedUseCase } from "../../use-cases/post/get-feed.use-case.js";
import { sendUseCaseResponse } from "../auth/auth-shared.js";

/**
 * Get Feed Controller — Thin HTTP adapter.
 * Parses request, delegates to getFeedUseCase, returns response.
 */
export async function handleGetFeed(req, res) {
  const { cursor, limit } = req.query;
  const userId = req.user.userId;

  const result = await getFeedUseCase({ userId, cursor, limit });

  return sendUseCaseResponse(req, res, result);
}
