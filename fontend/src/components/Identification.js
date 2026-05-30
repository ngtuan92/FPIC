import {
  Typography,
  Modal,
  IconButton,
  Box,
  Button,
  Divider,
  LinearProgress,
  Card,
  Tabs,
  Tab,
} from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import React, {
  useRef,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import axios from "axios";
import {
  UploadOutlined,
  DownloadOutlined,
  SendOutlined,
} from "@ant-design/icons";
import CloseIcon from "@mui/icons-material/Close";
import StopIcon from "@mui/icons-material/Stop";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import MemoryIcon from "@mui/icons-material/Memory";
import Alert from "@mui/material/Alert";
import ImageIcon from "@mui/icons-material/Image";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { REACT_APP_URL_PYTHON, REACT_APP_URL_BE } from "../config";
import api from "../api";

const labels_R = ["FP", "VIAS", "TP", "LPC", "UP", "JTAG", "SMB", "SPI", "C", "BTN", "CR", "IC", "F", "FB", "JP", "L", "LED", "J", "M", "P", "Q", "QA", "CRA", "R", "D", "SW", "T", "U", "V", "RA", "RN"];

const STORAGE_KEYS = {
  SELECT_LABEL: "dashboard_select_label",
};

function Dashboard() {
  // ===== STATE MANAGEMENT =====
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [imageUrlsOld, setImageUrlsOld] = useState([]);
  const [processedResults, setProcessedResults] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState(null);
  const [status, setStatus] = useState(false);
  const [statusNew, setStatusNew] = useState(false);
  const [selectLabel, setSelectLabel] = useState("");
  const [userNotes, setUserNotes] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [sendingStates, setSendingStates] = useState({});
  const [successMessages, setSuccessMessages] = useState({});
  const [activeImageTabs, setActiveImageTabs] = useState({});

  // ===== REFS =====
  const fileInputRef = useRef(null);
  const abortControllerRef = useRef(null);

  // ===== EFFECTS =====
  useEffect(() => {
    try {
      const savedSelectLabel = localStorage.getItem(STORAGE_KEYS.SELECT_LABEL);
      if (savedSelectLabel) {
        setSelectLabel(savedSelectLabel);
      }
    } catch (error) {
      console.error("Lỗi khi load localStorage:", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SELECT_LABEL, selectLabel);
    } catch (error) {
      console.error("Lỗi save select label:", error);
    }
  }, [selectLabel]);

  const compressBase64Image = (base64, maxWidth = 1920, quality = 0.8) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = base64;
    });
  };

  const handleSendResult = useCallback(
    async (resultIndex) => {
      const result = processedResults[resultIndex];

      if (!result) {
        setError("Không tìm thấy kết quả!");
        return;
      }

      setSendingStates((prev) => ({ ...prev, [resultIndex]: true }));
      setError(null);

      try {
        console.log("🗜️ Đang nén ảnh...");

        const compressedAnnotated = await compressBase64Image(
          result.annotatedImage,
          1920,
          0.75
        );

        console.log("✅ Nén xong:", compressedAnnotated.length, "bytes");

        const submitData = {
          filename: result.filename,
          type: result.type,
          detectionType: selectLabel,
          detections: result.detections,
          userNotes: userNotes[resultIndex] || "",
          annotatedImage: compressedAnnotated,
          timestamp: new Date().toISOString(),
        };

        const response = await api.post(`${REACT_APP_URL_BE}/detection-result`, submitData);

        setSuccessMessages((prev) => ({
          ...prev,
          [resultIndex]: "Đã gửi thành công!",
        }));

        setTimeout(() => {
          setSuccessMessages((prev) => {
            const newState = { ...prev };
            delete newState[resultIndex];
            return newState;
          });
        }, 3000);
      } catch (error) {
        if (error.response?.status === 413) {
          setError("Ảnh quá lớn! Vui lòng giảm độ phân giải.");
        } else {
          setError(`Lỗi: ${error.response?.data?.message || error.message}`);
        }
        console.error("❌ Lỗi:", error);
      } finally {
        setSendingStates((prev) => ({ ...prev, [resultIndex]: false }));
      }
    },
    [processedResults, userNotes, selectLabel]
  );

  const clearAllData = useCallback(() => {
    if (window.confirm("Xóa tất cả dữ liệu và bắt đầu lại?")) {
      try {
        localStorage.clear();
      } catch (error) {
        console.error("Lỗi clear storage:", error);
      }
      setSelectedFiles([]);
      setImageUrlsOld([]);
      setProcessedResults([]);
      setCurrentImageIndex(0);
      setSelectLabel("");
      setUserNotes({});
      setSendingStates({});
      setSuccessMessages({});
      setActiveImageTabs({});
      setError(null);
      console.log("✅ Đã xóa tất cả dữ liệu");
    }
  }, []);

  const handleOnChange = useCallback((event, value) => {
    setSelectLabel(value);
    setError(null);
  }, []);

  const handleFileChange = useCallback(
    (event) => {
      const newFiles = Array.from(event.target.files);
      if (newFiles.length === 0) return;

      const validFiles = newFiles.filter((file) => {
        const isImage = file.type.startsWith("image/");
        if (!isImage) {
          setError(`File ${file.name} không phải là ảnh hợp lệ`);
        }
        return isImage;
      });

      if (validFiles.length === 0) return;

      setStatus(true);
      setError(null);

      const combinedFiles = [...selectedFiles, ...validFiles];
      setSelectedFiles(combinedFiles);

      const readers = [];
      const newImageUrls = [];

      validFiles.forEach((file, index) => {
        const reader = new FileReader();
        readers.push(reader);
        reader.onloadend = () => {
          newImageUrls[index] = reader.result;

          if (newImageUrls.filter(Boolean).length === validFiles.length) {
            setImageUrlsOld((prev) => [...prev, ...newImageUrls]);
            setStatus(false);
          }
        };
        reader.onerror = () => {
          setError(`Lỗi đọc file ${file.name}`);
          setStatus(false);
        };
        reader.readAsDataURL(file);
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [selectedFiles]
  );

  const handleRemoveImage = useCallback(
    (index) => {
      const newFiles = [...selectedFiles];
      const newImages = [...imageUrlsOld];
      newFiles.splice(index, 1);
      newImages.splice(index, 1);
      setSelectedFiles(newFiles);
      setImageUrlsOld(newImages);

      if (newImages.length === 0) {
        setProcessedResults([]);
        setCurrentImageIndex(0);
        setError(null);
      }
    },
    [selectedFiles, imageUrlsOld]
  );

  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsProcessing(false);
      setStatusNew(false);
      setError("Đã hủy quá trình kiểm tra");
    }
  }, []);

  const handleUpload = useCallback(async () => {
    setStatusNew(true);
    setIsProcessing(true);
    setError(null);

    if (selectedFiles.length === 0) {
      setStatusNew(false);
      setIsProcessing(false);
      setError("Chưa chọn ảnh nào!");
      return;
    }

    if (!selectLabel) {
      setStatusNew(false);
      setIsProcessing(false);
      setError("Vui lòng chọn loại kiểm tra!");
      return;
    }

    abortControllerRef.current = new AbortController();

    try {
      const formData = new FormData();

      selectedFiles.forEach((file) => {
        formData.append("images", file);
      });

      formData.append("target_type", selectLabel.toLowerCase());

      const response = await axios.post(
        `${REACT_APP_URL_PYTHON}/api/predict`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 120000,
          signal: abortControllerRef.current.signal,
        }
      );

      const results = response.data.results || [];

      if (results.length === 0) {
        setError("Không nhận được kết quả từ server");
        setStatusNew(false);
        setIsProcessing(false);
        return;
      }

      const formattedResults = results.map((result, idx) => ({
        filename: result.filename,
        type: result.type,
        originalImage: imageUrlsOld[idx],
        annotatedImage: result.annotated_image,
        detections: result.detections || [],
      }));

      setProcessedResults(formattedResults);
      setCurrentImageIndex(0);

      const initialTabs = {};
      formattedResults.forEach((_, idx) => {
        initialTabs[idx] = 1;
      });
      setActiveImageTabs(initialTabs);

      const newNotes = {};
      formattedResults.forEach((_, idx) => {
        newNotes[idx] = userNotes[idx] || "";
      });
      setUserNotes(newNotes);

      setStatusNew(false);
      setIsProcessing(false);
      console.log("✅ Hoàn thành kiểm tra");
    } catch (error) {
      if (error.name === "CanceledError" || error.code === "ERR_CANCELED") {
        setError("Đã hủy quá trình kiểm tra");
      } else if (error.code === "ECONNABORTED") {
        setError("Timeout! Vui lòng kiểm tra kết nối mạng.");
      } else if (error.response) {
        setError(
          `Lỗi server: ${
            error.response.data.detail || error.response.statusText
          }`
        );
      } else if (error.request) {
        setError("Không thể kết nối đến server.");
      } else {
        setError(`Lỗi: ${error.message}`);
      }
      console.error("❌ Lỗi:", error);
      setStatusNew(false);
      setIsProcessing(false);
    }
  }, [selectedFiles, imageUrlsOld, selectLabel, userNotes]);

  const handleUploadButtonClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const openModal = useCallback((imageSrc) => {
    setModalImage(imageSrc);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleImageTabChange = useCallback((idx, newValue) => {
    setActiveImageTabs((prev) => ({
      ...prev,
      [idx]: newValue,
    }));
  }, []);

  const isUploadDisabled = useMemo(() => {
    return !selectLabel || imageUrlsOld.length === 0 || isProcessing;
  }, [selectLabel, imageUrlsOld, isProcessing]);

  // ===== RENDER =====
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        gap: 3,
        width: "100%",
        minHeight: "90vh",
        p: 2,
      }}
    >
      {/* ===== SIDEBAR ===== */}
      <Box
        sx={{
          width: 340,
          minHeight: 600,
          bgcolor: "#fff",
          borderRadius: 3,
          boxShadow: 3,
          p: 3,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Typography sx={{ fontWeight: 700, fontSize: 19, mb: 1 }}>
          Chọn loại kiểm tra
        </Typography>

        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 1 }}>
            {error}
          </Alert>
        )}

        <Autocomplete
          disabled={isProcessing}
          sx={{ width: "100%" }}
          options={labels_R}
          onChange={handleOnChange}
          value={selectLabel}
          freeSolo={false}
          getOptionLabel={(option) => option}
          isOptionEqualToValue={(option, value) => option === value}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Loại kiểm tra"
              placeholder="Chọn một loại"
              size="small"
              disabled={isProcessing}
            />
          )}
        />

        <Button
          startIcon={<UploadOutlined />}
          disabled={isProcessing}
          sx={{
            background: "#3892ee7d",
            p: "8px 14px",
            fontSize: "14px",
            borderRadius: 2,
            fontWeight: "bold",
            textTransform: "none",
            color: "#000",
            "&:disabled": { background: "#ccc", color: "#666" },
            "&:hover": { background: "#257be2", color: "#fff" },
          }}
          onClick={handleUploadButtonClick}
        >
          Thêm ảnh ({imageUrlsOld.length})
        </Button>

        <input
          type="file"
          multiple
          accept="image/*"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
          disabled={isProcessing}
        />

        {status && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CircularProgress size={20} />
            <Typography sx={{ fontSize: 13 }}>Đang tải ảnh...</Typography>
          </Box>
        )}

        {imageUrlsOld.length > 0 && (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 1,
              maxHeight: 250,
              overflowY: "auto",
              p: 1,
              bgcolor: "#f5f5f5",
              borderRadius: 2,
              "&::-webkit-scrollbar": { width: "8px" },
              "&::-webkit-scrollbar-thumb": {
                background: "#257be2",
                borderRadius: "4px",
              },
            }}
          >
            {imageUrlsOld.map((img, idx) => (
              <Box
                key={idx}
                sx={{
                  position: "relative",
                  width: 80,
                  height: 80,
                  border:
                    currentImageIndex === idx && processedResults.length > 0
                      ? "2.5px solid #257be2"
                      : "1.5px solid #3892ee44",
                  borderRadius: 2,
                  overflow: "hidden",
                  boxShadow: 1,
                  cursor: isProcessing ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  opacity: isProcessing ? 0.5 : 1,
                  "&:hover": isProcessing
                    ? {}
                    : { boxShadow: 3, transform: "scale(1.05)" },
                }}
                onClick={() =>
                  !isProcessing &&
                  processedResults.length > 0 &&
                  setCurrentImageIndex(idx)
                }
              >
                <img
                  src={img}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                  alt={`Ảnh ${idx + 1}`}
                  loading="lazy"
                />
                <IconButton
                  size="small"
                  disabled={isProcessing}
                  sx={{
                    position: "absolute",
                    top: 2,
                    right: 2,
                    background: "#fffc",
                    p: 0.3,
                    "&:hover": { background: "#fff" },
                    "&:disabled": { background: "#ddd", opacity: 0.5 },
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isProcessing) handleRemoveImage(idx);
                  }}
                >
                  <CloseIcon sx={{ fontSize: 16 }} />
                </IconButton>
                <Typography
                  sx={{
                    position: "absolute",
                    bottom: 2,
                    left: 2,
                    background: "#000a",
                    color: "#fff",
                    px: 0.5,
                    py: 0.2,
                    fontSize: 11,
                    borderRadius: 0.5,
                    fontWeight: 600,
                  }}
                >
                  {idx + 1}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        <Box sx={{ display: "flex", gap: 1, mt: "auto" }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleUpload}
            sx={{
              flex: 1,
              fontWeight: 600,
              fontSize: 15,
              p: "9px 0",
              borderRadius: 2,
              boxShadow: 2,
              background: "#257be2",
              textTransform: "none",
              "&:disabled": { background: "#ccc" },
              "&:hover": { background: "#1565c0" },
            }}
            disabled={isUploadDisabled}
          >
            {statusNew ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Kiểm tra"
            )}
          </Button>

          {isProcessing && (
            <Button
              variant="outlined"
              color="error"
              onClick={handleStop}
              startIcon={<StopIcon />}
              sx={{
                fontWeight: 600,
                fontSize: 15,
                p: "9px 16px",
                borderRadius: 2,
                textTransform: "none",
                borderColor: "#d32f2f",
                color: "#d32f2f",
                "&:hover": { borderColor: "#b71c1c", background: "#ffebee" },
              }}
            >
              Dừng
            </Button>
          )}
        </Box>

        {statusNew && (
          <Box sx={{ width: "100%" }}>
            <LinearProgress />
          </Box>
        )}

        <Button
          size="small"
          onClick={clearAllData}
          disabled={isProcessing}
          sx={{ textTransform: "none", color: "#d32f2f" }}
        >
          Xóa tất cả dữ liệu
        </Button>
      </Box>

      {/* ===== RESULTS AREA ===== */}
      <Box
        sx={{
          flex: 1,
          minHeight: 600,
          bgcolor: "#f8fafd",
          borderRadius: 3,
          boxShadow: 2,
          p: 3,
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          "&::-webkit-scrollbar": { width: "10px" },
          "&::-webkit-scrollbar-track": {
            background: "#f1f1f1",
            borderRadius: "10px",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "#257be2",
            borderRadius: "10px",
          },
          "&::-webkit-scrollbar-thumb:hover": { background: "#1565c0" },
        }}
      >
        {statusNew && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
            }}
          >
            <CircularProgress size={60} />
            <Typography sx={{ fontSize: 16, color: "#666", mt: 2 }}>
              Đang xử lý...
            </Typography>
          </Box>
        )}

        {!statusNew && processedResults.length > 0 ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Box>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: 18,
                  color: "#1976d2",
                  mb: 1,
                }}
              >
                📋 Kết quả kiểm tra
              </Typography>
            </Box>

            {processedResults.map((result, idx) => (
              <Card
                key={idx}
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  boxShadow: 1,
                  border:
                    currentImageIndex === idx
                      ? "2px solid #257be2"
                      : "1px solid #e0e0e0",
                  transition: "all 0.3s",
                  cursor: "pointer",
                  "&:hover": { boxShadow: 3, border: "2px solid #257be2" },
                }}
                onClick={() => setCurrentImageIndex(idx)}
              >
                {/* ===== IMAGE COMPARISON SECTION ===== */}
                <Box
                  sx={{ display: "flex", gap: 2, mb: 2 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Box
                    sx={{
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <Tabs
                      value={activeImageTabs[idx] ?? 1}
                      onChange={(e, newValue) =>
                        handleImageTabChange(idx, newValue)
                      }
                      sx={{
                        minHeight: 40,
                        mb: 1,
                        "& .MuiTab-root": {
                          minHeight: 40,
                          fontSize: 13,
                          textTransform: "none",
                          fontWeight: 600,
                        },
                      }}
                    >
                      <Tab
                        icon={<ImageIcon sx={{ fontSize: 16 }} />}
                        iconPosition="start"
                        label="Ảnh gốc"
                        value={0}
                      />
                      <Tab
                        icon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                        iconPosition="start"
                        label={`Kết quả nhận diện`}
                        value={1}
                      />
                    </Tabs>

                    <Box
                      sx={{
                        width: "100%",
                        height: 500,
                        borderRadius: 2,
                        overflow: "hidden",
                        bgcolor: "#f5f5f5",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "2px solid #e0e0e0",
                        position: "relative",
                      }}
                    >
                      <img
                        src={
                          activeImageTabs[idx] === 0
                            ? result.originalImage
                            : result.annotatedImage
                        }
                        alt={
                          activeImageTabs[idx] === 0
                            ? "Ảnh gốc"
                            : "Kết quả nhận diện"
                        }
                        style={{
                          maxWidth: "100%",
                          maxHeight: "100%",
                          cursor: "pointer",
                          objectFit: "contain",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          openModal(
                            activeImageTabs[idx] === 0
                              ? result.originalImage
                              : result.annotatedImage
                          );
                        }}
                      />

                      <Box
                        sx={{
                          position: "absolute",
                          top: 12,
                          right: 12,
                          bgcolor:
                            activeImageTabs[idx] === 0 ? "#2196f3" : "#4caf50",
                          color: "#fff",
                          px: 2,
                          py: 1,
                          borderRadius: 2,
                          fontSize: 14,
                          fontWeight: 700,
                          boxShadow: 2,
                        }}
                      >
                        {activeImageTabs[idx] === 0
                          ? "Gốc"
                          : `✓ Nhận dạng linh kiện`}
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        mt: 2,
                        display: "flex",
                        gap: 2,
                        alignItems: "center",
                      }}
                    >
                      <Typography
                        sx={{ fontSize: 14, fontWeight: 600, color: "#333" }}
                      >
                        📁 {result.filename}
                      </Typography>
                      <Typography sx={{ fontSize: 13, color: "#666" }}>
                        Loại:{" "}
                        <span style={{ color: "#257be2", fontWeight: 600 }}>
                          {result.type.toUpperCase()}
                        </span>
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ mb: 2 }} onClick={(e) => e.stopPropagation()}>
                  <Typography
                    sx={{ fontSize: 13, fontWeight: 600, color: "#333", mb: 1 }}
                  >
                    💬 Ghi chú:
                  </Typography>
                  <TextField
                    multiline
                    rows={2}
                    fullWidth
                    size="small"
                    placeholder="Nhập ý kiến về kết quả này..."
                    value={userNotes[idx] || ""}
                    onChange={(e) => {
                      setUserNotes((prev) => ({
                        ...prev,
                        [idx]: e.target.value,
                      }));
                    }}
                    disabled={sendingStates[idx]}
                    sx={{
                      bgcolor: "#f9f9f9",
                      "& .MuiOutlinedInput-root": { borderRadius: 1 },
                    }}
                  />
                </Box>

                {successMessages[idx] && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    {successMessages[idx]}
                  </Alert>
                )}

                <Box
                  sx={{ display: "flex", gap: 1 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<DownloadOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      const link = document.createElement("a");
                      link.href = result.annotatedImage;
                      link.download = `PCB-${
                        result.filename || `image-${idx + 1}`
                      }.png`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    disabled={sendingStates[idx]}
                    sx={{
                      fontWeight: 600,
                      color: "#1976d2",
                      borderColor: "#c7dceb",
                      textTransform: "none",
                      fontSize: 13,
                      "&:hover": { borderColor: "#1976d2", bgcolor: "#e3f2fd" },
                      "&:disabled": { color: "#ccc", borderColor: "#eee" },
                    }}
                  >
                    Tải ảnh kết quả
                  </Button>

                  <Button
                    variant="contained"
                    size="small"
                    startIcon={
                      sendingStates[idx] ? (
                        <CircularProgress size={16} sx={{ color: "#fff" }} />
                      ) : (
                        <SendOutlined />
                      )
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSendResult(idx);
                    }}
                    disabled={sendingStates[idx]}
                    sx={{
                      fontWeight: 600,
                      bgcolor: "#4caf50",
                      textTransform: "none",
                      fontSize: 13,
                      "&:hover": { bgcolor: "#388e3c" },
                      "&:disabled": { bgcolor: "#ccc" },
                    }}
                  >
                    {sendingStates[idx] ? "Đang gửi..." : "Gửi đánh giá"}
                  </Button>
                </Box>
              </Card>
            ))}
          </Box>
        ) : (
          !statusNew && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: "#999",
              }}
            >
              <MemoryIcon sx={{ fontSize: 80, mb: 2, opacity: 0.3 }} />
              <Typography sx={{ fontSize: 16, fontWeight: 500 }}>
                Chưa có kết quả kiểm tra
              </Typography>
              <Typography sx={{ fontSize: 14, mt: 1 }}>
                Vui lòng chọn ảnh và nhấn "Kiểm tra"
              </Typography>
            </Box>
          )
        )}
      </Box>

      {/* ===== MODAL ===== */}
      <Modal
        open={isModalOpen}
        onClose={closeModal}
        sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <Box
          sx={{
            position: "relative",
            width: "90vw",
            height: "90vh",
            bgcolor: "#000",
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <IconButton
            onClick={closeModal}
            sx={{
              position: "absolute",
              top: 15,
              right: 15,
              color: "white",
              zIndex: 10,
              bgcolor: "#0003",
              "&:hover": { bgcolor: "#0005" },
            }}
          >
            <CloseIcon />
          </IconButton>
          <img
            src={modalImage}
            alt="Phóng to"
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        </Box>
      </Modal>
    </Box>
  );
}

export default React.memo(Dashboard);
