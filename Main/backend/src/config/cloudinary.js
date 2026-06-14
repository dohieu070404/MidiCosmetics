import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.js';

const hasCloudinaryConfig = () => Boolean(env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret);

export const isCloudinaryConfigured = hasCloudinaryConfig;

export const assertCloudinaryConfigured = () => {
  if (!hasCloudinaryConfig()) {
    throw new Error('UPLOAD_DRIVER=cloudinary requires CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET');
  }
};

export const configureCloudinary = () => {
  if (env.upload.driver !== 'cloudinary') {
    return false;
  }

  assertCloudinaryConfigured();

  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
  });

  return true;
};

export { cloudinary };
