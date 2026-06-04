import { Router } from 'express';
import { upload } from '../middleware/upload';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Handle single image upload via Multer S3
router.post('/image', authenticateToken, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded or file format rejected.' });
    }
    
    // multer-s3 attaches the S3 URL to `file.location`
    const file = req.file as any;
    const imageUrl = file.location; 

    res.json({ url: imageUrl });
  } catch (err: any) {
    console.error('S3 Upload Error:', err);
    res.status(500).json({ error: 'Failed to upload to S3', details: err.message });
  }
});

export default router;
