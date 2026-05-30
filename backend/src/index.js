const express = require("express");
const app = express();
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const fs = require("fs");
const AccessoryModel = require("./models/Accessory");
const DetectionResult = require("./routers/DetectionResultRouter")
const cors = require("cors")
const db = require("./config/db");
const Account = require("./models/Account");
const SoDoKhoi = require("./models/SoDoKhoi");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const { default: upload } = require("./config/multer/multer");
const { authorize, verifyAdmin, verifyToken } = require("./middleware/auth");
const bodyParse = require("body-parser");
const AccessoryRouter = require("./routers/AccessoryRouter");

const IMAGES_DIR = path.join(__dirname, "img");
const multer = require("multer");
const uploadWeakPoint = multer({ storage: multer.memoryStorage() });
const IMAGES_MICROCHIP = path.join(__dirname, "../microchip");
const { getUserPermissions } = require("./controller/PermissionsController");
const {
  default: uploadMicrochip,
} = require("./config/multer/multerMicrochips");
const TypeModel = require("./models/TypeAccessory");
const {
  getLPC,
  getTestPin,
  getJTAG,
  getFootPrint,
  getUnusedPort,
  getVias,
  getSPI,
  getSMB,
  postWeakPoint,
  deleteWeakPoint,
  updateWeakPoint,
  getDashboardDataWeakPoint,
} = require("./controller/WeakPointController");
const {
  postMicrochip,
  getMicrochips,
  deleteMicrochip,
  updateMicrochip,
  getDashboarData,
} = require("./controller/MicrochipController");
const Microchip = require("./models/Microchip");
const WeakPoint = require("./models/WeakPoint");
const type = require("./routers/TypeAccessoryRouter");

db.connect();
app.use(cors());
//tăng giới hạn
app.use(express.json({ limit: '100mb'}));
app.use(express.urlencoded({
  limit: '100mb',
  extended: true
}))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/public", express.static(path.join(__dirname, "public")));
app.use(cookieParser());
app.use("/uploads", express.static("uploads"));
app.use("/jtag", express.static("jtag"));
app.use("/testpin", express.static("testpin"));
app.use("/lpc", express.static("lpc"));
app.use("/microchip", express.static("microchip"));
app.use("/footprint", express.static("footprint"));
app.use("/unusedPort", express.static("unusedPort"));
app.use("/vias", express.static("vias"));
app.use("/spi", express.static("SPI"));
app.use("/smb", express.static("SMB"));

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập email và mật khẩu" });
    }

    const account = await Account.findOne({ email });

    if (!account) {
      return res.status(401).json({ message: "Email không tồn tại" });
    }

    const isMatch = await bcrypt.compare(password, account.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Mật khẩu không đúng" });
    }

    if (account.status !== "active") {
      return res.status(403).json({
        status: "inactive",
        message: "Tài khoản chưa được kích hoạt",
      });
    }

    const permissions = await getUserPermissions(account.role);

    const token = jwt.sign(
      {
        _id: account._id,
        role: account.role,
      },
      "sown",
      { expiresIn: "12h" }
    );

    return res.json({
      status: "success",
      message: "Đăng nhập thành công",
      token,
      user: {
        _id: account._id,
        fullName: account.fullName,
        email: account.email,
        role: account.role,
        permissions,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      message: "Lỗi server",
      error: error.message,
    });
  }
});

app.get("/authentication", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const data = jwt.verify(token, "sown");
    const account = await Account.findById(data._id).select("-password");

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    res.json({ status: "success", account: account });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    return res.status(401).json({ message: "Invalid token" });
  }
});


app.use(bodyParse.json());
app.use("/", AccessoryRouter);
app.use("/", DetectionResult)

app.get(
  "/images",
  verifyToken,
  authorize(["admin", "assessor", "user"]),
  (req, res) => {
    fs.readdir(IMAGES_DIR, (err, files) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Error reading directory", err });
      }

      const images = files
        .filter((file) => /\.(jpg|jpeg|png|gif)$/i.test(file))
        .map((file) => ({
          name: file,
          img: `/images/${file}`,
        }));

      res.json(images);
    });
  }
);

app.get(
  "/images/count",
  verifyToken,
  authorize(["admin", "assessor", "user"]),
  (req, res) => {
    fs.readdir(IMAGES_DIR, (err, files) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Error reading directory", err });
      }

      const imageCount = files.filter((file) =>
        /\.(jpg|jpeg|png|gif)$/i.test(file)
      ).length;

      res.json({ count: imageCount });
    });
  }
);

