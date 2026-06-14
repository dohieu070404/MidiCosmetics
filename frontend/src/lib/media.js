export const PLACEHOLDER_IMAGE_URL = 'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=1200&q=80';

export const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;

export const validateLocalImageFile = (file, label = 'Ảnh') => {
  if (!file) return '';
  if (!ALLOWED_IMAGE_MIME_TYPES.has(file.type)) return `${label} chỉ hỗ trợ JPG, PNG hoặc WEBP.`;
  if (file.size > MAX_IMAGE_UPLOAD_BYTES) return `${label} tối đa 5MB.`;
  return '';
};

export const validateLocalImageFiles = (files, label = 'Ảnh') => {
  for (const file of files || []) {
    const error = validateLocalImageFile(file, label);
    if (error) return `${error} File lỗi: ${file.name}`;
  }
  return '';
};

export const applyImageFallback = (event) => {
  if (!event?.currentTarget) return;
  if (event.currentTarget.src !== PLACEHOLDER_IMAGE_URL) event.currentTarget.src = PLACEHOLDER_IMAGE_URL;
};
