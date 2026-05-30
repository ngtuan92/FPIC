const DetectionResult = require('../models/DetectionResult');

exports.createDetectionResult = async (req, res) => {
  try {
    const { 
      filename, 
      type, 
      detectionType, 
      detections, 
      userNotes, 
      annotatedImage 
    } = req.body;

    const newResult = new DetectionResult({
      filename,
      type,
      detectionType,
      detections,
      detectionsCount: detections?.length || 0,
      annotatedImage,
      userNotes,
      userId: req.user?._id, 
      timestamp: new Date()
    });

    await newResult.save();

    res.status(201).json({
      success: true,
      message: 'Đã lưu kết quả thành công',
      data: newResult
    });
  } catch (error) {
    console.error('Lỗi lưu detection result:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getDetectionResults = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      type, 
      detectionType,
      startDate,
      endDate
    } = req.query;
    
    // Build query filter
    const query = {};
    if (type) query.type = type.toLowerCase();
    if (detectionType) query.detectionType = detectionType;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    
    const skip = (page - 1) * limit;
    
    const results = await DetectionResult
      .find(query)
      .select("-annotatedImage") // Không trả về ảnh để giảm data
      .populate("userId", "fullName email")
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await DetectionResult.countDocuments(query);
    
    res.status(200).json({
      success: true,
      message: "Danh sách kết quả",
      data: results,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getDetectionStats = async (req, res) => {
  try {
    const statsByType = await DetectionResult.aggregate([
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          totalDetections: { $sum: "$detectionsCount" },
          avgDetections: { $avg: "$detectionsCount" }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Thống kê theo detectionType
    const statsByDetectionType = await DetectionResult.aggregate([
      {
        $group: {
          _id: "$detectionType",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Tổng số
    const total = await DetectionResult.countDocuments();
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const dailyStats = await DetectionResult.aggregate([
      {
        $match: {
          timestamp: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$timestamp" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.status(200).json({
      success: true,
      message: "Thống kê",
      data: {
        total,
        byType: statsByType,
        byDetectionType: statsByDetectionType,
        last7Days: dailyStats
      }
    });
  } catch (error) {
    console.error("Lỗi thống kê:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getDetectionResult = async (req, res) => {
  try {
    const result = await DetectionResult
      .findById(req.params.id)
      .populate("userId", "fullName email");
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy kết quả"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Chi tiết kết quả",
      data: result
    });
  } catch (error) {
    console.error("Lỗi lấy chi tiết:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteDetectionResult = async (req, res) => {
  try {
    const result = await DetectionResult.findByIdAndDelete(req.params.id);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy kết quả"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Đã xóa kết quả thành công"
    });
  } catch (error) {
    console.error("Lỗi xóa:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};