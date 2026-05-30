const path = require("path");
const fs = require("fs");
const Microchip = require("../models/Microchip");

exports.postMicrochip = async (req, res) => {
  try {
    const { name, description, device } = req.body;
    console.log(req.body);

    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const newMicrochip = new Microchip({
      name,
      description,
      device,
      imagePath: "/microchip/" + req.file.filename,
    });

    await newMicrochip.save();
    res
      .status(201)
      .json({ message: "Microchip created successfully", newMicrochip });
  } catch (error) {
    console.error("Error creating microchip:", error);
    res.status(500).json({ message: "Error creating microchip", error });
  }
};
exports.getMicrochips = async (req, res) => {
  try {
    const microchips = await Microchip.find();
    res
      .status(200)
      .json({ message: "Microchips retrieved successfully", microchips });
  } catch (error) {
    console.error("Error retrieving microchips:", error);
    res.status(500).json({ message: "Error retrieving microchips", error });
  }
};
exports.deleteMicrochip = async (req, res) => {
  try {
    const { id } = req.params;

    const microchip = await Microchip.findByIdAndDelete(id);

    const filePath = path.join(__dirname, "../../", microchip.imagePath);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ message: "Xóa thành công" });
    } else {
      res.status(404).json({ message: "File không tồn tại" });
    }
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: `Server error: ${error.message}`,
    });
  }
};
exports.updateMicrochip = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    if (!req.file) {
      const microchip = await Microchip.findByIdAndUpdate(id, data, {
        new: true,
      });
      res.status(200).json({
        message: "Cập nhật thành công",
        microchip,
      });
    } else {
      const microchip = await Microchip.findById(id);
      const filePath = path.join(__dirname, "../../", microchip.imagePath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      } else {
        res.status(404).json({ message: "File không tồn tại" });
      }
      const newMicrochip = await Microchip.findByIdAndUpdate(
        id,
        {
          ...data,
          imagePath: "/microchip/" + req.file.filename,
        },
        { new: true }
      );
      res.status(200).json({
        message: "Cập nhật thành công",
        microchip: newMicrochip,
      });
    }
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      status: 500,
      message: `Server error: ${error.message}`,
    });
  }
};

exports.getDashboarData = async (req, res) => {
  try {
    const deviceTypes = [
      "Router",
      "PC",
      "USB",
      "Access Point",
      "Switch",
      "Server",
      "FPGA",
    ];

    const deviceCounts = [];
    await Promise.all(
      deviceTypes.map(async (deviceType) => {
        const count = await Microchip.countDocuments({ device: deviceType });
        deviceCounts.push({ name: deviceType, value: count });
      })
    );

    res.status(200).json({
      message: "Dashboard data retrieved successfully",
      data: deviceCounts,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({
      status: 500,
      message: `Server error: ${error.message}`,
    });
  }
};
