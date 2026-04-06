// backend/validators/comment-validators.js
import { body, param } from "express-validator";

export const createCommentValidationRules = [
  body("content")
    .notEmpty()
    .withMessage("Comment content is required.")
    .bail()
    .isString()
    .withMessage("Comment content must be a string.")
    .bail()
    .isLength({ max: 2000 })
    .withMessage("Comment content cannot exceed 2000 characters.")
    .trim(),
];

export const commentIdValidationRules = [
  param("commentId")
    .notEmpty()
    .withMessage("Comment ID is required.")
    .bail()
    .isString()
    .withMessage("Comment ID must be a string.")
    .bail()
    .isMongoId()
    .withMessage("Comment ID must be a valid MongoDB ObjectId.")
    .trim(),
];
