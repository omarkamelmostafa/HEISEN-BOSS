// backend/validators/post-validators.js
import { body, param, query } from "express-validator";

export const createPostValidationRules = [
  body("content")
    .notEmpty()
    .withMessage("Post content is required.")
    .bail()
    .isString()
    .withMessage("Post content must be a string.")
    .bail()
    .isLength({ max: 5000 })
    .withMessage("Post content cannot exceed 5000 characters.")
    .trim(),

  body("image")
    .optional({ values: "falsy" })
    .isString()
    .withMessage("Image must be a string.")
    .bail()
    .isURL()
    .withMessage("Image must be a valid URL.")
    .trim(),
];

export const updatePostValidationRules = [
  body("content")
    .optional()
    .isString()
    .withMessage("Post content must be a string.")
    .bail()
    .isLength({ max: 5000 })
    .withMessage("Post content cannot exceed 5000 characters.")
    .trim(),

  body("image")
    .optional({ values: "falsy" })
    .isString()
    .withMessage("Image must be a string.")
    .bail()
    .isURL()
    .withMessage("Image must be a valid URL.")
    .trim(),
];

export const postIdValidationRules = [
  param("postId")
    .notEmpty()
    .withMessage("Post ID is required.")
    .bail()
    .isString()
    .withMessage("Post ID must be a string.")
    .bail()
    .isMongoId()
    .withMessage("Post ID must be a valid MongoDB ObjectId.")
    .trim(),
];

export const feedQueryValidationRules = [
  query("cursor")
    .optional()
    .notEmpty()
    .withMessage("Cursor cannot be empty.")
    .bail()
    .isString()
    .withMessage("Cursor must be a string.")
    .bail()
    .isMongoId()
    .withMessage("Cursor must be a valid MongoDB ObjectId.")
    .trim(),

  query("limit")
    .optional()
    .notEmpty()
    .withMessage("Limit cannot be empty.")
    .bail()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be an integer between 1 and 50.")
    .toInt(),
];
