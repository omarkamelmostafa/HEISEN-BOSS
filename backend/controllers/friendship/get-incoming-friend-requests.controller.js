// backend/controllers/friendship/get-incoming-friend-requests.controller.js

import { getIncomingFriendRequestsUseCase } from "../../use-cases/friendship/get-incoming-friend-requests.use-case.js";
import { sendUseCaseResponse } from "../auth/auth-shared.js";

/**
 * Get Incoming Friend Requests Controller — Thin HTTP adapter.
 * Parses request, delegates to getIncomingFriendRequestsUseCase, returns response.
 */
export async function handleGetIncomingFriendRequests(req, res) {
  const userId = req.user.userId;

  const result = await getIncomingFriendRequestsUseCase({ userId });

  return sendUseCaseResponse(req, res, result);
}