app.get(
  "/microchips",
  verifyToken,
  authorize(["admin", "assessor", "user"]),
  getMicrochips
);

app.post(
  "/microchips",
  verifyToken,
  authorize(["admin"]),
  uploadMicrochip.single("image"),
  postMicrochip
);

app.get(
  "/images-microchip/count",
  verifyToken,
  authorize(["admin", "assessor", "user"]),
  (req, res) => {
    fs.readdir(IMAGES_MICROCHIP, (err, files) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Error reading directory", err });
      }

      const imageCount = files.filter((file) =>
        /\.(jpg|jpeg|png|gif)$/i.test(file)
      ).length;

      res.json({ count: imageCount });
    });
  }
);

app.delete(
  "/microchips/:id",
  verifyToken,
  authorize(["admin"]),
  deleteMicrochip
);

app.get(
  "/microchips/dashboard-data",
  verifyToken,
  authorize(["admin"]),
  getDashboarData
);

app.get(
  "/weakpoint/dashboard-data",
  verifyToken,
  authorize(["admin"]),
  getDashboardDataWeakPoint
);

app.put(
  "/microchips/:id",
  verifyToken,
  authorize(["admin"]),
  uploadMicrochip.single("image"),
  updateMicrochip
);

app.get(
  "/images-jtag",
  verifyToken,
  authorize(["admin", "assessor", "user"]),
  getJTAG
);

app.get(
  "/images-test-pin",
  verifyToken,
  authorize(["admin", "assessor", "user"]),
  getTestPin
);

app.get(
  "/images-lpc",
  verifyToken,
  authorize(["admin", "assessor", "user"]),
  getLPC
);

app.get(
  "/images-footprint",
  verifyToken,
  authorize(["admin", "assessor", "user"]),
  getFootPrint
);

app.get(
  "/images-unused-port",
  verifyToken,
  authorize(["admin", "assessor", "user"]),
  getUnusedPort
);

app.get(
  "/images-vias",
  verifyToken,
  authorize(["admin", "assessor", "user"]),
  getVias
);

app.get(
  "/images-spi",
  verifyToken,
  authorize(["admin", "assessor", "user"]),
  getSPI
);

app.get(
  "/images-smb",
  verifyToken,
  authorize(["admin", "assessor", "user"]),
  getSMB
);

app.post(
  "/uploadWeakPoint",
  verifyToken,
  authorize(["admin"]),
  uploadWeakPoint.single("image"),
  postWeakPoint
);

app.delete(
  "/deleteWeakPoint/:id",
  verifyToken,
  authorize(["admin"]),
  uploadWeakPoint.single("image"),
  deleteWeakPoint
);

app.put(
  "/updateWeakPoint/:id",
  verifyToken,
  authorize(["admin"]),
  uploadWeakPoint.single("image"),
  updateWeakPoint
);

app.post(
  "/get-json-file",
  verifyToken,
  authorize(["admin", "assessor", "user"]),
  (req, res) => {
    const { fileName } = req.body;
    const image = fs.readFileSync(
      "D:\\Git\\FPIC\\FPIC\\backend\\src\\img\\" + fileName,
      {
        encoding: "base64",
      }
    );

    const filePath = path.join(
      "D:\\Git\\FPIC\\FPIC\\backend\\src\\ann",
      fileName + ".json"
    );
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        return res.status(404).json({ message: "File not found" });
      }

      fs.readFile(filePath, "utf8", (err, data) => {
        if (err) {
          return res
            .status(500)
            .json({ message: "Error reading file", error: err });
        }

        try {
          const jsonData = JSON.parse(data);
          res.json({ jsonData });
        } catch (parseErr) {
          res
            .status(500)
            .json({ message: "Error parsing JSON", error: parseErr });
        }
      });
    });
  }
);

app.get(
  "/get-classes",
  verifyToken,
  authorize(["admin", "assessor", "user"]),
  (req, res) => {
    const filePath = path.join(__dirname, "meta.json");

    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        return res.status(404).json({ error: "File not found" });
      }

      fs.readFile(filePath, "utf8", (err, data) => {
        if (err) {
          return res.status(500).json({ error: "Error reading file" });
        }

        try {
          const jsonData = JSON.parse(data);
          res.json({ jsonData });
        } catch (error) {
          res.status(500).json({ error: "Error parsing JSON" });
        }
      });
    });
  }
);

