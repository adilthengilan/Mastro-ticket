import 'dotenv/config';
import express from 'express';
import crypto from 'crypto';
import path from 'path';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
]);

const ALLOWED_FOLDERS = new Set([
  'mastrotickets/events',
  'mastrotickets/tickets',
  'mastrotickets/concerts',
  'mastrotickets/packages',
]);

function getCloudinaryCredentials(): {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
} | null {
  let cloudName = (process.env.CLOUDINARY_CLOUD_NAME || '').trim();
  let apiKey = (process.env.CLOUDINARY_API_KEY || '').trim();
  let apiSecret = (process.env.CLOUDINARY_API_SECRET || '').trim();

  // Support standard CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
  const rawUrl = (process.env.CLOUDINARY_URL || '').trim();
  if ((!cloudName || !apiKey || !apiSecret) && rawUrl.startsWith('cloudinary://')) {
    try {
      const parsed = new URL(rawUrl);
      apiKey = apiKey || decodeURIComponent(parsed.username);
      apiSecret = apiSecret || decodeURIComponent(parsed.password);
      cloudName = cloudName || parsed.hostname;
    } catch {
      // Ignore malformed CLOUDINARY_URL
    }
  }

  if (!cloudName || !apiKey || !apiSecret) {
    return null;
  }

  return { cloudName, apiKey, apiSecret };
}

function signCloudinaryParams(
  params: Record<string, string | number>,
  apiSecret: string
): string {
  const sorted = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  return crypto
    .createHash('sha1')
    .update(`${sorted}${apiSecret}`)
    .digest('hex');
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB max
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new Error('Only JPG, PNG, WebP, and AVIF images are allowed.'));
      return;
    }
    cb(null, true);
  },
});

async function startServer() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));

  // Cloudinary configuration readiness check (never exposes secrets)
  app.get('/api/uploads/cloudinary/status', (_req, res) => {
    const creds = getCloudinaryCredentials();
    res.json({ configured: Boolean(creds) });
  });

  // Server-side signed Cloudinary image upload endpoint
  app.post('/api/uploads/cloudinary', (req, res) => {
    upload.single('file')(req, res, async (multerErr) => {
      if (multerErr) {
        res.status(400).json({
          success: false,
          message: multerErr instanceof Error ? multerErr.message : 'Invalid file upload.',
        });
        return;
      }

      const file = req.file;
      if (!file) {
        res.status(400).json({ success: false, message: 'No image file provided.' });
        return;
      }

      const creds = getCloudinaryCredentials();
      if (!creds) {
        res.status(503).json({
          success: false,
          message:
            'Cloudinary credentials are not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in environment secrets.',
        });
        return;
      }

      const requestedFolder = typeof req.body?.folder === 'string' ? req.body.folder.trim() : '';
      const folder = ALLOWED_FOLDERS.has(requestedFolder)
        ? requestedFolder
        : 'mastrotickets/tickets';

      try {
        const timestamp = Math.floor(Date.now() / 1000);
        const signature = signCloudinaryParams({ folder, timestamp }, creds.apiSecret);

        const base64DataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
        const form = new FormData();
        form.append('file', base64DataUri);
        form.append('api_key', creds.apiKey);
        form.append('timestamp', String(timestamp));
        form.append('folder', folder);
        form.append('signature', signature);

        const uploadUrl = `https://api.cloudinary.com/v1_1/${encodeURIComponent(
          creds.cloudName
        )}/image/upload`;

        const cloudResponse = await fetch(uploadUrl, {
          method: 'POST',
          body: form,
        });

        const cloudData = (await cloudResponse.json()) as {
          secure_url?: string;
          public_id?: string;
          width?: number;
          height?: number;
          format?: string;
          error?: { message?: string };
        };

        if (!cloudResponse.ok || !cloudData.secure_url) {
          res.status(502).json({
            success: false,
            message: cloudData?.error?.message || 'Cloudinary rejected the image upload.',
          });
          return;
        }

        res.json({
          success: true,
          url: cloudData.secure_url,
          publicId: cloudData.public_id || '',
          width: cloudData.width,
          height: cloudData.height,
          format: cloudData.format,
        });
      } catch (err) {
        console.error('Cloudinary upload proxy error:', err);
        res.status(500).json({
          success: false,
          message: 'Failed to upload image to Cloudinary.',
        });
      }
    });
  });

  if (!IS_PROD) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MastroTickets server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start MastroTickets server:', err);
  process.exit(1);
});
