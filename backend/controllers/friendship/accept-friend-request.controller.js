// backend/controllers/friendship/accept-friend-request.controller.js

import { acceptFriendRequestUseCase } from "../../use-cases/friendship/accept-friend-request.use-case.js";
import { sendUseCaseResponse } from "../auth/auth-shared.js";

/**
 * Accept Friend Request Controller — Thin HTTP adapter.
 * Parses request, delegates to acceptFriendRequestUseCase, returns response.
 */
export async function handleAcceptFriendRequest(req, res) {
  const { friendshipId } = req.params;
  const userId = req.user.userId;

  const result = await acceptFriendRequestUseCase({ userId, friendshipId });

  return sendUseCaseResponse(req, res, result);
}
