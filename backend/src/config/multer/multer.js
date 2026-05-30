import multer from "multer";
import path from "path";
import fs from "fs";

// Định nghĩa thư mục lưu file
const uploadDir = "uploads/";

// Kiểm tra và tạo thư mục nếu chưa tồn tại
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình Multer để tránh trùng tên file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    let fileName = file.originalname; // Giữ nguyên tên file
    const filePath = path.join(uploadDir, fileName);

    // Kiểm tra nếu file đã tồn tại, thêm timestamp để tránh trùng
    if (fs.existsSync(filePath)) {
      const ext = path.extname(file.originalname); // Lấy phần mở rộng (.pdf)
      const baseName = path.basename(file.originalname, ext); // Tên file không có đuôi
      fileName = `${baseName}-${Date.now()}${ext}`; // Thêm timestamp vào tên file
    }

    cb(null, fileName);
  },
});

// Kiểm tra file upload (chỉ cho phép PDF)
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Chỉ hỗ trợ upload file PDF!"), false);
  }
};

// Cấu hình upload
const upload = multer({ storage, fileFilter });

export default upload;
