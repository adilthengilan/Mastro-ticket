/**
 * Cloudinary Image Upload Service
 * Routes uploads to the server-side signed endpoint `/api/uploads/cloudinary`
 * (keeping CLOUDINARY_API_SECRET strictly on the server), with optional fallback
 * to a configured unsigned browser preset (`VITE_CLOUDINARY_CLOUD_NAME` + `VITE_CLOUDINARY_UPLOAD_PRESET`).
 */

export type CloudinaryFolder =
  | 'mastrotickets/events'
  | 'mastrotickets/tickets'
  | 'mastrotickets/concerts'
  | 'mastrotickets/packages';

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
]);

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return 'Unsupported image format. Please upload a JPG, PNG, WebP, or AVIF image.';
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return 'Image file is too large. Maximum allowed size is 10 MB.';
  }
  return null;
}

export async function checkCloudinaryStatus(): Promise<{
  configured: boolean;
  mode: 'server_signed' | 'client_unsigned' | 'unconfigured';
}> {
  try {
    const res = await fetch('/api/uploads/cloudinary/status');
    if (res.ok) {
      const data = await res.json();
      if (data?.configured) {
        return { configured: true, mode: 'server_signed' };
      }
    }
  } catch {
    // Dev server proxy may not be running in purely static mode
  }

  const clientCloud = (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '').trim();
  const clientPreset = (import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '').trim();
  if (clientCloud && clientPreset) {
    return { configured: true, mode: 'client_unsigned' };
  }

  return { configured: false, mode: 'unconfigured' };
}

export async function uploadImageToCloudinary(
  file: File,
  folder: CloudinaryFolder = 'mastrotickets/tickets'
): Promise<CloudinaryUploadResult> {
  const validationError = validateImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  // 1. Primary path: signed server-side upload via Express proxy (/api/uploads/cloudinary)
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  try {
    const response = await fetch('/api/uploads/cloudinary', {
      method: 'POST',
      body: formData,
    });

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const payload = await response.json();
      if (response.ok && payload?.url) {
        return {
          url: payload.url,
          publicId: payload.publicId || '',
          width: payload.width,
          height: payload.height,
          format: payload.format,
        };
      }
      // If server explicitly responded with a real error (not 404), check unsigned fallback only when unconfigured
      if (response.status !== 404 && response.status !== 503) {
        throw new Error(payload?.message || 'Cloudinary upload failed.');
      }
    }
  } catch (err) {
    // Fall through to unsigned preset only if configured, otherwise rethrow meaningful error
    const clientCloud = (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '').trim();
    const clientPreset = (import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '').trim();
    if (!clientCloud || !clientPreset) {
      if (err instanceof Error) throw err;
      throw new Error(
        'Cloudinary is not configured yet. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in environment secrets.'
      );
    }
  }

  // 2. Optional unsigned preset fallback for static deployments
  const cloudName = (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '').trim();
  const uploadPreset = (import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '').trim();

  if (!cloudName || !uploadPreset) {
    throw new Error(
      'Cloudinary credentials are not configured on the server. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in Settings → Secrets.'
    );
  }

  const unsignedForm = new FormData();
  unsignedForm.append('file', file);
  unsignedForm.append('upload_preset', uploadPreset);
  unsignedForm.append('folder', folder);

  const cloudRes = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`,
    {
      method: 'POST',
      body: unsignedForm,
    }
  );

  const cloudJson = await cloudRes.json();
  if (!cloudRes.ok || !cloudJson?.secure_url) {
    throw new Error(cloudJson?.error?.message || 'Cloudinary unsigned upload failed.');
  }

  return {
    url: cloudJson.secure_url,
    publicId: cloudJson.public_id || '',
    width: cloudJson.width,
    height: cloudJson.height,
    format: cloudJson.format,
  };
}
