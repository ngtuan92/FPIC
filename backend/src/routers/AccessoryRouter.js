const express = require("express");
const router = express.Router();
const Accessory = require("../controller/AccessoryController");
const { default: upload } = require("../config/db/upload");
const { verifyToken, authorize } = require("../middleware/auth");

router.get(
  "/accessory",
  verifyToken,
  authorize(["admin", "assessor", "user"]),
  Accessory.getAccessories
);
router.get(
  "/accessory/:id",
  verifyToken,
  authorize(["admin", "assessor", "user"]),
  Accessory.getAccessory
);
router.post(
  "/accessory",
  verifyToken,
  authorize(["admin"]),
  upload.single("file"),
  Accessory.createAccessory
);
router.put(
  "/accessory/:id",
  verifyToken,
  authorize(["admin"]),
  upload.single("file"),
  Accessory.updateAccessory
);
router.delete(
  "/accessory/:id",
  verifyToken,
  authorize(["admin"]),
  Accessory.deleteAccessory
);
module.exports = router;
