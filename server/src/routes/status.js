import express from "express";
import Status from "../models/Status.js";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { uploadBuffer } from "../utils/cloudinary.js";

const router = express.Router();

// Upload a new status (image/video with optional caption, or text-only status).
router.post("/", protect, upload.single("media"), async (req, res) => {
  try {
    const { caption, textOnly } = req.body;
    let mediaUrl = "";
    let mediaType = "text";
    if (req.file) {
      const { url, resourceType } = await uploadBuffer(req.file.buffer, { folder: "dedo/status" });
      mediaUrl = url;
      mediaType = resourceType === "video" ? "video" : "image";
    } else if (!textOnly) {
      return res.status(400).json({ message: "Media file is required unless posting a text status" });
    }
    const status = await Status.create({
      user: req.user._id,
      mediaUrl,
      mediaType,
      caption: caption || "",
    });
    res.status(201).json(status);
  } catch (err) {
    res.status(500).json({ message: "Could not post status", error: err.message });
  }
});

// Get all non-expired statuses, grouped by user (own + everyone else for simplicity;
// swap the User.find filter for a "contacts" list if you add a contacts model).
router.get("/", protect, async (req, res) => {
  const statuses = await Status.find({}).populate("user", "name avatar").sort({ createdAt: -1 });

  const grouped = {};
  for (const s of statuses) {
    const uid = s.user._id.toString();
    if (!grouped[uid]) grouped[uid] = { user: s.user, statuses: [] };
    grouped[uid].statuses.push(s);
  }
  res.json(Object.values(grouped));
});

router.put("/view/:id", protect, async (req, res) => {
  await Status.findByIdAndUpdate(req.params.id, {
    $addToSet: { viewers: { user: req.user._id, viewedAt: new Date() } },
  });
  res.json({ ok: true });
});

export default router;
