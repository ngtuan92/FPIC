import React from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Pagination,
  Snackbar,
  Stack,
  TextField,
  Fade,
  Autocomplete,
  Box,
  Typography,
  Grid,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import {
  Search as SearchIcon,
  Close as CloseIcon,
  ChevronLeft,
  ChevronRight,
  Save as SaveIcon,
  ImageNotSupported as ImageNotSupportedIcon,
  Memory,
  Add as AddIcon,
} from "@mui/icons-material";

export default function AddAccessoryDialog({
  showModal,
  setShowModal,
  Transition,
  data,
  formData,
  handleInputChange,
  errors,
  handleCreateAccessory,
  isLoadingButton,
  typeSelected,
  setFormData,
}) {
  return (
    <Dialog
      open={showModal}
      onClose={() => setShowModal(false)}
      maxWidth="md"
      fullWidth
      TransitionComponent={Transition}
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: "12px",
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        sx={{
          bgcolor: "primary.main",
          color: "white",
          py: 2,
          px: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
          Thêm linh kiện mới
        </Typography>
        <IconButton
          edge="end"
          color="inherit"
          onClick={() => setShowModal(false)}
          sx={{
            "&:hover": {
              backgroundColor: "rgba(255,255,255,0.1)",
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ py: 3 }}>
        <Stack spacing={3}>
          <Grid container spacing={2}>
            <Grid
              container
              spacing={2}
              sx={{ marginBottom: "0!important", marginTop: "10px" }}
            >
              <Grid xs={12} md={6}>
                <TextField
                  onChange={handleInputChange}
                  name="title"
                  label="Tên linh kiện"
                  variant="outlined"
                  sx={{
                    marginLeft: "16px",
                    marginTop: "25px",
                    width: "95%",
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "8px",
                    },
                    marginBottom: "0!important",
                  }}
                />
              </Grid>
              <Grid xs={12} md={6}>
                <Autocomplete
                  options={[]} // Truyền mảng rỗng để không hiển thị options
                  value={{ title: typeSelected.title }} // Giá trị fix cứng
                  getOptionLabel={(option) => option.title}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Loại linh kiện"
                      sx={{
                        width: "96%",
                        marginTop: "25px",
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "8px",
                        },
                        marginBottom: "0!important",
                      }}
                      InputProps={{
                        ...params.InputProps,
                        readOnly: true, // Chế độ chỉ đọc
                      }}
                    />
                  )}
                  sx={{ marginBottom: "0!important" }}
                  disableClearable // Vô hiệu hóa nút xóa
                  forcePopupIcon={false} // Ẩn icon dropdown
                  readOnly // Chế độ chỉ đọc
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Row 2: Mô tả */}
          <Grid container>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="description"
                label="Mô tả"
                variant="outlined"
                multiline
                rows={4}
                value={formData.description || ""}
                onChange={handleInputChange}
                error={!!errors.description}
                helperText={errors.description}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                  },
                }}
              />
            </Grid>
          </Grid>

          {/* Row 3: Hình ảnh */}
          <Grid container>
            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Hình ảnh linh kiện
                </Typography>
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<CloudUploadIcon />}
                  fullWidth
                  sx={{
                    py: 2,
                    borderRadius: "8px",
                    borderStyle: "dashed",
                    "&:hover": {
                      borderStyle: "dashed",
                    },
                  }}
                >
                  Tải lên hình ảnh
                  <input
                    type="file"
                    name="image"
                    accept="image/*"
                    onChange={handleInputChange}
                    hidden
                  />
                </Button>
                {formData.image && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1, display: "block" }}
                  >
                    Đã chọn: {formData.image.name || "Ảnh linh kiện"}
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>

          {/* Row 4: Nút Lưu */}
          <Grid container justifyContent="flex-end">
            <Grid item>
              <Button
                variant="contained"
                onClick={handleCreateAccessory}
                disabled={isLoadingButton}
                startIcon={
                  isLoadingButton ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <SaveIcon />
                  )
                }
                sx={{
                  px: 4,
                  py: 1,
                  borderRadius: "8px",
                  textTransform: "none",
                  fontSize: "1rem",
                }}
              >
                {isLoadingButton ? "Đang thêm..." : "Lưu linh kiện"}
              </Button>
            </Grid>
          </Grid>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
