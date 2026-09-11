import multer from "multer";

// Memory storage: file buffer is streamed straight to Cloudinary, never written to disk.
const storage = multer.memoryStorage();
export const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } }); // 25MB
