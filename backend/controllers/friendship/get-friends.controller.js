// backend/controllers/friendship/get-friends.controller.js

import { getFriendsUseCase } from "../../use-cases/friendship/get-friends.use-case.js";
import { sendUseCaseResponse } from "../auth/auth-shared.js";

/**
 * Get Friends Controller — Thin HTTP adapter.
 * Parses request, delegates to getFriendsUseCase, returns response.
 */
export async function handleGetFriends(req, res) {
  const userId = req.user.userId;

  const result = await getFriendsUseCase({ userId });

  return sendUseCaseResponse(req, res, result);
}
