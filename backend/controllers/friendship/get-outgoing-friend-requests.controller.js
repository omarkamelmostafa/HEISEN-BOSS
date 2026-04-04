// backend/controllers/friendship/get-outgoing-friend-requests.controller.js

import { getOutgoingFriendRequestsUseCase } from "../../use-cases/friendship/get-outgoing-friend-requests.use-case.js";
import { sendUseCaseResponse } from "../auth/auth-shared.js";

/**
 * Get Outgoing Friend Requests Controller — Thin HTTP adapter.
 * Parses request, delegates to getOutgoingFriendRequestsUseCase, returns response.
 */
export async function handleGetOutgoingFriendRequests(req, res) {
  const userId = req.user.userId;

  const result = await getOutgoingFriendRequestsUseCase({ userId });

  return sendUseCaseResponse(req, res, result);
}
