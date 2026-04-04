// backend/controllers/friendship/unfriend.controller.js

import { unfriendUseCase } from "../../use-cases/friendship/unfriend.use-case.js";
import { sendUseCaseResponse } from "../auth/auth-shared.js";

/**
 * Unfriend Controller — Thin HTTP adapter.
 * Parses request, delegates to unfriendUseCase, returns response.
 */
export async function handleUnfriend(req, res) {
  const { friendshipId } = req.params;
  const userId = req.user.userId;

  const result = await unfriendUseCase({ userId, friendshipId });

  return sendUseCaseResponse(req, res, result);
}
