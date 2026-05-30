import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Container,
  Grid,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Dialog,
} from "@mui/material";
import {
  Close as CloseIcon,
  ChevronLeft,
  ChevronRight,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Collections as CollectionsIcon,
  Info as InfoIcon,
  Add as AddIcon,
  ImageNotSupported as ImageNotSupportedIcon,
} from "@mui/icons-material";
import ZoomableImage from "../ZoomableImage";
import { REACT_APP_URL_BE } from "../config";

import DeleteConfirmationDialog from "./DeleteConfirmationDialog";
import api from "../api";
import { AuthContext } from "../context/AuthContext";
import { hasPermission } from "../helper/function";

export const AccessoryDetailDialog = ({
  showModalDesc,
  handleClickModalDesc,
  formAccessory,
  data,
  formDataUpdate,
  setFormDataUpdate,
  errors,
  isLoadingButton,
  handleClickOnAnotherImage,
  hanldeClickPreviosImage,
  hanldeClickNextImage,
  Transition,
  isBase64,
  setIsLoadingButton,
  setSnackBar,
  setData,
  setShowModal,
  onAccessoryUpdated,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const { user } = React.useContext(AuthContext);

  const handleUpdateAccessory = async () => {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    setIsLoadingButton(true);
    const form = new FormData();
    form.append("title", formDataUpdate.title);
    form.append("description", formDataUpdate.description);
    form.append("type", formAccessory.type);
    
    // Chỉ append file nếu user chọn file mới
    if (formDataUpdate.image instanceof File) {
      form.append("file", formDataUpdate.image);
    }

    try {
      const response = await api.put(
        `${REACT_APP_URL_BE}/accessory/${formAccessory._id}`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      
      // ← FIX CUỐI CÙNG: Lấy accessory từ data.accessories (có image URL đúng)
      const currentAccessoryInList = data.accessories.find(
        acc => acc._id === formAccessory._id
      );
      
      const updatedAccessory = {
        ...currentAccessoryInList, // Lấy TOÀN BỘ data từ list gốc (bao gồm image)
        title: formDataUpdate.title, // Chỉ update title
        description: formDataUpdate.description, // Chỉ update description
        // Chỉ update image nếu có upload file mới VÀ API trả về image mới
        ...(formDataUpdate.image instanceof File && response.data.data?.image && {
          image: response.data.data.image
        })
      };
      
      // Gọi callback để cập nhật state ở component cha
      if (onAccessoryUpdated) {
        onAccessoryUpdated(updatedAccessory);
      }
      
      setSnackBar({
        open: true,
        message: response.data.message || "Cập nhật thành công!",
        severity: "success",
      });
      
      setIsEditing(false);
    } catch (error) {
      setSnackBar({
        open: true,
        message: error.response?.data?.message || "Lỗi khi cập nhật",
        severity: "error",
      });
    } finally {
      setIsLoadingButton(false);
    }
  };

  const handleDeleteAccessory = async () => {
    setIsLoadingButton(true);

    const previousData = data.accessories;
    const deletedIndex = data.accessories.findIndex(
      (item) => item._id === formAccessory._id
    );

    const nextAccessory = data.accessories[deletedIndex - 1];

    setData((prev) => ({
      ...prev,
      accessories: prev.accessories.filter(
        (item) => item._id !== formAccessory._id
      ),
    }));

    try {
      await api.delete(`${REACT_APP_URL_BE}/accessory/${formAccessory._id}`);
      setSnackBar({
        open: true,
        message: "Xoá thành công!",
        severity: "success",
      });

      if (nextAccessory) {
        setFormDataUpdate({
          title: nextAccessory.title,
          description: nextAccessory.description,
        });
        handleClickOnAnotherImage(
          data.accessories.findIndex((a) => a._id === nextAccessory._id)
        );
      } else {
        setFormDataUpdate({});
      }
    } catch (error) {
      setData((prev) => ({
        ...prev,
        accessories: previousData,
      }));
      setSnackBar({
        open: true,
        message: error.response?.data?.message || "Lỗi khi xóa",
        severity: "error",
      });
    } finally {
      setIsLoadingButton(false);
    }
  };

  return (
    <Dialog
      open={showModalDesc}
      onClose={() => {
        handleClickModalDesc(false);
        setFormDataUpdate({});
        setIsEditing(false);
      }}
      fullScreen
      TransitionComponent={Transition}
      sx={{ "& .MuiDialog-paper": { backgroundColor: "#FAFAFA" } }}
    >
      <AppBar
        position="sticky"
        elevation={0}
        sx={{ background: "linear-gradient(90deg, #3a7bd5, #2196f3)" }}
      >
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <IconButton
              edge="start"
              onClick={() => {
                handleClickModalDesc(false);
                setIsEditing(false);
              }}
              sx={{ color: "#fff" }}
            >
              <CloseIcon />
            </IconButton>
            <Typography variant="h6" sx={{ ml: 2, fontWeight: 500 }}>
              Chi tiết linh kiện
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <Container maxWidth="xl" sx={{ py: 4, flexGrow: 1 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8} lg={9}>
              <Paper
                elevation={0}
                sx={{
                  p: 0,
                  height: "100%",
                  borderRadius: "12px",
                  overflow: "hidden",
                  border: "1px solid #e0e0e0",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {formAccessory && (
                  <>
                    <Box
                      sx={{
                        position: "relative",
                        flexGrow: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#f0f0f0",
                        minHeight: "400px",
                        p: 2,
                      }}
                    >
                      <IconButton
                        onClick={hanldeClickPreviosImage}
                        sx={{
                          position: "absolute",
                          left: 16,
                          top: "50%",
                          transform: "translateY(-50%)",
                          backgroundColor: "white",
                          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                          "&:hover": {
                            backgroundColor: "white",
                            transform: "translateY(-50%) scale(1.1)",
                          },
                          transition: "all 0.2s ease",
                          zIndex: 2,
                        }}
                      >
                        <ChevronLeft />
                      </IconButton>

                      {formAccessory.image ? (
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "center",
                            width: "100%",
                            height: "100%",
                            maxHeight: "70vh",
                          }}
                        >
                          <ZoomableImage
                            data={
                              isBase64(formAccessory?.image)
                                ? `${REACT_APP_URL_BE}${decodeURIComponent(
                                    escape(atob(formAccessory?.image))
                                  )}`
                                : `${REACT_APP_URL_BE}${formAccessory?.image}`
                            }
                            alt={formAccessory?.title}
                          />
                        </Box>
                      ) : (
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                            py: 6,
                            px: 4,
                            borderRadius: "8px",
                            backgroundColor: "#f5f5f5",
                            width: "100%",
                            height: "100%",
                          }}
                        >
                          <ImageNotSupportedIcon
                            sx={{ fontSize: 80, color: "#bdbdbd" }}
                          />
                          <Typography
                            variant="body1"
                            sx={{ mt: 2, color: "#757575" }}
                          >
                            Không có ảnh
                          </Typography>
                        </Box>
                      )}

                      <IconButton
                        onClick={hanldeClickNextImage}
                        sx={{
                          position: "absolute",
                          right: 16,
                          top: "50%",
                          transform: "translateY(-50%)",
                          backgroundColor: "white",
                          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                          "&:hover": {
                            backgroundColor: "white",
                            transform: "translateY(-50%) scale(1.1)",
                          },
                          transition: "all 0.2s ease",
                          zIndex: 2,
                        }}
                      >
                        <ChevronRight />
                      </IconButton>
                    </Box>

                    <Box
                      sx={{
                        p: 2,
                        borderTop: "1px solid #e0e0e0",
                        backgroundColor: "white",
                      }}
                    >
                      <Typography
                        variant="subtitle1"
                        sx={{
                          mb: 2,
                          fontWeight: 500,
                          color: "#424242",
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <CollectionsIcon fontSize="small" />
                        Thư viện ảnh
                      </Typography>

                      <Box
                        sx={{
                          display: "flex",
                          flexWrap: "nowrap",
                          gap: 1.5,
                          overflowX: "auto",
                          pb: 1,
                          "&::-webkit-scrollbar": {
                            height: "6px",
                          },
                          "&::-webkit-scrollbar-thumb": {
                            backgroundColor: "#bdbdbd",
                            borderRadius: "6px",
                          },
                        }}
                      >
                        <Box
                          onClick={() => setShowModal(true)}
                          sx={{
                            width: "90px",
                            height: "90px",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            cursor: "pointer",
                            borderRadius: "6px",
                            border: "1px dashed #bdbdbd",
                            backgroundColor: "#f5f5f5",
                            flexShrink: 0,
                            transition: "all 0.2s ease",
                            "&:hover": {
                              backgroundColor: "#e0e0e0",
                              borderColor: "#9e9e9e",
                            },
                          }}
                        >
                          <AddIcon sx={{ color: "#757575" }} />
                        </Box>
                        {data.accessories.map((image, index) => (
                          <Box
                            key={index}
                            sx={{
                              width: "90px",
                              height: "90px",
                              cursor: "pointer",
                              borderRadius: "6px",
                              overflow: "hidden",
                              flexShrink: 0,
                              position: "relative",
                              border:
                                formAccessory && formAccessory._id === image._id
                                  ? "2px solid #2196f3"
                                  : "1px solid #e0e0e0",
                              transition: "all 0.2s ease",
                              "&:hover": {
                                transform: "translateY(-4px)",
                                boxShadow: "0 6px 12px rgba(0,0,0,0.15)",
                              },
                            }}
                            onClick={() => {
                              handleClickOnAnotherImage(index);
                              setIsEditing(false);
                            }}
                          >
                            <img
                              src={
                                isBase64(image?.image)
                                  ? `${REACT_APP_URL_BE}${decodeURIComponent(
                                      escape(atob(image?.image))
                                    )}`
                                  : `${REACT_APP_URL_BE}${image?.image}`
                              }
                              alt={image?.title}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                            {formAccessory &&
                              formAccessory._id === image._id && (
                                <Box
                                  sx={{
                                    position: "absolute",
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    backgroundColor: "rgba(33, 150, 243, 0.7)",
                                    color: "white",
                                    textAlign: "center",
                                    fontSize: "12px",
                                    py: 0.5,
                                  }}
                                >
                                  Hiện tại
                                </Box>
                              )}
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  </>
                )}
              </Paper>
            </Grid>
            <DeleteConfirmationDialog
              setOpenConfirmDelete={setOpenConfirmDelete}
              handleDeleteAccessory={handleDeleteAccessory}
              openConfirmDelete={openConfirmDelete}
            />

            <Grid item xs={12} md={4} lg={3}>
              {formAccessory && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 0,
                    height: "100%",
                    border: "1px solid #e0e0e0",
                    borderRadius: "12px",
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      p: 3,
                      borderBottom: "1px solid #e0e0e0",
                      backgroundColor: "#f5f5f5",
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        mb: 0,
                        fontWeight: 500,
                        color: "#424242",
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <InfoIcon fontSize="small" />
                      Thông tin chi tiết
                    </Typography>
                  </Box>

                  <Box sx={{ p: 3, backgroundColor: "white" }}>
                    <TextField
                      fullWidth
                      name="title"
                      label="Tiêu đề"
                      variant="outlined"
                      onChange={(e) =>
                        setFormDataUpdate((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      value={formDataUpdate.title || ""}
                      error={!!errors.title}
                      helperText={errors.title}
                      InputProps={{ readOnly: !isEditing }}
                      sx={{
                        mb: 3,
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "8px",
                        },
                        "& .MuiInputBase-readOnly": {
                          backgroundColor: "#f5f5f5",
                        },
                      }}
                    />

                    <TextField
                      fullWidth
                      name="description"
                      label="Mô tả"
                      variant="outlined"
                      multiline
                      rows={4}
                      onChange={(e) =>
                        setFormDataUpdate((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      value={formDataUpdate.description || ""}
                      error={!!errors.description}
                      helperText={errors.description}
                      InputProps={{ readOnly: !isEditing }}
                      sx={{
                        mb: 3,
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "8px",
                        },
                        "& .MuiInputBase-readOnly": {
                          backgroundColor: "#f5f5f5",
                        },
                      }}
                    />
                    {hasPermission(user, "UpdateAndDeleteAccessory") && (
                      <Box sx={{ mt: 3 }}>
                        <Button
                          fullWidth
                          variant="contained"
                          color="primary"
                          onClick={handleUpdateAccessory}
                          disabled={isLoadingButton}
                          startIcon={
                            isLoadingButton ? (
                              <CircularProgress size={20} color="inherit" />
                            ) : (
                              <EditIcon />
                            )
                          }
                          sx={{
                            py: 1.2,
                            mb: 2,
                            borderRadius: "8px",
                            textTransform: "none",
                            fontWeight: 500,
                          }}
                        >
                          {isEditing ? "Lưu thông tin" : "Cập nhật thông tin"}
                        </Button>
                        <Button
                          fullWidth
                          variant="outlined"
                          color="error"
                          onClick={() => setOpenConfirmDelete(true)}
                          disabled={isLoadingButton}
                          startIcon={
                            isLoadingButton ? (
                              <CircularProgress size={20} color="inherit" />
                            ) : (
                              <DeleteIcon />
                            )
                          }
                          sx={{
                            py: 1.2,
                            borderRadius: "8px",
                            textTransform: "none",
                            fontWeight: 500,
                          }}
                        >
                          Xóa phụ kiện
                        </Button>
                      </Box>
                    )}
                  </Box>
                </Paper>
              )}
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Dialog>
  );
};
