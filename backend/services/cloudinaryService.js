// backend/services/cloudinaryService.js
import cloudinary from "../config/cloudinary.js";
import { Readable } from "stream";

export class CloudinaryService {
  static async createUserFolder(userId) {
    const folderName = `users/${userId}`;

    // Create main user folder
    await cloudinary.api.create_folder(folderName);

    // Create organized subfolders
    const subfolders = ["albums", "avatars", "documents", "temp"];
    for (const subfolder of subfolders) {
      await cloudinary.api.create_folder(`${folderName}/${subfolder}`);
    }

    return folderName;
  }

  static async deleteUserFolder(userId) {
    try {
      // Delete all resources in the folder first
      await cloudinary.api.delete_resources_by_prefix(`users/${userId}/`);
      // Then delete the folder itself
      await cloudinary.api.delete_folder(`users/${userId}`);
    } catch (error) {
      console.warn(
        `Could not delete Cloudinary folder for user ${userId}:`,
        error.message
      );
    }
  }

  static async uploadAvatar(userId, fileBuffer, mimetype) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `users/${userId}/avatars`,
          public_id: "avatar",
          resource_type: "image",
          transformation: [
            {
              width: 400,
              height: 400,
              crop: "fill",
              gravity: "face",
              quality: "auto:good",
              fetch_format: "auto",
            },
          ],
          overwrite: true,
          invalidate: true,
        },
        (error, result) => {
          if (error) {
            console.error(`Cloudinary upload error for user ${userId}:`, error.message);
            reject(error);
          } else {
            resolve({ url: result.secure_url, publicId: result.public_id });
          }
        }
      );
      uploadStream.end(fileBuffer);
    });
  }

  static async deleteImage(publicId) {
    if (!publicId) return;
    try {
      await cloudinary.uploader.destroy(publicId);
      console.log(`Successfully deleted image with publicId: ${publicId}`);
    } catch (error) {
      console.error(`Failed to delete image with publicId ${publicId}:`, error.message);
    }
  }

  static async uploadPostImage(userId, fileBuffer, mimetype) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `users/${userId}/posts`,
          resource_type: "image",
          quality: "auto:good",
          fetch_format: "auto",
        },
        (error, result) => {
          if (error) {
            console.error(`Cloudinary post upload error for user ${userId}:`, error.message);
            reject(error);
          } else {
            resolve({ url: result.secure_url, publicId: result.public_id });
          }
        }
      );
      uploadStream.end(fileBuffer);
    });
  }
}
