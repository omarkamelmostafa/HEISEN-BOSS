// backend/controllers/friendship/reject-friend-request.controller.js

import { rejectFriendRequestUseCase } from "../../use-cases/friendship/reject-friend-request.use-case.js";
import { sendUseCaseResponse } from "../auth/auth-shared.js";

/**
 * Reject Friend Request Controller — Thin HTTP adapter.
 * Parses request, delegates to rejectFriendRequestUseCase, returns response.
 */
export async function handleRejectFriendRequest(req, res) {
  const { friendshipId } = req.params;
  const userId = req.user.userId;

  const result = await rejectFriendRequestUseCase({ userId, friendshipId });

  return sendUseCaseResponse(req, res, result);
}
