// backend/middleware/upload/multer-middleware.js
import multer from "multer";
import { apiResponseManager } from "../../utilities/general/response-manager.js";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(new Error("Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed."));
  } else {
    cb(null, true);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

export const handleAvatarUpload = (req, res, next) => {
  upload.single("avatar")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return apiResponseManager(req, res, {
          statusCode: 400,
          success: false,
          message: "File size exceeds the 5MB limit",
          errorCode: "FILE_TOO_LARGE",
        });
      } else {
        return apiResponseManager(req, res, {
          statusCode: 400,
          success: false,
          message: err.message,
          errorCode: "UPLOAD_ERROR",
        });
      }
    } else if (err) {
      return apiResponseManager(req, res, {
        statusCode: 400,
        success: false,
        message: err.message,
        errorCode: "INVALID_FILE_TYPE",
      });
    }

    if (!req.file) {
      return apiResponseManager(req, res, {
        statusCode: 400,
        success: false,
        message: "No file provided",
        errorCode: "NO_FILE",
      });
    }

    next();
  });
};

export const handlePostImageUpload = (req, res, next) => {
  if (!req.is("multipart/form-data")) {
    return next();
  }

  upload.single("image")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return apiResponseManager(req, res, {
          statusCode: 400,
          success: false,
          message: "File size exceeds the 5MB limit",
          errorCode: "FILE_TOO_LARGE",
        });
      } else {
        return apiResponseManager(req, res, {
          statusCode: 400,
          success: false,
          message: err.message,
          errorCode: "UPLOAD_ERROR",
        });
      }
    } else if (err) {
      return apiResponseManager(req, res, {
        statusCode: 400,
        success: false,
        message: err.message,
        errorCode: "INVALID_FILE_TYPE",
      });
    }

    // Post image is optional - don't require file presence
    next();
  });
};