app.get(
  "/admin/accounts",
  verifyToken,
  authorize(["admin"]),
  async (req, res) => {
    try {
      const accounts = await Account.find({}, "-password");
      res.json({ status: "success", accounts });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

app.post(
  "/admin/create-account",
  verifyToken,
  authorize(["admin"]),
  async (req, res) => {
    const account = req.body.account;

    try {
      const existingAccount = await Account.findOne({ email: account.email });
      if (existingAccount) {
        return res.status(400).json({ message: "Email đã tồn tại" });
      }

      const hashedPassword = await bcrypt.hash(account.password, 10);

      const newAccount = new Account({
        ...account,
        password: hashedPassword,
      });

      await newAccount.save();
      res
        .status(201)
        .json({ message: "Tài khoản tạo thành công", account: newAccount });
    } catch (error) {
      console.error("Lỗi khi tạo tài khoản:", error);
      res.status(500).json({ message: "Lỗi server" });
    }
  }
);

app.delete(
  "/admin/delete-account",
  verifyToken,
  authorize(["admin"]),
  async (req, res) => {
    const id = req.body.id;
    try {
      const account = await Account.findById(id);
      if (!account) {
        return res
          .status(404)
          .json({ status: 404, message: "Tài khoản không tồn tại." });
      }

      await Account.findByIdAndDelete(id);
      res
        .status(200)
        .json({ status: 200, message: "Tài khoản đã được xóa thành công." });
    } catch (error) {
      console.error("Error deleting account:", error);
      res
        .status(500)
        .json({ status: 500, message: "Có lỗi xảy ra khi xóa tài khoản." });
    }
  }
);

app.put(
  "/admin/update-account/:id",
  verifyToken,
  authorize(["admin"]),
  async (req, res) => {
    const { id } = req.params;
    const accountUpdated = req.body;

    try {
      const account = await Account.findByIdAndUpdate(
        id,
        { $set: accountUpdated },
        { new: true, runValidators: true }
      );

      if (!account) {
        return res.status(404).json({ message: "Tài khoản không tồn tại" });
      }
      return res.status(200).json({
        message: "Cập nhật tài khoản thành công",
        account,
      });
    } catch (error) {
      console.error("Error updating account:", error);
      return res.status(500).json({
        message: "Có lỗi xảy ra khi cập nhật tài khoản",
        error: error.message,
      });
    }
  }
);

app.get(
  "/admin/accounts/count",
  verifyToken,
  authorize(["admin"]),
  async (req, res) => {
    const userCount = await Account.countDocuments();
    res.json({ count: userCount });
  }
);

app.use("/", verifyToken, authorize(["admin", "assessor", "user"]), type);

const DIR_TYPE = path.join(__dirname, "public/images");

app.get("/import-types", async (req, res) => {
  try {
    const subfolders = fs
      .readdirSync(DIR_TYPE)
      .filter((folder) =>
        fs.statSync(path.join(DIR_TYPE, folder)).isDirectory()
      );
    const savePromises = subfolders.map(async (folder) => {
      const files = fs
        .readdirSync(path.join(DIR_TYPE, folder))
        .filter(
          (file) =>
            file.endsWith(".png") ||
            file.endsWith("jpg") ||
            file.endsWith("jpeg")
        );

      if (files.length === 0) return null;

      const firstImagePath = `/public/images/${folder}/${files[0]}`;
      const imageBase64 = Buffer.from(firstImagePath).toString("base64");

      const newType = new TypeModel({
        title: folder,
        contentType: "image/png",
        image: imageBase64,
      });

      return await newType.save();
    });

    const results = await Promise.all(savePromises);
    res.json({
      message: `Lưu thành công ${results.filter(Boolean).length} Loại`,
    });
  } catch (error) {
    console.log(`Lưu thất bại: ${error}`);
    res.json({ message: "Lưu thất bại" });
  }
});

const DIR_IMAGE = path.join(__dirname, "public/images/C");

app.get(
  "/import-accessories",
  verifyToken,
  authorize(["admin"]),
  async (req, res) => {
    try {
      const images = fs
        .readdirSync(DIR_IMAGE)
        .filter(
          (image) =>
            image.endsWith(".png") ||
            image.endsWith(".jpg") ||
            image.endsWith(".jpeg")
        );

      if (images.length === 0) return null;

      const saveAccessories = images.map(async (image) => {
        const accessoryPath = `/public/images/C/${image}`;
        const imageBase64 = Buffer.from(accessoryPath).toString("base64");

        const newAccessory = new AccessoryModel({
          title: image,
          description: "",
          image: imageBase64,
          type: "67bb2d4a9e8b6d1860f8dd4f",
        });
        return await newAccessory.save();
      });

      const results = await Promise.all(saveAccessories);
      res.json({
        message: `Lưu thành công ${results.filter(Boolean).length} file`,
      });
    } catch (error) {
      console.log("Lưu thất bại", error);
      res.json({ message: `Lưu thất bại` });
    }
  }
);

// ==================== ACCESSORIES BATCH IMPORT APIs ====================

app.get(
  "/accessories/folders-status",
  verifyToken,
  authorize(["admin"]),
  async (req, res) => {
    try {
      const baseDir = path.join(__dirname, "public/images");
      
      const folders = fs
        .readdirSync(baseDir)
        .filter((item) => {
          const fullPath = path.join(baseDir, item);
          return fs.statSync(fullPath).isDirectory();
        })
        .sort();
      
      const status = [];
      
      for (const folder of folders) {
        const folderPath = path.join(baseDir, folder);
        const imageFiles = fs
          .readdirSync(folderPath)
          .filter((file) => /\.(jpg|jpeg|png|gif|bmp|jfif)$/i.test(file));
        
        const type = await TypeModel.findOne({ title: folder });
        
        let importedCount = 0;
        if (type) {
          importedCount = await AccessoryModel.countDocuments({ 
            type: type._id 
          });
        }
        
        status.push({
          folder: folder,
          hasType: !!type,
          typeId: type?._id || null,
          imagesInFolder: imageFiles.length,
          importedToDB: importedCount,
          remaining: imageFiles.length - importedCount,
          progress: imageFiles.length > 0 
            ? `${Math.round((importedCount / imageFiles.length) * 100)}%`
            : "0%",
          needImport: imageFiles.length > importedCount
        });
      }
      
      const summary = {
        totalFolders: folders.length,
        foldersWithType: status.filter(s => s.hasType).length,
        foldersNeedImport: status.filter(s => s.needImport).length,
        totalImagesInFolders: status.reduce((sum, s) => sum + s.imagesInFolder, 0),
        totalImportedToDB: status.reduce((sum, s) => sum + s.importedToDB, 0)
      };
      
      res.json({
        message: "Trạng thái import của các thư mục",
        summary: summary,
        folders: status
      });
      
    } catch (error) {
      console.error("Lỗi kiểm tra trạng thái:", error);
      res.status(500).json({ 
        message: "Lỗi server", 
        error: error.message 
      });
    }
  }
);

app.post(
  "/accessories/import-all-folders",
  verifyToken,
  authorize(["admin"]),
  async (req, res) => {
    try {
      const baseDir = path.join(__dirname, "public/images");
      
      const folders = fs
        .readdirSync(baseDir)
        .filter((item) => {
          const fullPath = path.join(baseDir, item);
          return fs.statSync(fullPath).isDirectory();
        })
        .sort();
      
      let totalSuccess = 0;
      let totalError = 0;
      let totalSkipped = 0;
      const results = [];
      
      console.log(`🚀 Bắt đầu import ${folders.length} thư mục...`);
      
      for (const folder of folders) {
        try {
          const type = await TypeModel.findOne({ title: folder });
          
          if (!type) {
            console.log(`⚠️ Thư mục ${folder}: Không tìm thấy Type`);
            results.push({
              folder: folder,
              status: "error",
              message: "Type không tồn tại trong database"
            });
            totalError++;
            continue;
          }
          
          const folderPath = path.join(baseDir, folder);
          const images = fs
            .readdirSync(folderPath)
            .filter((file) => /\.(jpg|jpeg|png|gif|bmp|jfif)$/i.test(file))
            .sort();
          
          if (images.length === 0) {
            results.push({
              folder: folder,
              status: "warning",
              message: "Thư mục rỗng"
            });
            continue;
          }
          
          let folderSuccess = 0;
          let folderSkipped = 0;
          
          for (const image of images) {
            const imagePath = `/public/images/${folder}/${image}`;
            
            const exists = await AccessoryModel.findOne({ 
              imagePath: imagePath 
            });
            
            if (!exists) {
              const newAccessory = new AccessoryModel({
                title: "",
                description: "",
                imagePath: imagePath,
                type: type._id
              });
              
              await newAccessory.save();
              folderSuccess++;
              totalSuccess++;
            } else {
              folderSkipped++;
              totalSkipped++;
            }
          }
          
          console.log(`✅ ${folder}: Import ${folderSuccess}, Skip ${folderSkipped}`);
          
          results.push({
            folder: folder,
            typeId: type._id,
            totalImages: images.length,
            imported: folderSuccess,
            skipped: folderSkipped,
            status: "success"
          });
          
        } catch (error) {
          console.error(`❌ Lỗi thư mục ${folder}:`, error);
          totalError++;
          results.push({
            folder: folder,
            status: "error",
            message: error.message
          });
        }
      }
      
      res.json({
        message: `✅ Import hoàn thành! Thêm mới ${totalSuccess} accessories, Skip ${totalSkipped} đã có`,
        totalFolders: folders.length,
        totalSuccess: totalSuccess,
        totalSkipped: totalSkipped,
        totalErrors: totalError,
        results: results
      });
      
    } catch (error) {
      console.error("Lỗi import:", error);
      res.status(500).json({ 
        message: "Lỗi server", 
        error: error.message 
      });
    }
  }
);

app.post(
  "/accessories/import-folder",
  verifyToken,
  authorize(["admin"]),
  async (req, res) => {
    try {
      const { folderName } = req.body;
      
      if (!folderName) {
        return res.status(400).json({ 
          message: "Vui lòng cung cấp folderName" 
        });
      }
      
      const type = await TypeModel.findOne({ title: folderName });
      
      if (!type) {
        return res.status(404).json({ 
          message: `Không tìm thấy Type "${folderName}"` 
        });
      }
      
      const folderPath = path.join(__dirname, `public/images/${folderName}`);
      
      if (!fs.existsSync(folderPath)) {
        return res.status(404).json({ 
          message: `Thư mục ${folderName} không tồn tại` 
        });
      }
      
      const images = fs
        .readdirSync(folderPath)
        .filter((file) => /\.(jpg|jpeg|png|gif|bmp|jfif)$/i.test(file))
        .sort();
      
      if (images.length === 0) {
        return res.status(404).json({ 
          message: `Không có ảnh trong thư mục ${folderName}` 
        });
      }
      
      let successCount = 0;
      let skippedCount = 0;
      const importedItems = [];
      
      for (const image of images) {
        const imagePath = `/public/images/${folderName}/${image}`;
        const exists = await AccessoryModel.findOne({ imagePath });
        
        if (!exists) {
          const newAccessory = new AccessoryModel({
            title: "",
            description: "",
            imagePath: imagePath,
            type: type._id
          });
          
          const saved = await newAccessory.save();
          successCount++;
          importedItems.push({
            _id: saved._id,
            title: saved.title,
            imagePath: saved.imagePath
          });
        } else {
          skippedCount++;
        }
      }
      
      res.json({
        message: `✅ Import ${folderName} hoàn thành!`,
        folderName: folderName,
        typeId: type._id,
        totalImages: images.length,
        imported: successCount,
        skipped: skippedCount,
        importedItems: importedItems.slice(0, 5)
      });
      
    } catch (error) {
      console.error("Lỗi import folder:", error);
      res.status(500).json({ 
        message: "Lỗi server", 
        error: error.message 
      });
    }
  }
);

app.delete(
  "/accessories/cleanup-missing-images",
  verifyToken,
  authorize(["admin"]),
  async (req, res) => {
    try {
      const accessories = await AccessoryModel.find();
      const toDelete = [];
      
      for (const accessory of accessories) {
        let filePath;
        
        if (accessory.imagePath) {
          filePath = path.join(__dirname, accessory.imagePath);
        } else if (accessory.image) {
          continue;
        } else {
          toDelete.push({
            _id: accessory._id,
            title: accessory.title,
            reason: "Không có thông tin ảnh"
          });
          continue;
        }
        
        if (!fs.existsSync(filePath)) {
          toDelete.push({
            _id: accessory._id,
            title: accessory.title,
            imagePath: accessory.imagePath,
            reason: "File không tồn tại"
          });
        }
      }
      
      let deletedCount = 0;
      if (toDelete.length > 0) {
        const ids = toDelete.map(item => item._id);
        const result = await AccessoryModel.deleteMany({ _id: { $in: ids } });
        deletedCount = result.deletedCount;
      }
      
      res.json({
        message: `🧹 Đã dọn dẹp ${deletedCount} accessories`,
        totalChecked: accessories.length,
        foundMissing: toDelete.length,
        deleted: deletedCount,
        deletedItems: toDelete.slice(0, 10)
      });
      
    } catch (error) {
      console.error("Lỗi cleanup:", error);
      res.status(500).json({ 
        message: "Lỗi server", 
        error: error.message 
      });
    }
  }
);

app.get(
  "/accessories/by-type/:typeId",
  verifyToken,
  authorize(["admin", "assessor", "user"]),
  async (req, res) => {
    try {
      const { typeId } = req.params;
      const { page = 1, limit = 50 } = req.query;
      
      const skip = (page - 1) * limit;
      
      const accessories = await AccessoryModel
        .find({ type: typeId })
        .limit(parseInt(limit))
        .skip(skip)
        .sort({ createdAt: -1 });
      
      const total = await AccessoryModel.countDocuments({ type: typeId });
      
      res.json({
        message: "Danh sách accessories",
        typeId: typeId,
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        totalPages: Math.ceil(total / limit),
        accessories: accessories
      });
      
    } catch (error) {
      console.error("Lỗi lấy accessories:", error);
      res.status(500).json({ 
        message: "Lỗi server", 
        error: error.message 
      });
    }
  }
);

app.get(
  "/accessories/search",
  verifyToken,
  authorize(["admin", "assessor", "user"]),
  async (req, res) => {
    try {
      const { keyword, typeId } = req.query;
      let query = {};
      
      if (keyword) {
        query.title = { $regex: keyword, $options: 'i' };
      }
      
      if (typeId) {
        query.type = typeId;
      }
      
      const accessories = await AccessoryModel
        .find(query)
        .populate('type', 'title')
        .limit(100)
        .sort({ createdAt: -1 });
      
      res.json({
        message: "Kết quả tìm kiếm",
        total: accessories.length,
        accessories: accessories
      });
      
    } catch (error) {
      console.error("Lỗi tìm kiếm:", error);
      res.status(500).json({ 
        message: "Lỗi server", 
        error: error.message 
      });
    }
  }
);

app.delete(
  "/accessories/clear-by-type/:typeId",
  verifyToken,
  authorize(["admin"]),
  async (req, res) => {
    try {
      const { typeId } = req.params;
      
      const type = await TypeModel.findById(typeId);
      if (!type) {
        return res.status(404).json({ 
          message: "Không tìm thấy Type" 
        });
      }
      
      const result = await AccessoryModel.deleteMany({ type: typeId });
      
      res.json({
        message: `🗑️ Đã xóa ${result.deletedCount} accessories thuộc type ${type.title}`,
        typeId: typeId,
        typeName: type.title,
        deletedCount: result.deletedCount
      });
      
    } catch (error) {
      console.error("Lỗi xóa:", error);
      res.status(500).json({ 
        message: "Lỗi server", 
        error: error.message 
      });
    }
  }
);

app.delete(
  "/accessories/clear-all",
  verifyToken,
  authorize(["admin"]),
  async (req, res) => {
    try {
      const result = await AccessoryModel.deleteMany({});
      
      res.json({
        message: `🗑️ Đã xóa toàn bộ ${result.deletedCount} accessories`,
        deletedCount: result.deletedCount
      });
      
    } catch (error) {
      console.error("Lỗi xóa tất cả:", error);
      res.status(500).json({ 
        message: "Lỗi server", 
        error: error.message 
      });
    }
  }
);

// ==================== END ACCESSORIES BATCH IMPORT APIs ====================

const FOLDER_CATEGORY_MAPPING = {
  'jtag': 'jtag',
  'testpin': 'testPin', 
  'test-pin': 'testPin',
  'lpc': 'lpc',
  'footprint': 'footprint',
  'unusedport': 'unusedPort',
  'unused-port': 'unusedPort',
  'up': 'unusedPort',
  'vias': 'vias',
  'spi': 'spi',
  'smb': 'smb'
};

function detectCategoryFromFolder(folderName) {
  const normalizedName = folderName.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/\s+/g, '');
  
  if (FOLDER_CATEGORY_MAPPING[normalizedName]) {
    return FOLDER_CATEGORY_MAPPING[normalizedName];
  }
  
  for (const [key, category] of Object.entries(FOLDER_CATEGORY_MAPPING)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return category;
    }
  }
  
  return null;
}

app.post(
  "/import-images-batch-weakpoint",
  verifyToken,
  authorize(["admin"]),
  async (req, res) => {
    try {
      const { 
        sourceFolder, 
        customCategory = null,
        namePrefix = "UP mẫu",
        device = ""
      } = req.body;
      
      if (!sourceFolder) {
        return res.status(400).json({ 
          message: "Vui lòng cung cấp đường dẫn thư mục nguồn" 
        });
      }

      if (!fs.existsSync(sourceFolder)) {
        return res.status(404).json({ 
          message: "Thư mục không tồn tại",
          providedPath: sourceFolder
        });
      }

      const folderName = path.basename(sourceFolder);
      let detectedCategory = detectCategoryFromFolder(folderName);
      
      const finalCategory = customCategory || detectedCategory;
      
      if (!finalCategory) {
        return res.status(400).json({ 
          message: `Không thể nhận diện hạng mục từ thư mục "${folderName}"`,
          availableCategories: Object.values(FOLDER_CATEGORY_MAPPING)
        });
      }

      const images = fs
        .readdirSync(sourceFolder)
        .filter((file) => {
          const ext = path.extname(file).toLowerCase();
          return ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.jfif'].includes(ext);
        })
        .sort();

      if (images.length === 0) {
        return res.status(404).json({ 
          message: "Không tìm thấy file ảnh" 
        });
      }

      const targetDir = path.join(__dirname, "../", finalCategory);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const results = [];
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < images.length; i++) {
        try {
          const originalFile = path.join(sourceFolder, images[i]);
          const fileExt = path.extname(images[i]);
          const newFileName = `${namePrefix} ${i + 1}${fileExt}`;
          const targetFile = path.join(targetDir, newFileName);
          
          if (!fs.existsSync(originalFile)) {
            throw new Error(`File gốc không tồn tại: ${originalFile}`);
          }
          
          fs.copyFileSync(originalFile, targetFile);
          
          if (!fs.existsSync(targetFile)) {
            throw new Error(`Không thể copy file: ${targetFile}`);
          }
          
          const imagePath = `/${finalCategory}/${newFileName}`;

          const newWeakPoint = new WeakPoint({
            name: `${namePrefix} ${i + 1}`,
            description: "",
            imagePath: imagePath,
            category: finalCategory,
            device: device || ""
          });

          await newWeakPoint.save();
          results.push({
            original: images[i],
            newName: newFileName,
            category: finalCategory,
            device: device || "Không xác định",
            success: true
          });
          successCount++;
          
        } catch (error) {
          console.error(`Lỗi xử lý ${images[i]}:`, error);
          results.push({
            original: images[i],
            error: error.message,
            success: false
          });
          errorCount++;
        }
      }

      res.json({
        message: `Import hoàn thành! Thành công: ${successCount}, Lỗi: ${errorCount}`,
        folderName: folderName,
        sourcePath: sourceFolder,
        detectedCategory: detectedCategory,
        finalCategory: finalCategory,
        device: device || "Không xác định",
        total: images.length,
        success: successCount,
        errors: errorCount,
        results: results
      });

    } catch (error) {
      console.error("Lỗi import:", error);
      res.status(500).json({ 
        message: `Lỗi server: ${error.message}` 
      });
    }
  }
);

