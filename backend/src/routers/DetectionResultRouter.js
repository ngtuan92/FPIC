const express = require("express");
const router = express.Router();
const DetectionResultController = require("../controller/DetectionResultController");
const { verifyToken, authorize } = require("../middleware/auth");

// Lưu kết quả mới
router.post(
  "/detection-result",
  verifyToken,
  authorize(["admin", "assessor", "user"]),
  DetectionResultController.createDetectionResult
);

// Lấy danh sách (có phân trang & filter)
router.get(
  "/detection-results",
  verifyToken,
  authorize(["admin", "assessor"]),
  DetectionResultController.getDetectionResults
);

// Thống kê
router.get(
  "/detection-stats",
  verifyToken,
  authorize(["admin", "assessor"]),
  DetectionResultController.getDetectionStats
);

// Chi tiết
router.get(
  "/detection-result/:id",
  verifyToken,
  authorize(["admin", "assessor", "user"]),
  DetectionResultController.getDetectionResult
);

// Xóa
router.delete(
  "/detection-result/:id",
  verifyToken,
  authorize(["admin"]),
  DetectionResultController.deleteDetectionResult
);

module.exports = router;