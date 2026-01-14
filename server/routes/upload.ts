import { Router } from "express";
import multer from "multer";
import { storagePut } from "../storage";
import { nanoid } from "nanoid";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }

    // Upload para S3
    const fileKey = `uploads/${nanoid()}-${req.file.originalname}`;
    const { url } = await storagePut(
      fileKey,
      req.file.buffer,
      req.file.mimetype
    );

    res.json({ url });
  } catch (error: any) {
    console.error("[UPLOAD] Erro:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