app.get(
  "/scan-folders-with-images",
  verifyToken,
  authorize(["admin"]),
  (req, res) => {
    try {
      const { rootPath = "C:\\" } = req.query;
      
      const scanDirectory = (dir, maxDepth = 3, currentDepth = 0) => {
        if (currentDepth >= maxDepth) return [];
        
        const items = [];
        try {
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          
          entries.forEach(entry => {
            if (entry.isDirectory()) {
              const fullPath = path.join(dir, entry.name);
              const hasImages = fs.readdirSync(fullPath).some(file => {
                const ext = path.extname(file).toLowerCase();
                return ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.jfif'].includes(ext);
              });
              
              if (hasImages) {
                const detectedCategory = detectCategoryFromFolder(entry.name);
                items.push({
                  name: entry.name,
                  path: fullPath,
                  detectedCategory: detectedCategory,
                  imageCount: fs.readdirSync(fullPath).filter(file => {
                    const ext = path.extname(file).toLowerCase();
                    return ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.jfif'].includes(ext);
                  }).length
                });
              }
              
              items.push(...scanDirectory(fullPath, maxDepth, currentDepth + 1));
            }
          });
        } catch (err) {
        }
        
        return items;
      };

      const foldersWithImages = scanDirectory(rootPath);
      
      res.json({
        message: `Danh sách thư mục có ảnh trong ${rootPath}`,
        total: foldersWithImages.length,
        folders: foldersWithImages,
        availableCategories: Object.values(FOLDER_CATEGORY_MAPPING)
      });
      
    } catch (error) {
      res.status(500).json({ 
        message: `Lỗi quét thư mục: ${error.message}` 
      });
    }
  }
);

