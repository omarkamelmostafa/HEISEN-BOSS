// backend/controllers/post/get-post.controller.js

import { getPostUseCase } from "../../use-cases/post/get-post.use-case.js";
import { sendUseCaseResponse } from "../auth/auth-shared.js";

/**
 * Get Single Post Controller
 */
export async function handleGetPost(req, res) {
  const { postId } = req.params;

  const result = await getPostUseCase({ postId });

  return sendUseCaseResponse(req, res, result);
}
