import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Grid,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Box,
  CircularProgress,
  IconButton,
  Snackbar,
  Alert,
  Paper,
  Chip,
  Divider,
  InputAdornment,
  Fade,
  useTheme,
  alpha,
  MenuItem,
  Pagination,
  styled,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  Memory,
  Upload,
  Image,
  Visibility,
  CalendarToday,
  Search as SearchIcon,
  Add as AddIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { REACT_APP_URL_BE } from "../config";
import api from "../api";
import { AuthContext } from "../context/AuthContext";
import { hasPermission } from "../helper/function";

const StyledPaper = styled(Paper)(({ theme }) => ({
  borderRadius: "12px",
  position: "relative",
  maxWidth: 600,
  margin: "0",
  boxShadow: theme.shadows[3],
  transition: "all 0.3s ease",
  "&:hover": {
    boxShadow: theme.shadows[6],
  },
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    paddingLeft: "8px",
    "& fieldset": {
      borderColor: theme.palette.grey[300],
    },
    "&:hover fieldset": {
      borderColor: theme.palette.primary.main,
    },
    "&.Mui-focused fieldset": {
      borderWidth: "1px",
      borderColor: theme.palette.primary.main,
    },
  },
}));

const SuggestionsPaper = styled(Paper)(({ theme }) => ({
  position: "absolute",
  top: "calc(100% + 8px)",
  left: 0,
  right: 0,
  zIndex: 1300,
  maxHeight: "400px",
  overflow: "auto",
  borderRadius: "12px",
  boxShadow: theme.shadows[6],
  border: `1px solid ${theme.palette.divider}`,
}));

const AddButton = styled(Button)(({ theme }) => ({
  borderRadius: "28px",
  textTransform: "none",
  fontWeight: 600,
  padding: "10px 24px",
  marginTop: "16px",
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.common.white,
  "&:hover": {
    backgroundColor: theme.palette.primary.dark,
    transform: "translateY(-2px)",
    boxShadow: theme.shadows[4],
  },
  transition: "all 0.3s ease",
}));