app.get(
  "/category-mapping",
  verifyToken,
  authorize(["admin"]),
  (req, res) => {
    res.json({
      message: "Mapping giữa tên thư mục và category",
      mapping: FOLDER_CATEGORY_MAPPING,
      availableCategories: Object.values(FOLDER_CATEGORY_MAPPING)
    });
  }
);

app.delete(
  "/clear-weakpoints-by-category/:category",
  verifyToken,
  authorize(["admin"]),
  async (req, res) => {
    try {
      const { category } = req.params;
      
      const weakPoints = await WeakPoint.find({ category });
      
      const targetDir = path.join(__dirname, "../", category);
      if (fs.existsSync(targetDir)) {
        const files = fs.readdirSync(targetDir);
        files.forEach(file => {
          const filePath = path.join(targetDir, file);
          try {
            fs.unlinkSync(filePath);
          } catch (error) {
            console.error(`Lỗi xóa file ${file}:`, error);
          }
        });
      }
      
      const result = await WeakPoint.deleteMany({ category });
      
      res.json({
        message: `Đã xóa ${result.deletedCount} records`,
        deletedCount: result.deletedCount,
        category: category
      });
    } catch (error) {
      console.error("Lỗi xóa category:", error);
      res.status(500).json({ 
        message: `Lỗi xóa category: ${error.message}` 
      });
    }
  }
);

