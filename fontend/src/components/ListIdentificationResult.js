// src/pages/ListIdentificationResult.jsx
import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Typography,
  Chip,
  TextField,
  IconButton,
  CircularProgress,
  Alert,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  alpha,
  useTheme,
  styled,
  InputAdornment,
  Tooltip,
} from "@mui/material";
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Memory,
  Close as CloseIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import Swal from "sweetalert2";
import api from "../api";
import { REACT_APP_URL_BE } from "../config";

// --- Styled Components (Synchronized with ManageAccount / MicrochipList) ---
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

const AddButton = styled(Button)(({ theme }) => ({
  borderRadius: "28px",
  textTransform: "none",
  fontWeight: 600,
  padding: "10px 24px",
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.common.white,
  "&:hover": {
    backgroundColor: theme.palette.primary.dark,
    transform: "translateY(-2px)",
    boxShadow: theme.shadows[4],
  },
  transition: "all 0.3s ease",
}));

// Chuẩn hóa dữ liệu ảnh nhận từ BE
const buildImageSrc = (raw, mimeFallback = "image/jpeg") => {
  if (!raw) return "";
  if (typeof raw === "string") {
    if (raw.startsWith("data:")) return raw;
    if (raw.startsWith("http")) return raw;
    return `data:${mimeFallback};base64,${raw}`;
  }
  if (raw && raw.data && Array.isArray(raw.data)) {
    const uint8 = new Uint8Array(raw.data);
    let binary = "";
    uint8.forEach((b) => (binary += String.fromCharCode(b)));
    const base64 = window.btoa(binary);
    return `data:${mimeFallback};base64,${base64}`;
  }
  return "";
};

const ListIdentificationResult = () => {
  const theme = useTheme();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Dialog states
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({
    filename: "",
    type: "fp",
    detectionType: "",
    userNotes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(
    async (pageParam = page, searchParam = keyword) => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`${REACT_APP_URL_BE}/detection-results`, {
          params: {
            page: pageParam,
            limit,
            search: searchParam || undefined,
          },
        });

        const body = res.data || {};
        const data = body.data || body.results || body.items || [];
        const tp = body.totalPages || body.total_page || body.pagination?.totalPages || 1;

        setItems(data);
        setTotalPages(tp);
      } catch (err) {
        console.error("Fetch detection-results error:", err);
        setError(err.response?.data?.message || "Không tải được danh sách đánh giá");
      } finally {
        setLoading(false);
      }
    },
    [page, limit, keyword]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchData(value, keyword);
  };

  const handleSearchChange = (e) => {
    setKeyword(e.target.value);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      setPage(1);
      fetchData(1, keyword);
    }
  };

  // CRUD Actions
  const handleOpenEdit = (item) => {
    setSelectedItem(item);
    setFormData({
      filename: item.filename,
      type: item.type,
      detectionType: item.detectionType,
      userNotes: item.userNotes || "",
    });
    setOpenEditDialog(true);
  };


  const handleEditSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Chỉ sửa ghi chú theo yêu cầu
      await api.put(`${REACT_APP_URL_BE}/detection-results/${selectedItem._id}`, {
        userNotes: formData.userNotes,
      });
      Swal.fire("Thành công", "Đã cập nhật ghi chú", "success");
      setOpenEditDialog(false);
      fetchData();
    } catch (err) {
      Swal.fire("Lỗi", err.response?.data?.message || "Không thể cập nhật", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (item) => {
    Swal.fire({
      title: "Xác nhận xóa?",
      text: `Bạn có chắc chắn muốn xóa đánh giá của file ${item.filename}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`${REACT_APP_URL_BE}/detection-results/${item._id}`);
          Swal.fire("Đã xóa", "Dữ liệu đã được xóa thành công", "success");
          fetchData();
        } catch (err) {
          Swal.fire("Lỗi", err.response?.data?.message || "Không thể xóa", "error");
        }
      }
    });
  };

  return (
    <Box sx={{ p: 4, display: "flex", flexDirection: "column", gap: 3 }}>
      {/* HEADER GRADIENT */}
      <Paper
        elevation={2}
        sx={{
          p: 3,
          borderRadius: 2,
          background: `linear-gradient(120deg, ${theme.palette.primary.main}, ${alpha(
            theme.palette.primary.light,
            0.8
          )})`,
          color: "white",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Memory sx={{ fontSize: 40, mr: 2 }} />
          <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
            Danh mục kết quả nhận diện & đánh giá
          </Typography>
        </Box>
      </Paper>

      {/* SEARCH */}
      <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
        <StyledPaper elevation={1} sx={{ flex: 1, maxWidth: 600 }}>
          <StyledTextField
            fullWidth
            variant="outlined"
            placeholder="Tìm theo tên file / loại / kiểu kiểm tra..."
            value={keyword}
            onChange={handleSearchChange}
            onKeyPress={handleSearchKeyPress}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="primary" sx={{ fontSize: "1.25rem" }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => fetchData(1, keyword)} size="small">
                    {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </StyledPaper>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* DATA TABLE */}
      <TableContainer component={Paper} sx={{ borderRadius: 2, border: "1px solid #eee", boxShadow: 1 }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: "#f5f7f9" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Ảnh</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Tên File</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Loại</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Đánh giá</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Ghi chú</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Thời gian</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                  <CircularProgress size={30} sx={{ mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">Đang tải dữ liệu...</Typography>
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                  <Typography color="text.secondary">Chưa có kết quả đánh giá nào</Typography>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => {
                const imgSrc = buildImageSrc(item.annotatedImage || item.originalImage);
                return (
                  <TableRow key={item._id} hover>
                    <TableCell>
                      <Box
                        sx={{
                          width: 80,
                          height: 50,
                          borderRadius: 1,
                          overflow: "hidden",
                          bgcolor: "#f0f0f0",
                          border: "1px solid #ddd",
                        }}
                      >
                        {imgSrc ? (
                          <img
                            src={imgSrc}
                            alt={item.filename}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          <Box sx={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontStyle: "italic", fontSize: 10, color: "#999" }}>
                            N/A
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.filename}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={item.type?.toUpperCase()} size="small" color="secondary" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip label={item.detectionType} size="small" color="primary" sx={{ bgcolor: "#e3f2fd", color: "#1976d2" }} />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 200 }}>
                      <Typography variant="body2" noWrap title={item.userNotes}>
                        {item.userNotes || "-"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {item.createdAt && new Date(item.createdAt).toLocaleString("vi-VN")}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
                        <Tooltip title="Sửa ghi chú">
                          <IconButton size="small" color="primary" onClick={() => handleOpenEdit(item)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Xóa">
                          <IconButton size="small" color="error" onClick={() => handleDelete(item)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}


      {/* EDIT NOTES DIALOG */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: "primary.main", color: "white" }}>Cập nhật ghi chú</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="subtitle2">File: {formData.filename}</Typography>
            <TextField
              label="Ghi chú của người dùng"
              fullWidth
              multiline
              rows={4}
              value={formData.userNotes}
              onChange={(e) => setFormData({ ...formData, userNotes: e.target.value })}
              autoFocus
            />
            <Alert severity="info" sx={{ mt: 1 }}>Bạn chỉ có thể cập nhật ghi chú. Các thông tin khác và hình ảnh không được phép thay đổi.</Alert>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenEditDialog(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleEditSubmit} disabled={isSubmitting} startIcon={isSubmitting ? <CircularProgress size={16} /> : <SaveIcon />}>
            Cập nhật
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ListIdentificationResult;
