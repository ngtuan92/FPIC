import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const UPLOAD_DIR = path.resolve(__dirname, "../../../microchip/");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const originalName = path.parse(file.originalname).name;
    const ext = path.extname(file.originalname);
    const fullPath = path.join(UPLOAD_DIR, originalName + ext);

    if (fs.existsSync(fullPath)) {
      const timestamp = Date.now();
      cb(null, `${originalName}-${timestamp}${ext}`);
    } else {
      cb(null, originalName + ext);
    }
  },
});

const upload = multer({ storage });
export default upload;
