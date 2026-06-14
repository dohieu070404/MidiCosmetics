import { applyImageFallback } from '@/lib/media';
import { mediaUrl } from '@/lib/api/public-api';

export function ImageWithFallback({ src, alt, className = '', ...props }) {
  return <img src={mediaUrl(src)} alt={alt || ''} className={className} onError={applyImageFallback} {...props} />;
}
