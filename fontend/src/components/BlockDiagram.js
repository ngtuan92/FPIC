import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  CircularProgress,
  IconButton,
  Typography,
  Card,
  CardContent,
  CardActions,
  Grid,
  Container,
  Paper,
  Tooltip,
  Snackbar,
  Alert,
  Fab,
  Divider,
  alpha,
  useTheme,
  InputAdornment,
  MenuItem,
  Paper as MuiPaper,
  Stack,
} from "@mui/material";
import React, { useState, useEffect } from "react";
import {
  Add as AddIcon,
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  PictureAsPdf as PictureAsPdfIcon,
  Search as SearchIcon,
  Memory,
} from "@mui/icons-material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

import { styled } from "@mui/material/styles";
import api from "../api";
import { REACT_APP_URL_BE } from "../config";
import { AuthContext } from "../context/AuthContext";
import { hasPermission } from "../helper/function";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";

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

const BlockDiagram = () => {
  const theme = useTheme();
  const { user } = React.useContext(AuthContext);
  const [showModal, setShowModal] = useState(false);
  const [pdfFiles, setPdfFiles] = useState([]);
  const [newPdf, setNewPdf] = useState({
    name: "",
    file: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [modalDelete, setModalDelete] = useState(false);
  const [selectedItem, setSelectedItem] = useState({});

  // Fetch PDFs from backend
  useEffect(() => {
    const fetchPdfs = async () => {
      try {
        const response = await api.get(`${REACT_APP_URL_BE}/fpic/sodokhoi`);
        setPdfFiles(response.data);
      } catch (error) {
        console.error("Error fetching PDFs:", error);
        showSnackbar("Không thể tải danh sách tài liệu", "error");
      }
    };

    fetchPdfs();
  }, []);

  // Search handlers
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowSuggestions(value.trim().length > 0);
    setIsSearching(true);

    if (value.trim().length > 0) {
      const suggestions = pdfFiles
        .filter((pdf) => pdf.name?.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 10);
      setSearchSuggestions(suggestions);
    } else {
      setSearchSuggestions([]);
    }
    setIsSearching(false);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setSearchSuggestions([]);
    setShowSuggestions(false);
  };

  const handleSelectSuggestion = (pdf) => {
    setSearchTerm(pdf.name);
    setShowSuggestions(false);
  };

  // Snackbar
  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Form handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPdf((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setNewPdf((prev) => ({
        ...prev,
        file: e.target.files[0],
      }));
      if (errors.file) {
        setErrors((prev) => ({ ...prev, file: null }));
      }
    }
  };

  const resetForm = () => {
    setNewPdf({ name: "", file: null });
    setEditingId(null);
    setErrors({});
  };

  const handleSubmit = async () => {
    const newErrors = {};
    if (!newPdf.name.trim()) newErrors.name = "Vui lòng nhập tên tài liệu";
    if (!newPdf.file && !editingId) newErrors.file = "Vui lòng chọn file PDF";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("name", newPdf.name);
    if (newPdf.file) {
      formData.append("pdf", newPdf.file);
    }

    try {
      let response;
      if (editingId) {
        response = await api.put(
          `${REACT_APP_URL_BE}/fpic/sodokhoi/${editingId}`,
          formData
        );
        setPdfFiles(
          pdfFiles.map((pdf) =>
            pdf._id === editingId
              ? {
                  ...pdf,
                  name: response.data.name,
                  filePath: response.data.filePath,
                }
              : pdf
          )
        );
        showSnackbar("Cập nhật tài liệu thành công");
      } else {
        response = await api.post(
          `${REACT_APP_URL_BE}/fpic/sodokhoi`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        setPdfFiles([response.data, ...pdfFiles]);
        showSnackbar("Thêm tài liệu thành công");
      }

      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error("Error:", error);
      showSnackbar(`Có lỗi xảy ra: ${error.message}`, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`${REACT_APP_URL_BE}/fpic/sodokhoi/${selectedItem._id}`);
      setPdfFiles(pdfFiles.filter((pdf) => pdf._id !== selectedItem._id));
      showSnackbar("Xóa tài liệu thành công");
    } catch (error) {
      console.error("Error deleting PDF:", error);
      showSnackbar("Không thể xóa tài liệu", "error");
    }
  };

  const handleEdit = (pdf) => {
    setNewPdf({
      name: pdf.name,
      file: null,
      filePath: pdf.filePath,
    });
    setEditingId(pdf._id);
    setShowModal(true);
  };

  const filteredPdfs = pdfFiles.filter((pdf) =>
    pdf.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ pb: 2 }}>
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
            gap: 2,
            justifyContent: "start",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Memory sx={{ fontSize: 40, mr: 2 }} />
            <Typography variant="h6" component="h1" sx={{ fontWeight: 600 }}>
              Sơ đồ khối
            </Typography>
          </Box>
        </Box>
      </Paper>

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
          <StyledPaper
            elevation={1}
            component="form"
            onSubmit={handleSearchSubmit}
            sx={{ flex: 1 }}
          >
            <StyledTextField
              fullWidth
              variant="outlined"
              placeholder="Tìm kiếm tài liệu theo tên..."
              value={searchTerm}
              onChange={handleSearchChange}
              onFocus={() => searchTerm.trim() && setShowSuggestions(true)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="primary" sx={{ fontSize: "1.25rem" }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <>
                    {isSearching && (
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                    )}
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
                {searchSuggestions.map((pdf) => (
                  <MenuItem
                    key={pdf._id}
                    onClick={() => handleSelectSuggestion(pdf)}
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
                      <PictureAsPdfIcon
                        color="primary"
                        sx={{ mr: 2, fontSize: 24 }}
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
                          {pdf.name || "Không có tên"}
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </SuggestionsPaper>
            )}
          </StyledPaper>

          {hasPermission(user, "addBlockDiagram") && (
            <AddButton
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
            >
              Thêm
            </AddButton>
          )}
        </Box>
      </Box>

      <Divider sx={{ mb: 4 }} />

      <Grid container spacing={6}>
        {filteredPdfs.length === 0 ? (
          <Grid item xs={12}>
            <Paper
              elevation={0}
              sx={{
                p: 5,
                textAlign: "center",
                bgcolor: "grey.50",
                borderRadius: 2,
              }}
            >
              <PictureAsPdfIcon
                sx={{ fontSize: 60, color: "text.secondary", opacity: 0.5 }}
              />
              <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
                {searchTerm
                  ? "Không tìm thấy tài liệu"
                  : "Chưa có tài liệu nào. Hãy thêm tài liệu mới."}
              </Typography>
            </Paper>
          </Grid>
        ) : (
          filteredPdfs.map((file) => (
            <Grid key={file._id} item xs={10} md={6}>
              <Card
                elevation={3}
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "all 0.3s",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: 6,
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1, p: 0 }}>
                  <Box sx={{ height: 500, position: "relative" }}>
                    <object
                      data={`${REACT_APP_URL_BE}/${file.filePath}`}
                      type="application/pdf"
                      width="100%"
                      height="100%"
                    >
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          height: "100%",
                          p: 3,
                          bgcolor: "grey.100",
                        }}
                      >
                        <PictureAsPdfIcon
                          sx={{ fontSize: 60, color: "error.main" }}
                        />
                        <Typography sx={{ mt: 2 }}>
                          Trình duyệt không hỗ trợ xem PDF
                        </Typography>
                      </Box>
                    </object>
                  </Box>
                </CardContent>

                <Divider />

                <Box sx={{ p: 2 }}>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 500, mb: 1, textAlign: "center" }}
                  >
                    {file.name}
                  </Typography>

                  <CardActions sx={{ justifyContent: "center", gap: 1 }}>
                    {hasPermission(user, "UpdateAndDeleteBlockDiagram") && (
                      <>
                        <Tooltip title="Sửa">
                          <Button
                            variant="outlined"
                            size="small"
                            color="primary"
                            startIcon={<EditIcon />}
                            onClick={() => handleEdit(file)}
                          >
                            Sửa
                          </Button>
                        </Tooltip>

                        <Tooltip title="Xóa">
                          <Button
                            variant="outlined"
                            size="small"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={() => {
                              setModalDelete(true);
                              setSelectedItem(file);
                            }}
                          >
                            Xóa
                          </Button>
                        </Tooltip>
                      </>
                    )}

                    <Tooltip title="Xem full-screen">
                      <Button
                        variant="contained"
                        size="small"
                        color="primary"
                        startIcon={<VisibilityIcon />}
                        onClick={() =>
                          window.open(
                            `${REACT_APP_URL_BE}/${file.filePath}`,
                            "_blank"
                          )
                        }
                      >
                        Xem
                      </Button>
                    </Tooltip>
                  </CardActions>
                </Box>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      <Dialog
        open={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          elevation: 8,
          sx: { borderRadius: 2 },
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: "primary.main",
            color: "white",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            py: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {editingId ? <EditIcon /> : <AddIcon />}
            <Typography variant="h6">
              {editingId ? "Chỉnh sửa tài liệu" : "Thêm tài liệu PDF mới"}
            </Typography>
          </Box>

          <IconButton
            edge="end"
            color="inherit"
            onClick={() => {
              setShowModal(false);
              resetForm();
            }}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ py: 3, px: 3 }}>
          <Box component="form" sx={{ mt: 1 }}>
            <TextField
              fullWidth
              margin="normal"
              label="Tên tài liệu"
              name="name"
              value={newPdf.name}
              onChange={handleInputChange}
              error={!!errors.name}
              helperText={errors.name}
              sx={{ mb: 3 }}
              variant="outlined"
              InputProps={{
                sx: { borderRadius: 1 },
              }}
            />

            <input
              accept="application/pdf"
              style={{ display: "none" }}
              id="pdf-upload"
              type="file"
              onChange={handleFileChange}
            />

            <Box sx={{ textAlign: "center" }}>
              <label htmlFor="pdf-upload">
                <Button
                  component="span"
                  variant="outlined"
                  fullWidth
                  startIcon={<CloudUploadIcon />}
                  sx={{
                    py: 3,
                    borderStyle: "dashed",
                    borderRadius: 1,
                    borderWidth: "2px",
                    borderColor: errors.file ? "error.main" : "primary.main",
                    "&:hover": {
                      borderColor: "primary.dark",
                      bgcolor: "rgba(25, 118, 210, 0.04)",
                    },
                  }}
                >
                  Chọn file PDF
                </Button>
              </label>
            </Box>

            {editingId && !newPdf.file && (
              <Box
                sx={{
                  mt: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <PictureAsPdfIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="body2">
                  Đã chọn: {newPdf.filePath.split("\\").pop().split("/").pop()}
                </Typography>
              </Box>
            )}

            {newPdf.file && (
              <Box
                sx={{
                  mt: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <PictureAsPdfIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="body2">
                  Đã chọn: {newPdf.file.name}
                </Typography>
              </Box>
            )}

            {errors.file && (
              <Typography
                color="error"
                variant="body2"
                sx={{ mt: 1, textAlign: "center" }}
              >
                {errors.file}
              </Typography>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            variant="outlined"
            onClick={() => {
              setShowModal(false);
              resetForm();
            }}
            sx={{ mr: 2, borderRadius: 28, px: 3 }}
          >
            Hủy
          </Button>

          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
            sx={{ borderRadius: 28, px: 3 }}
          >
            {isSubmitting
              ? "Đang tải lên..."
              : editingId
              ? "Cập nhật tài liệu"
              : "Lưu tài liệu"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={modalDelete}
        onClose={() => setModalDelete(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: "hidden",
            width: 380,
            background: "linear-gradient(145deg, #ffffff 0%, #f9fafb 100%)",
            boxShadow: "0 12px 56px rgba(0, 0, 0, 0.15)",
          },
        }}
      >
        <Box
          sx={{
            position: "relative",
            bgcolor: "#FFF5F5",
            pt: 5,
            pb: 3,
            borderBottom: "1px solid",
            borderColor: alpha("#FF3D3D", 0.1),
          }}
        >
          <IconButton
            aria-label="close"
            onClose={() => setModalDelete(false)}
            sx={{
              position: "absolute",
              right: 12,
              top: 12,
              color: "text.secondary",
            }}
            size="small"
          >
            <CloseIcon fontSize="small" />
          </IconButton>

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Box
              sx={{
                width: 70,
                height: 70,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: alpha("#FF3D3D", 0.1),
                mb: 3,
              }}
            >
              <WarningAmberIcon sx={{ fontSize: 34, color: "#FF3D3D" }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: "#FF3D3D" }}>
              Xác nhận xoá
            </Typography>
          </Box>
        </Box>

        <Box sx={{ p: 4 }}>
          <Typography
            variant="body1"
            align="center"
            sx={{
              mb: 4,
              color: "text.primary",
              lineHeight: 1.6,
            }}
          >
            Bạn có chắc chắn muốn xoá không?
            <br />
            <Typography
              component="span"
              variant="body2"
              sx={{
                color: "text.secondary",
                fontWeight: 500,
                display: "block",
                mt: 1,
              }}
            >
              Hành động này không thể hoàn tác.
            </Typography>
          </Typography>

          <Stack direction="row" spacing={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => setModalDelete(false)}
              sx={{
                py: 1.2,
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                color: "text.primary",
                borderColor: "#E0E0E0",
                "&:hover": {
                  borderColor: "#BDBDBD",
                  backgroundColor: "#F5F5F5",
                },
              }}
            >
              Huỷ
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={() => {
                handleDelete();
                setModalDelete(false);
              }}
              startIcon={<DeleteOutlineIcon />}
              sx={{
                py: 1.2,
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                background: "linear-gradient(45deg, #FF3D3D 0%, #FF7070 100%)",
                boxShadow: "0 4px 12px rgba(255, 61, 61, 0.3)",
                "&:hover": {
                  background:
                    "linear-gradient(45deg, #E53535 0%, #FF5050 100%)",
                  boxShadow: "0 6px 16px rgba(255, 61, 61, 0.4)",
                },
              }}
            >
              Xoá
            </Button>
          </Stack>
        </Box>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
          variant="filled"
          elevation={6}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BlockDiagram;