app.get(
  "/fpic/sodokhoi",
  verifyToken,
  authorize(["admin", "assessor", "user"]),
  async (req, res) => {
    try {
      const list = await SoDoKhoi.find();
      res.json(list);
    } catch (error) {
      console.error("Lỗi lấy danh sách:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

app.post(
  "/fpic/sodokhoi",
  upload.single("pdf"),
  verifyToken,
  authorize(["admin"]),
  async (req, res) => {
    try {
      const { name } = req.body;

      const newSoDoKhoi = new SoDoKhoi({
        name: name,
        filePath: req.file.path,
      });

      await newSoDoKhoi.save();
      res.status(201).json(newSoDoKhoi);
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({
        error: error.message,
        details: error.stack,
      });
    }
  }
);

app.delete(
  "/fpic/sodokhoi/:id",
  verifyToken,
  authorize(["admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      const soDoKhoi = await SoDoKhoi.findById(id);
      if (!soDoKhoi) {
        return res.status(404).json({ error: "Sơ đồ khối không tồn tại!" });
      }

      const filePath = path.join(process.cwd(), soDoKhoi.filePath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      await SoDoKhoi.findByIdAndDelete(id);

      res.status(200).json({ message: "Xóa sơ đồ khối thành công!" });
    } catch (error) {
      console.error("Lỗi khi xóa sơ đồ khối:", error);
      res.status(500).json({ error: "Lỗi server!", details: error.message });
    }
  }
);

app.put(
  "/fpic/sodokhoi/:id",
  verifyToken,
  authorize(["admin"]),
  upload.single("pdf"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name } = req.body;
      const file = req.file;

      const existingFile = await SoDoKhoi.findById(id);
      if (!existingFile) {
        return res.status(404).json({ message: "Không tìm thấy tài liệu" });
      }

      if (file && existingFile.filePath) {
        const oldFilePath = path.join(
          "uploads/",
          existingFile.filePath.split("\\").pop().split("/").pop()
        );
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      const updatedSoDoKhoi = await SoDoKhoi.findByIdAndUpdate(
        id,
        {
          name: name || existingFile.name,
          filePath: file ? file.path : existingFile.filePath,
        },
        { new: true }
      );

      res.json(updatedSoDoKhoi);
    } catch (error) {
      console.error("Lỗi khi cập nhật sơ đồ khối:", error);
      res.status(500).json({ message: "Lỗi server", error: error.message });
    }
  }
);

app.get("/stats", verifyToken, authorize(["admin"]), async (req, res) => {
  try {
    const [
      typeNumber,
      accessoryNumber,
      microchipNumber,
      soDoKhoiNumber,
      weakPointNumber,
      accountNumber,
    ] = await Promise.all([
      TypeModel.countDocuments(),
      AccessoryModel.countDocuments(),
      Microchip.countDocuments(),
      SoDoKhoi.countDocuments(),
      WeakPoint.countDocuments(),
      Account.countDocuments(),
    ]);

    res.json({
      types: typeNumber,
      accessories: accessoryNumber,
      microchips: microchipNumber,
      soDoKhois: soDoKhoiNumber,
      weakPoints: weakPointNumber,
      accounts: accountNumber,
    });
  } catch (error) {
    console.error("Lỗi khi lấy thống kê:", error);
    res.status(500).json({ message: "Lỗi khi lấy thống kê" });
  }
});

app.listen(9999, () => console.log("Server is running on port 9999"));
