const path = require("path");
const fs = require("fs");
const Accessory = require("../models/Accessory");
const AccessoryModel = require("../models/Accessory");
const TypeModel = require("../models/TypeAccessory");
const DIR_TYPE = path.join(__dirname, "../public/images");
exports.getAccessories = async (req, res) => {
  try {
    let { page, limit, type } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 12;
    const skip = (page - 1) * limit;

    let accessories = [];
    if (type) {
      accessories = await AccessoryModel.find({ type: type })
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit);
    }

    const totalItem =
      type != null ? accessories.length : await AccessoryModel.countDocuments();

    if (accessories) {
      const accessoriesWithBase64 = accessories.map((accessory) => ({
        ...accessory._doc,
        image: accessory.image
          ? Buffer.from(accessory.image, "base64").toString("utf-8")
          : null,
      }));

      return res.status(200).json({
        status: 200,
        message: "Get data successfully",
        data: accessoriesWithBase64,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalItem / limit),
          totalItem: totalItem,
        },
      });
    } else {
      return res.status(404).json({
        status: 404,
        message: "Accessories not found",
      });
    }
  } catch (e) {
    res.status(500).json({
      status: 500,
      message: `Server error: ${e}`,
    });
  }
};
exports.getAccessory = async (req, res) => {
  try {
    const { id } = req.params;
    const accessory = await AccessoryModel.findById(id);
    if (accessory) {
      return res.status(200).json({
        status: 200,
        message: "get accessory successfully",
        data: accessory,
      });
    } else {
      return res.status(404).json({
        status: 404,
        message: "accessory not found",
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: `Server error: ${error}`,
    });
  }
};
exports.createAccessory = async (req, res) => {
  try {
    const accessory = req.body;

    const type = await TypeModel.findById(accessory.type);
    if (!type) {
      return res.status(404).json({
        status: 404,
        message: "Type not found",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        status: 400,
        message: "No file uploaded",
      });
    }

    const folderPath = path.join(DIR_TYPE, type.title);
    const ext = path.extname(req.file.originalname);
    const name = path.basename(req.file.originalname, ext);
    const fileName = `${name}_${Date.now()}${ext}`;

    const filePath = path.join(folderPath, fileName);
    fs.writeFileSync(filePath, req.file.buffer);

    const imageUrl = `/public/images/${type.title}/${fileName}`;
    const imageBase64 = Buffer.from(imageUrl).toString("base64");
    const newAccessory = new Accessory({
      title: accessory.title,
      description: accessory.description,
      image: imageBase64,
      type: accessory.type,
    });

    await newAccessory.save();

    return res.status(201).json({
      status: 201,
      message: "Create new accessory successfully",
      data: newAccessory,
    });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      status: 500,
      message: `Server error: ${error.message}`,
    });
  }
};
exports.updateAccessory = async (req, res) => {
  try {
    const { id } = req.params;
    const accessory = req.body;
    const existsAccessory = await AccessoryModel.findById(id);
    if (!existsAccessory) {
      return res.status(404).json("ID accessory not found");
    }
    if (req.file) {
      const imageBase64 = req.file.buffer;
      accessory.image = imageBase64;
    }
    const updateAccessory = await AccessoryModel.findByIdAndUpdate(
      id,
      accessory,
      { new: true }
    );
    if (updateAccessory) {
      return res.status(200).json({
        status: 200,
        message: "Cập nhât linh kiện thành công",
        data: updateAccessory,
      });
    } else {
      return res.status(404).json({
        status: 404,
        message: "update accessory failed",
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: `Server error: ${error}`,
    });
  }
};
exports.deleteAccessory = async (req, res) => {
  try {
    const { id } = req.params;

    const existsAccessory = await AccessoryModel.findById(id);
    if (!existsAccessory) {
      return res.status(404).json("ID accessory not found");
    }

    try {
      fs.unlinkSync(
        path.join(
          __dirname,
          "../" + decodeURIComponent(escape(atob(existsAccessory?.image)))
        )
      );
    } catch (err) {
      console.error("Lỗi khi xóa file:", err);
    }
    const deleteAccessory = await AccessoryModel.findByIdAndDelete(id);
    if (deleteAccessory) {
      return res.status(200).json({
        status: 200,
        message: "delete accessory successfully",
      });
    } else {
      return res.status(404).json({
        status: 404,
        message: "delete accessory failed",
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: `Server error: ${error}`,
    });
  }
};
