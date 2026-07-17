import { v2 as cloudinary } from "cloudinary";
import { env } from "./env.js";

export function isCloudinaryConfigured() {
  return !!(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);
}

export function getCloudinary() {
  if (!isCloudinaryConfigured()) return null;
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME!,
    api_key: env.CLOUDINARY_API_KEY!,
    api_secret: env.CLOUDINARY_API_SECRET!
  });
  return cloudinary;
}
