// backend/controllers/friendship/cancel-friend-request.controller.js

import { cancelFriendRequestUseCase } from "../../use-cases/friendship/cancel-friend-request.use-case.js";
import { sendUseCaseResponse } from "../auth/auth-shared.js";

/**
 * Cancel Friend Request Controller — Thin HTTP adapter.
 * Parses request, delegates to cancelFriendRequestUseCase, returns response.
 */
export async function handleCancelFriendRequest(req, res) {
  const { friendshipId } = req.params;
  const userId = req.user.userId;

  const result = await cancelFriendRequestUseCase({ userId, friendshipId });

  return sendUseCaseResponse(req, res, result);
}