const MicrochipList = () => {
  const theme = useTheme();
  const fileInputRef = useRef(null);

  const [microchips, setMicrochips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  const [openDialog, setOpenDialog] = useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [currentMicrochip, setCurrentMicrochip] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [microchipToDelete, setMicrochipToDelete] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const { user } = React.useContext(AuthContext);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: null,
    device: "",
  });

  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [page, setPage] = useState(1);
  const rowsPerPage = 8;

  const filteredMicrochips = microchips.filter(
    (microchip) =>
      microchip.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      microchip.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedMicrochips = filteredMicrochips.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const totalPages = Math.ceil(filteredMicrochips.length / rowsPerPage);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.length > 0) {
      const filtered = microchips
        .filter(
          (microchip) =>
            microchip.name?.toLowerCase().includes(value.toLowerCase()) ||
            microchip.description?.toLowerCase().includes(value.toLowerCase())
        )
        .slice(0, 5);

      setSearchSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (microchip) => {
    setSearchTerm(microchip.name);
    setSearchSuggestions([]);
    setShowSuggestions(false);
  };

  // ✅ Fetch microchips - không set loading khi refresh background
  const fetchMicrochips = useCallback(async (isBackgroundRefresh = false) => {
    try {
      if (!isBackgroundRefresh) {
        setLoading(true);
      }
      
      const response = await api.get(`${REACT_APP_URL_BE}/microchips`);
      
      console.log("📥 Fetched microchips:", response.data.microchips?.length, "items");
      
      setMicrochips(response.data.microchips);
      setLastUpdateTime(Date.now());
      
      return response.data.microchips;
    } catch (error) {
      console.error("❌ Fetch error:", error);
      setSnackbar({ 
        open: true, 
        message: "Lỗi khi tải dữ liệu", 
        severity: "error" 
      });
      if (error.response && error.response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return;
      }
      throw error;
    } finally {
      if (!isBackgroundRefresh) {
        setLoading(false);
      }
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchMicrochips(false);
      } catch (error) {
        console.error("Error fetching microchips:", error);
      }
    };
    fetchData();
  }, [fetchMicrochips]);

  // ✅ Debug: Track state changes
  useEffect(() => {
    console.log("🔄 State changed - Microchips count:", microchips.length);
    console.log("⏰ Last update time:", new Date(lastUpdateTime).toLocaleTimeString());
  }, [microchips, lastUpdateTime]);

  const showSnackbar = useCallback((message, severity) => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const handleOpenDialog = (microchip = null) => {
    if (microchip) {
      console.log("✏️ Opening edit dialog for:", microchip.name);
      setCurrentMicrochip(microchip);
      setFormData({
        name: microchip.name,
        description: microchip.description,
        device: microchip.device,
        image: null,
      });
      setPreviewImage(microchip.imagePath);
    } else {
      console.log("➕ Opening add dialog");
      setCurrentMicrochip(null);
      setFormData({
        name: "",
        description: "",
        image: null,
        device: "",
      });
      setPreviewImage(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    console.log("❌ Closing dialog");
    setOpenDialog(false);
    setPreviewImage(null);
    setCurrentMicrochip(null);
    setFormData({
      name: "",
      description: "",
      image: null,
      device: "",
    });
  };

  const handleOpenDetailsDialog = (microchip) => {
    console.log("👁️ Opening details for:", microchip.name);
    setCurrentMicrochip(microchip);
    setPreviewImage(microchip.imagePath);
    setOpenDetailsDialog(true);
  };

  const handleCloseDetailsDialog = () => {
    console.log("❌ Closing details dialog");
    setOpenDetailsDialog(false);
    setCurrentMicrochip(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log("📁 File selected:", file.name);
      setFormData((prev) => ({ ...prev, image: file }));

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // ✅ GIẢI PHÁP HOÀN CHỈNH: Handle submit với error handling đầy đủ
  const handleSubmit = async () => {
    try {
      const submitData = new FormData();
      submitData.append("name", formData.name);
      submitData.append("description", formData.description);
      submitData.append("device", formData.device);

      if (formData.image) {
        submitData.append("image", formData.image);
      }

      if (currentMicrochip) {
        // ============= UPDATE MODE =============
        console.log("💾 Updating microchip:", currentMicrochip._id);
        
        const response = await api.put(
          `${REACT_APP_URL_BE}/microchips/${currentMicrochip._id}`,
          submitData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        console.log("📤 API Response:", response.data);
        console.log("📋 Response keys:", Object.keys(response.data));

        // Lấy updated microchip từ response (thử nhiều cấu trúc response)
        const updatedMicrochip = 
          response.data.microchip || 
          response.data.updatedMicrochip ||
          response.data.data ||
          response.data;

        console.log("✅ Updated microchip:", updatedMicrochip);

        // Đóng dialog trước để tránh UI lag
        handleCloseDialog();

        // Cập nhật state với data mới
        setMicrochips((prevMicrochips) => {
          const newState = prevMicrochips.map((item) =>
            item._id === currentMicrochip._id 
              ? { ...item, ...updatedMicrochip } // Merge để giữ các field
              : item
          );
          console.log("🔄 Updated state, total items:", newState.length);
          return newState;
        });

        // Force update timestamp để bust cache
        const newTimestamp = Date.now();
        console.log("⏰ Setting new timestamp:", newTimestamp);
        setLastUpdateTime(newTimestamp);

        // Fetch lại sau 300ms để đảm bảo đồng bộ 100%
        setTimeout(async () => {
          console.log("🔃 Background refresh...");
          await fetchMicrochips(true);
        }, 300);

        showSnackbar("Cập nhật vi mạch thành công", "success");

      } else {
        // ============= CREATE MODE =============
        console.log("➕ Creating new microchip");
        
        const response = await api.post(
          `${REACT_APP_URL_BE}/microchips`,
          submitData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );

        console.log("📤 Create response:", response.data);

        const newMicrochip = response.data.newMicrochip || response.data;

        // Đóng dialog trước
        handleCloseDialog();

        // Thêm vào state
        setMicrochips((prev) => {
          console.log("➕ Adding new item, total will be:", prev.length + 1);
          return [...prev, newMicrochip];
        });

        setLastUpdateTime(Date.now());

        // Fetch lại để đảm bảo
        setTimeout(async () => {
          await fetchMicrochips(true);
        }, 300);

        showSnackbar("Thêm vi mạch thành công", "success");
      }

    } catch (error) {
      console.error("❌ Submit error:", error);
      console.error("📋 Error response:", error.response?.data);
      
      let errorMessage = "Lỗi khi lưu vi mạch";
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      showSnackbar(errorMessage, "error");

      if (error.response && error.response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return;
      }
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
    setSearchSuggestions([]);
    setShowSuggestions(false);
  };

  const handleDeleteConfirm = (microchip) => {
    console.log("🗑️ Delete confirm for:", microchip.name);
    setMicrochipToDelete(microchip);
    setIsDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    try {
      console.log("🗑️ Deleting microchip:", microchipToDelete._id);
      
      await api.delete(
        `${REACT_APP_URL_BE}/microchips/${microchipToDelete._id}`
      );

      // Cập nhật state ngay lập tức
      setMicrochips((prevMicrochips) => {
        const newState = prevMicrochips.filter(
          (item) => item._id !== microchipToDelete._id
        );
        console.log("✅ Deleted, remaining items:", newState.length);
        return newState;
      });

      setLastUpdateTime(Date.now());
      setPage(1);
      setIsDeleteConfirmOpen(false);
      
      showSnackbar("Xóa vi mạch thành công", "success");

      // Fetch lại để đảm bảo
      setTimeout(async () => {
        await fetchMicrochips(true);
      }, 300);

    } catch (error) {
      console.error("❌ Delete error:", error);
      showSnackbar("Lỗi khi xóa vi mạch", "error");
      
      if (error.response && error.response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return;
      }
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
        sx={{ flexDirection: "column", gap: 2 }}
      >
        <CircularProgress color="primary" size={60} />
        <Typography variant="h6" color="text.secondary">
          Đang tải dữ liệu...
        </Typography>
      </Box>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Paper
        elevation={2}
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 2,
          background: `linear-gradient(120deg, ${
            theme.palette.primary.main
          }, ${alpha(theme.palette.primary.light, 0.8)})`,
          color: "white",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Memory sx={{ fontSize: 40, mr: 2 }} />
            <Typography variant="h6" component="h1" sx={{ fontWeight: 600 }}>
              Mẫu bản mạch
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Box>
        {/* Search and Add */}
        <Box
          sx={{
            width: "100%",
            maxWidth: 1500,
            mx: "auto",
            position: "relative",
            mb: 4,
          }}
        >
          <Box
            sx={{
              display: "flex",
              gap: 2,
              alignItems: "center",
              justifyContent: "space-evenly",
            }}
          >
            <StyledPaper elevation={1} component="form" sx={{ flex: 1 }}>
              <StyledTextField
                fullWidth
                variant="outlined"
                placeholder="Tìm kiếm vi mạch theo tên hoặc mô tả..."
                value={searchTerm}
                onChange={handleSearchChange}
                onFocus={() => searchTerm.trim() && setShowSuggestions(true)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon
                        color="primary"
                        sx={{ fontSize: "1.25rem" }}
                      />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <>
                      {searchTerm && (
                        <IconButton
                          aria-label="clear search"
                          onClick={clearSearch}
                          edge="end"
                          size="small"
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      )}
                    </>
                  ),
                }}
              />

              {showSuggestions && searchSuggestions.length > 0 && (
                <SuggestionsPaper>
                  {searchSuggestions.map((item) => (
                    <MenuItem
                      key={item._id || item.id}
                      onClick={() => handleSelectSuggestion(item)}
                      sx={{
                        "&:hover": {
                          backgroundColor: theme.palette.action.hover,
                        },
                        py: 1.5,
                        px: 2,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        "&:last-child": {
                          borderBottom: "none",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          width: "100%",
                        }}
                      >
                        <CardMedia
                          component="img"
                          image={`${REACT_APP_URL_BE}${item.imagePath}?t=${lastUpdateTime}`}
                          alt={item.name || "No name"}
                          sx={{
                            width: 48,
                            height: 48,
                            mr: 2,
                            borderRadius: 1,
                            objectFit: "cover",
                          }}
                          onError={(e) => {
                            e.target.src = "/placeholder-microchip.png";
                          }}
                        />
                        <Box sx={{ overflow: "hidden" }}>
                          <Typography
                            variant="subtitle1"
                            sx={{
                              fontWeight: 500,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {item.name || "Không có tên"}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {item.description?.substring(0, 60) ||
                              "Không có mô tả"}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </SuggestionsPaper>
              )}
            </StyledPaper>

            {hasPermission(user, "addMicrochip") && (
              <AddButton
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Thêm
              </AddButton>
            )}
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
          Hiển thị{" "}
          <Chip
            label={filteredMicrochips.length}
            color="primary"
            size="small"
          />{" "}
          vi mạch
        </Typography>
      </Box>

      {filteredMicrochips.length === 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 5,
            textAlign: "center",
            borderRadius: 2,
            bgcolor: alpha(theme.palette.primary.light, 0.1),
            border: `1px dashed ${theme.palette.primary.main}`,
            mt: 3,
          }}
        >
          <Memory sx={{ fontSize: 60, color: "text.secondary", mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {searchTerm
              ? "Không tìm thấy kết quả phù hợp"
              : "Không có vi mạch nào"}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {searchTerm
              ? "Hãy thử tìm kiếm với từ khóa khác"
              : "Hãy thêm vi mạch mới để bắt đầu"}
          </Typography>
          {hasPermission(user, "addMicrochip") && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
            >
              Thêm vi mạch mới
            </Button>
          )}
        </Paper>
      )}

      <Grid container spacing={3}>
        {paginatedMicrochips.map((microchip) => (
          <Grid 
            item 
            xs={6} 
            sm={4} 
            md={3} 
            key={`microchip-${microchip._id}-${microchip.updatedAt || lastUpdateTime}`}
          >
            <Card
              elevation={1}
              sx={{
                borderRadius: 2,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                transition: "transform 0.3s",
                "&:hover": {
                  transform: "scale(1.02)",
                },
              }}
            >
              <CardMedia
                component="img"
                height="140"
                image={`${REACT_APP_URL_BE}${microchip.imagePath}?t=${lastUpdateTime}`}
                alt={microchip.name}
                sx={{ objectFit: "cover" }}
                onError={(e) => {
                  e.target.src = "/placeholder-microchip.png";
                }}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" component="div" gutterBottom>
                  {microchip.name}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    mb: 1,
                  }}
                >
                  {microchip.description}
                </Typography>
                {microchip.device && (
                  <Chip 
                    label={microchip.device} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                    sx={{ mb: 1 }}
                  />
                )}
                {microchip.createdAt && (
                  <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                    <CalendarToday
                      fontSize="small"
                      sx={{ color: "text.secondary", mr: 0.5 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(microchip.createdAt)}
                    </Typography>
                  </Box>
                )}
              </CardContent>
              <Divider />
              <CardActions sx={{ justifyContent: "space-between", p: 2 }}>
                <Button
                  size="small"
                  color="info"
                  onClick={() => handleOpenDetailsDialog(microchip)}
                  startIcon={<Visibility />}
                >
                  Chi tiết
                </Button>
                {hasPermission(user, "UpdateAndDeleteMicrochip") && (
                  <Box>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpenDialog(microchip)}
                      sx={{ mr: 1 }}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteConfirm(microchip)}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Pagination */}
      {filteredMicrochips.length > rowsPerPage && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handleChangePage}
            color="primary"
            showFirstButton
            showLastButton
            sx={{
              "& .MuiPaginationItem-root": {
                fontSize: "0.875rem",
              },
            }}
          />
        </Box>
      )}

      {/* Details Dialog */}
      <Dialog
        open={openDetailsDialog}
        onClose={handleCloseDetailsDialog}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 },
        }}
      >
        {currentMicrochip && (
          <>
            <DialogTitle sx={{ bgcolor: "info.main", color: "white", py: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Visibility sx={{ mr: 1 }} />
                Chi tiết Vi mạch: {currentMicrochip.name}
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper
                    elevation={0}
                    sx={{
                      height: "100%",
                      overflow: "hidden",
                      borderRadius: 2,
                      border: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <CardMedia
                      component="img"
                      image={`${REACT_APP_URL_BE}${currentMicrochip.imagePath}?t=${lastUpdateTime}`}
                      alt={currentMicrochip.name}
                      sx={{
                        height: 300,
                        objectFit: "contain",
                        bgcolor: alpha(theme.palette.primary.light, 0.1),
                        p: 2,
                      }}
                      onError={(e) => {
                        e.target.src = "/placeholder-microchip.png";
                      }}
                    />
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h5" gutterBottom fontWeight="500">
                    {currentMicrochip.name}
                  </Typography>
                  <Divider sx={{ my: 2 }} />

                  <Typography
                    variant="subtitle1"
                    gutterBottom
                    fontWeight="bold"
                  >
                    Thiết bị
                  </Typography>
                  <Chip 
                    label={currentMicrochip.device || "Không có thiết bị"} 
                    color="primary"
                    sx={{ mb: 2 }}
                  />
                  <Divider sx={{ my: 2 }} />

                  <Typography
                    variant="subtitle1"
                    gutterBottom
                    fontWeight="bold"
                  >
                    Mô tả
                  </Typography>
                  <Typography variant="body1">
                    {currentMicrochip.description}
                  </Typography>

                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Thông tin chi tiết
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">
                              Ngày tạo
                            </Typography>
                            <Typography variant="body1" gutterBottom>
                              {formatDate(currentMicrochip.createdAt)}
                            </Typography>
                          </Grid>

                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">
                              Cập nhật lần cuối
                            </Typography>
                            <Typography variant="body1">
                              {formatDate(currentMicrochip.updatedAt)}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Paper>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2, justifyContent: "end" }}>
              <Button onClick={handleCloseDetailsDialog} variant="outlined">
                Đóng
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Add/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 },
        }}
      >
        <DialogTitle sx={{ bgcolor: "primary.main", color: "white", py: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Memory sx={{ mr: 1 }} />
            {currentMicrochip ? "Chỉnh sửa Vi mạch" : "Thêm Vi mạch mới"}
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tên vi mạch"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Thiết bị"
                name="device"
                value={formData.device}
                onChange={handleInputChange}
                required
                variant="outlined"
              >
                <MenuItem value="Router">Router</MenuItem>
                <MenuItem value="PC">PC</MenuItem>
                <MenuItem value="USB">USB</MenuItem>
                <MenuItem value="Access Point">Access Point</MenuItem>
                <MenuItem value="Switch">Switch</MenuItem>
                <MenuItem value="Server">Server</MenuItem>
                <MenuItem value="FPGA">FPGA</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Mô tả"
                name="description"
                multiline
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
                required
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <input
                accept="image/*"
                type="file"
                onChange={handleFileChange}
                style={{ display: "none" }}
                ref={fileInputRef}
                id="upload-microchip-image"
              />
              <label htmlFor="upload-microchip-image">
                <Button
                  variant="outlined"
                  component="span"
                  fullWidth
                  startIcon={<Upload />}
                  sx={{ py: 1.5 }}
                >
                  {formData.image
                    ? "Đã chọn: " + formData.image.name
                    : "Tải lên hình ảnh"}
                </Button>
              </label>
            </Grid>
            {previewImage && (
              <Grid item xs={12}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    textAlign: "center",
                    bgcolor: "grey.100",
                    borderRadius: 1,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ mb: 1, display: "block" }}
                  >
                    Xem trước hình ảnh
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      position: "relative",
                      "&:hover .overlay": {
                        opacity: 1,
                      },
                    }}
                  >
                    <img
                      src={
                        formData.image
                          ? previewImage
                          : currentMicrochip
                          ? `${REACT_APP_URL_BE}${previewImage}?t=${lastUpdateTime}`
                          : previewImage
                      }
                      alt="Preview"
                      style={{
                        maxHeight: "140px",
                        maxWidth: "100%",
                        objectFit: "contain",
                        borderRadius: "4px",
                      }}
                      onError={(e) => {
                        e.target.src = "/placeholder-microchip.png";
                      }}
                    />
                    <Box
                      className="overlay"
                      sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "rgba(0,0,0,0.5)",
                        opacity: 0,
                        transition: "opacity 0.3s",
                        borderRadius: "4px",
                      }}
                    >
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<Edit />}
                        onClick={() => fileInputRef.current.click()}
                      >
                        Thay đổi
                      </Button>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            )}
            {!previewImage && (
              <Grid item xs={12}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    textAlign: "center",
                    bgcolor: "grey.100",
                    borderRadius: 1,
                    border: "1px dashed grey.400",
                  }}
                >
                  <Image
                    sx={{ fontSize: 40, color: "text.secondary", mb: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Chưa có hình ảnh
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseDialog} variant="outlined">
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            startIcon={currentMicrochip ? <Edit /> : <Add />}
            disabled={
              !formData.name ||
              !formData.description ||
              !formData.device ||
              (!formData.image && !currentMicrochip)
            }
          >
            {currentMicrochip ? "Cập nhật" : "Thêm mới"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        PaperProps={{
          sx: { borderRadius: 2 },
        }}
      >
        <DialogTitle sx={{ color: "error.main" }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Delete sx={{ mr: 1 }} />
            Xác nhận xóa
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa vi mạch{" "}
            <strong>{microchipToDelete?.name}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Hành động này không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setIsDeleteConfirmOpen(false)}
            variant="outlined"
          >
            Hủy
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            color="error"
            startIcon={<Delete />}
          >
            Xóa
          </Button>
        </DialogActions>
      </Dialog> 

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        TransitionComponent={Fade}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MicrochipList;
