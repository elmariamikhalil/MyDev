import multer from 'multer';
import multerS3 from 'multer-s3';
import { S3Client } from '@aws-sdk/client-s3';
import path from 'path';

// Validate that AWS keys are present, otherwise warn the user
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.S3_BUCKET_NAME) {
  console.warn('⚠️ WARNING: S3 credentials or Bucket Name are missing in your .env file!');
}

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'missing-key',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'missing-secret',
  },
});

export const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET_NAME || 'missing-bucket',
    // Auto detect content type so images display in browser rather than downloading
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      const uniqueName = Date.now().toString() + '-' + Math.round(Math.random() * 1E9) + ext;
      cb(null, `uploads/${uniqueName}`);
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for safe uploads
  fileFilter: (req, file, cb) => {
    // Restrict to images only
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!') as any, false);
    }
  }
});
