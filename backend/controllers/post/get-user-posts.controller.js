// backend/controllers/post/get-user-posts.controller.js

import { getUserPostsUseCase } from "../../use-cases/post/get-user-posts.use-case.js";
import { sendUseCaseResponse } from "../auth/auth-shared.js";

/**
 * Get User Posts Controller — Thin HTTP adapter.
 * Parses request, delegates to getUserPostsUseCase, returns response.
 */
export async function handleGetUserPosts(req, res) {
  const { cursor, limit } = req.query;
  const { userId } = req.params;
  const authenticatedUserId = req.user.userId;

  const result = await getUserPostsUseCase({ 
    userId: authenticatedUserId, 
    targetUserId: userId, 
    cursor, 
    limit 
  });

  return sendUseCaseResponse(req, res, result);
}
