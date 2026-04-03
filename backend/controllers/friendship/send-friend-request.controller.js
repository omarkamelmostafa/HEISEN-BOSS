// backend/controllers/friendship/send-friend-request.controller.js

import { sendFriendRequestUseCase } from "../../use-cases/friendship/send-friend-request.use-case.js";
import { sendUseCaseResponse } from "../auth/auth-shared.js";

/**
 * Send Friend Request Controller — Thin HTTP adapter.
 * Parses request, delegates to sendFriendRequestUseCase, returns response.
 */
export async function handleSendFriendRequest(req, res) {
  const { recipientId } = req.body;
  const userId = req.user.userId;

  const result = await sendFriendRequestUseCase({ userId, recipientId });

  return sendUseCaseResponse(req, res, result);
}
