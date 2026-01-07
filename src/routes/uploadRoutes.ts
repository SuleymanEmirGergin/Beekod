import { Router } from "express";
import multer from "multer";
import path from "path";
import { requireAdminKey } from "../middleware/adminKey.js";
import { logger } from "../logger.js";

const router = Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Store in public/uploads directory
    cb(null, "public/uploads");
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept only image files
  const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed."));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

// Single image upload endpoint
router.post("/upload/image", requireAdminKey, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "no_file_uploaded" });
    }

    // Return the public URL
    const imageUrl = `/uploads/${req.file.filename}`;
    logger.info("upload.image_success", { filename: req.file.filename, size: req.file.size });

    res.json({
      status: "ok",
      url: imageUrl,
      filename: req.file.filename,
      size: req.file.size,
    });
  } catch (error) {
    logger.error("upload.image_failed", { err: error });
    res.status(500).json({ error: "upload_failed" });
  }
});

// Multiple images upload endpoint
router.post("/upload/images", requireAdminKey, upload.array("images", 10), async (req, res) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ error: "no_files_uploaded" });
    }

    const urls = req.files.map((file) => ({
      url: `/uploads/${file.filename}`,
      filename: file.filename,
      size: file.size,
    }));

    logger.info("upload.images_success", { count: urls.length });

    res.json({
      status: "ok",
      files: urls,
    });
  } catch (error) {
    logger.error("upload.images_failed", { err: error });
    res.status(500).json({ error: "upload_failed" });
  }
});

export { router as uploadRouter };
