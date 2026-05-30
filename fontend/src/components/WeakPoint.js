import React, { useEffect, useState, useContext } from "react";
import {
  Container,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Typography,
  Grid,
  Tabs,
  Tab,
  Button,
  Modal,
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Pagination,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableContainer,
  Paper,
  Stack,
  Chip,
  Avatar,
  Tooltip,
  IconButton,
  Divider,
  Snackbar,
  Fade,
  InputAdornment,
  Paper as MuiPaper,
} from "@mui/material";
import {
  Add as AddIcon,
  Visibility,
  Edit,
  Delete,
  Warning,
  CloudUpload,
  Category,
  Search as SearchIcon,
  Close as CloseIcon,
  Memory,
} from "@mui/icons-material";
import { styled, useTheme } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";
import { REACT_APP_URL_BE } from "../config";
import api from "../api";
import { AuthContext } from "../context/AuthContext";
import { hasPermission } from "../helper/function";

const CategoryCard = styled(Card)(({ theme }) => ({
  height: "100%",
  display: "flex",
  flexDirection: "column",
  transition: "0.3s",
  "&:hover": {
    transform: "translateY(-5px)",
    boxShadow: theme.shadows[8],
  },
}));

const StyledTabs = styled(Tabs)({
  "& .MuiTabs-indicator": {
    height: 4,
    borderRadius: "2px 2px 0 0",
  },
});

const StyledTab = styled(Tab)(({ theme }) => ({
  textTransform: "none",
  fontWeight: theme.typography.fontWeightMedium,
  fontSize: theme.typography.pxToRem(15),
  marginRight: theme.spacing(1),
  "&.Mui-selected": {
    color: theme.palette.primary.main,
  },
}));

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

const WeakPoint = () => {
  const { user } = useContext(AuthContext);
  const theme = useTheme();
  const [categories, setCategories] = useState({
    jtag: [],
    testPin: [],
    lpc: [],
    footprint: [],
    unusedPort: [],
    vias: [],
    spi: [],
    smb: [],
  });
  const [activeTab, setActiveTab] = useState("jtag");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [nameError, setNameError] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    imageURL: "",
    device: "",
    category: "jtag",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const endpoints = [
      { key: "jtag", url: `${REACT_APP_URL_BE}/images-jtag` },
      { key: "testPin", url: `${REACT_APP_URL_BE}/images-test-pin` },
      { key: "lpc", url: `${REACT_APP_URL_BE}/images-lpc` },
      { key: "footprint", url: `${REACT_APP_URL_BE}/images-footprint` },
      { key: "unusedPort", url: `${REACT_APP_URL_BE}/images-unused-port` },
      { key: "vias", url: `${REACT_APP_URL_BE}/images-vias` },
      { key: "spi", url: `${REACT_APP_URL_BE}/images-spi` },
      { key: "smb", url: `${REACT_APP_URL_BE}/images-smb` },
    ];

    const fetchAllData = async () => {
      try {
        const newCategories = { ...categories };
        for (const endpoint of endpoints) {
          try {
            const response = await api.get(endpoint.url);
            newCategories[endpoint.key] = response.data.map((item) => ({
              ...item,
              id: item.id || Math.random().toString(36).substr(2, 9),
              category: endpoint.key,
            }));
          } catch (err) {
            console.error(`Error fetching ${endpoint.key} data:`, err);
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "/login";
          }
        }
        setCategories(newCategories);
        setIsLoading(false);
      } catch (err) {
        setError("Không thể tải dữ liệu. Vui lòng thử lại.");
        setIsLoading(false);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return;
      }
    };

    fetchAllData();
  }, []);

  // Hàm xử lý tìm kiếm
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowSuggestions(value.trim().length > 0);
    setIsSearching(true);

    if (value.trim().length > 0) {
      const suggestions = Object.values(categories)
        .flat()
        .filter(
          (item) =>
            item.name?.toLowerCase().includes(value.toLowerCase()) ||
            item.description?.toLowerCase().includes(value.toLowerCase())
        )
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
    setCurrentPage(1);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setSearchSuggestions([]);
    setShowSuggestions(false);
    setCurrentPage(1);
  };

  const handleSelectSuggestion = (item) => {
    setSearchTerm(item.name);
    setActiveTab(item.category);
    setShowSuggestions(false);
    setCurrentPage(1);
  };

  const filteredItems = (categories[activeTab] || []).filter(
    (item) =>
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedItems = filteredItems.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleAddItem = () => {
    setModalMode("add");
    setFormData({
      name: "",
      description: "",
      imageURL: "",
      category: activeTab,
    });
    setNameError("");
    setImageFile(null);
    setImagePreview(null);
    setIsModalOpen(true);
  };

  const handleEditItem = (item) => {
    setSelectedItem(item);
    setFormData({
      name: item.name || "",
      description: item.description || "",
      category: item.category || activeTab,
      device: item.device || "Chọn thiết bị",
    });
    setNameError("");
    setImagePreview(`${REACT_APP_URL_BE}${item.imagePath}`);
    setImageFile(null);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleViewItem = (item) => {
    setSelectedItem(item);
    setModalMode("view");
    setIsModalOpen(true);
  };

  const handleDeleteItem = (item) => {
    setSelectedItem(item);
    setModalMode("delete");
    setIsModalOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const checkNameExists = (name, category, currentItemId = null) => {
    return categories[category].some(
      (item) =>
        item.name?.toLowerCase() === name.toLowerCase() &&
        (currentItemId === null || item.id !== currentItemId)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedName = formData.name.trim();

    if (modalMode === "add" || modalMode === "edit") {
      if (trimmedName === "") {
        setNameError("Tên không được để trống");
        return;
      }
    }

    try {
      if (modalMode === "add") {
        if (!imageFile) {
          setError("Vui lòng chọn hình ảnh cho thành phần mới");
          return;
        }
        const currentItemId = modalMode === "edit" ? selectedItem.id : null;
        if (checkNameExists(trimmedName, formData.category, currentItemId)) {
          setNameError(
            "Tên này đã tồn tại trong danh mục, vui lòng chọn tên khác"
          );
          return;
        }
        let form = new FormData();
        form.append("image", imageFile);
        form.append("name", trimmedName);
        form.append("description", formData.description || "");
        form.append("category", formData.category);
        form.append("device", formData.device || "");

        const response = await api.post(
          `${REACT_APP_URL_BE}/uploadWeakPoint`,
          form,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
        showSnackbar("Thêm mẫu điểm yếu thành công", "success");
        setCategories((prev) => ({
          ...prev,
          [formData.category]: [
            ...prev[formData.category],
            { ...response.data.newWeakPoint, category: formData.category },
          ],
        }));
      } else if (modalMode === "edit") {
        let form = new FormData();
        if (imageFile) {
          form.append("image", imageFile);
        }

        form.append("name", trimmedName);
        form.append("description", formData.description || "");
        form.append("device", formData.device);

        const data = await api.put(
          `${REACT_APP_URL_BE}/updateWeakPoint/${selectedItem._id}`,
          form
        );
        showSnackbar("Cập nhật mẫu điểm yếu thành công", "success");
        setCategories((prev) => ({
          ...prev,
          [formData.category]: prev[formData.category].map((item) =>
            item._id === selectedItem._id
              ? { ...data.data.weakPoint, category: formData.category }
              : item
          ),
        }));
      } else if (modalMode === "delete") {
        await api.delete(
          `${REACT_APP_URL_BE}/deleteWeakPoint/${selectedItem._id}`
        );
        showSnackbar("Xóa mẫu điểm yếu thành công", "success");

        setCategories((prev) => ({
          ...prev,
          [activeTab]: prev[activeTab].filter(
            (item) => item._id !== selectedItem._id
          ),
        }));
      }

      setIsModalOpen(false);
      setSelectedItem(null);
      setImageFile(null);
      setImagePreview(null);
      setNameError("");
    } catch (err) {
      console.error("Operation failed:", err);
      if (error.response && error.response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        window.location.href = "/login";
        return;
      }
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setCurrentPage(1);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "name") {
      if (value.trim() === "") {
        setNameError("Tên không được để trống");
      } else if (
        checkNameExists(
          value,
          formData.category,
          modalMode === "edit" ? selectedItem?.id : null
        )
      ) {
        setNameError(
          "Tên này đã tồn tại trong danh mục, vui lòng chọn tên khác"
        );
      } else {
        setNameError("");
      }
    }
  };

  const categoryNames = {
    jtag: "JTAG",
    testPin: "Test Pin",
    lpc: "LPC",
    footprint: "Footprint",
    unusedPort: "Unused Port",
    vias: "Vias",
    spi: "SPI",
    smb: "SMB",
  };

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
            justifyContent: "start",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Memory sx={{ fontSize: 40, mr: 2 }} />
            <Typography variant="h6" component="h1" sx={{ fontWeight: 600 }}>
              Điểm yếu bo mạch
            </Typography>
          </Box>
        </Box>
      </Paper>
      <Box>
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
                          image={`${REACT_APP_URL_BE}${item.imagePath}`}
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

            {hasPermission(user, "addAccessory") && (
              <AddButton
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddItem}
              >
                Thêm
              </AddButton>
            )}
          </Box>
        </Box>
      </Box>

      <Paper elevation={2} sx={{ borderRadius: 3, overflow: "hidden", mb: 4 }}>
        <Box sx={{ bgcolor: "background.paper" }}>
          <StyledTabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ px: 2 }}
          >
            {Object.keys(categories).map((category) => (
              <StyledTab
                key={category}
                label={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Category fontSize="small" />
                    <span>{categoryNames[category]}</span>
                    <Chip
                      label={categories[category].length}
                      size="small"
                      color="primary"
                      sx={{ borderRadius: 1 }}
                    />
                  </Stack>
                }
                value={category}
              />
            ))}
          </StyledTabs>
        </Box>

        <Box sx={{ p: 3 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems="center"
            spacing={2}
            sx={{ mb: 3 }}
          >
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              <Box component="span" color="primary.main">
                {categoryNames[activeTab]}
              </Box>
              <Box component="span" sx={{ ml: 1, color: "text.secondary" }}>
                ({filteredItems.length} items)
              </Box>
            </Typography>
          </Stack>

          {error && (
            <Alert
              severity="error"
              onClose={() => setError(null)}
              sx={{ mb: 3, borderRadius: 2 }}
            >
              {error}
            </Alert>
          )}

          {isLoading ? (
            <Box sx={{ textAlign: "center", py: 5 }}>
              <CircularProgress color="primary" size={60} thickness={4} />
              <Typography variant="body1" sx={{ mt: 2 }}>
                Đang tải dữ liệu...
              </Typography>
            </Box>
          ) : (
            <>
              {displayedItems.length > 0 ? (
                <Grid container spacing={3}>
                  {displayedItems.map((item, index) => (
                    <Grid
                      item
                      xs={12}
                      sm={6}
                      md={4}
                      lg={3}
                      key={item.id || index}
                    >
                      <CategoryCard>
                        <Box sx={{ position: "relative" }}>
                          <CardMedia
                            component="img"
                            height="180"
                            image={`${REACT_APP_URL_BE}${item.imagePath}`}
                            alt={item.name || `Thành phần ${index + 1}`}
                            sx={{
                              objectFit: "contain",
                              p: 2,
                              cursor: "pointer",
                              bgcolor: "background.default",
                              borderRadius: 1,
                            }}
                            onClick={() => handleViewItem(item)}
                          />
                          <Chip
                            label={categoryNames[activeTab]}
                            size="small"
                            color="primary"
                            sx={{
                              position: "absolute",
                              top: 8,
                              left: 8,
                              fontWeight: 600,
                              textTransform: "capitalize",
                            }}
                          />
                        </Box>

                        <CardContent sx={{ flexGrow: 1 }}>
                          <Typography
                            variant="h6"
                            gutterBottom
                            sx={{
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {item.name || `Thành phần ${index + 1}`}
                          </Typography>

                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              mb: 1,
                            }}
                          >
                            {item.description || "Không có mô tả"}
                          </Typography>

                          {item.createdAt && (
                            <Typography variant="caption" color="text.disabled">
                              Tạo lúc:{" "}
                              {new Date(item.createdAt).toLocaleString()}
                            </Typography>
                          )}
                        </CardContent>

                        <Divider />

                        <CardActions
                          sx={{ justifyContent: "space-between", p: 1.5 }}
                        >
                          <Tooltip title="Xem chi tiết">
                            <IconButton
                              color="info"
                              onClick={() => handleViewItem(item)}
                              aria-label="view"
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          {hasPermission(user, "UpdateAndDeleteWeakPoint") && (
                            <Stack direction="row" spacing={1}>
                              <Tooltip title="Sửa">
                                <IconButton
                                  color="secondary"
                                  onClick={() => handleEditItem(item)}
                                  aria-label="edit"
                                >
                                  <Edit />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Xóa">
                                <IconButton
                                  color="error"
                                  onClick={() => handleDeleteItem(item)}
                                  aria-label="delete"
                                >
                                  <Delete />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          )}
                        </CardActions>
                      </CategoryCard>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box
                  sx={{
                    textAlign: "center",
                    py: 8,
                    border: "1px dashed",
                    borderColor: "divider",
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    {searchTerm
                      ? "Không tìm thấy kết quả"
                      : "Không có thành phần nào"}
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ mb: 3 }}
                  >
                    {searchTerm
                      ? "Hãy thử với từ khóa khác hoặc xóa bộ lọc tìm kiếm"
                      : "Bạn có muốn thêm thành phần đầu tiên cho danh mục này không?"}
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleAddItem}
                    sx={{ borderRadius: 2 }}
                  >
                    Thêm thành phần
                  </Button>
                </Box>
              )}

              {filteredItems.length > 0 && (
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  alignItems="center"
                  spacing={2}
                  sx={{ mt: 4 }}
                >
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Số mục/trang</InputLabel>
                    <Select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value={8}>8</MenuItem>
                      <MenuItem value={16}>16</MenuItem>
                      <MenuItem value={24}>24</MenuItem>
                      <MenuItem value={48}>48</MenuItem>
                    </Select>
                  </FormControl>
                  <Typography variant="body2" color="text.secondary">
                    Hiển thị {startIndex + 1}-
                    {Math.min(startIndex + itemsPerPage, filteredItems.length)}{" "}
                    / {filteredItems.length} mục
                  </Typography>
                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={(e, page) => setCurrentPage(page)}
                    color="primary"
                    shape="rounded"
                    showFirstButton
                    showLastButton
                    sx={{ "& .MuiPaginationItem-root": { borderRadius: 1 } }}
                  />
                </Stack>
              )}
            </>
          )}
        </Box>
      </Paper>

      {/* Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setImagePreview(null);
          setImageFile(null);
          setNameError("");
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "95%", sm: 500, md: 600 },
            bgcolor: "background.paper",
            borderRadius: 3,
            boxShadow: 24,
            outline: "none",
            display: "flex",
            flexDirection: "column",
            maxHeight: "90vh",
          }}
        >
          <Box sx={{ p: 3, borderBottom: 1, borderColor: "divider" }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {modalMode === "add"
                ? "Thêm Thành Phần Mới"
                : modalMode === "edit"
                ? "Chỉnh Sửa Thành Phần"
                : modalMode === "delete"
                ? "Xác Nhận Xóa"
                : "Chi Tiết Thành Phần"}
            </Typography>
          </Box>

          <Box
            sx={{
              p: 3,
              flex: 1,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {modalMode === "delete" ? (
              <Box
                sx={{
                  textAlign: "center",
                  py: 2,
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <Warning color="error" sx={{ fontSize: 60, mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Xác nhận xóa điểm yếu?
                </Typography>
                <Typography variant="body1" sx={{ mb: 3 }}>
                  Bạn đang xóa điểm yếu <strong>"{selectedItem?.name}"</strong>.
                  Hành động này không thể hoàn tác.
                </Typography>
              </Box>
            ) : modalMode === "view" ? (
              <Box
                sx={{
                  flex: 1,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Box
                  sx={{
                    flexShrink: 0,
                    display: "flex",
                    justifyContent: "center",
                    mb: 3,
                    bgcolor: "background.default",
                    borderRadius: 2,
                    overflow: "hidden",
                    height: 300,
                  }}
                >
                  <img
                    src={`${REACT_APP_URL_BE}${selectedItem?.imagePath}`}
                    alt={selectedItem?.name}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                    }}
                    onError={(e) => {
                      e.target.src = "/placeholder-image.jpg";
                    }}
                  />
                </Box>

                <Box
                  sx={{
                    flex: 1,
                    overflow: "auto",
                    "&::-webkit-scrollbar": {
                      display: "none",
                    },
                  }}
                >
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell sx={{ fontWeight: "bold", width: "30%" }}>
                            Tên
                          </TableCell>
                          <TableCell>
                            {selectedItem?.name || "Không có tên"}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: "bold" }}>
                            Mô tả
                          </TableCell>
                          <TableCell>
                            {selectedItem?.description || "Không có mô tả"}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: "bold" }}>
                            Thiết bị
                          </TableCell>
                          <TableCell>
                            {selectedItem?.device && selectedItem.device !== 'undefined' ? (
                              <Chip
                                label={selectedItem.device}
                                color="secondary"
                                size="small"
                                icon={<Memory fontSize="small" />}
                              />
                            ) : (
                              "Không có thiết bị"
                            )}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: "bold" }}>
                            Danh mục
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={
                                categoryNames[
                                  selectedItem?.category || activeTab
                                ]
                              }
                              color="primary"
                              size="small"
                              avatar={<Category fontSize="small" />}
                            />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: "bold" }}>
                            Ngày tạo
                          </TableCell>
                          <TableCell>
                            {selectedItem?.createdAt
                              ? new Date(
                                  selectedItem.createdAt
                                ).toLocaleString()
                              : "Không có dữ liệu"}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: "bold" }}>
                            Ngày cập nhật
                          </TableCell>
                          <TableCell>
                            {selectedItem?.updatedAt
                              ? new Date(
                                  selectedItem.updatedAt
                                ).toLocaleString()
                              : "Không có dữ liệu"}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </Box>
            ) : (
              <form
                onSubmit={handleSubmit}
                style={{ flex: 1, display: "flex", flexDirection: "column" }}
              >
                <Stack spacing={3} sx={{ flex: 1 }}>
                  <TextField
                    fullWidth
                    label="Tên thành phần"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    variant="outlined"
                    size="small"
                    error={!!nameError}
                    helperText={nameError}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                  />
                  <TextField
                    fullWidth
                    label="Mô tả"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    variant="outlined"
                    size="small"
                    multiline
                    rows={3}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                  />

                  <TextField
                    fullWidth
                    select
                    name="device"
                    value={formData.device}
                    onChange={handleInputChange}
                    required
                    variant="outlined"
                    SelectProps={{
                      displayEmpty: true,
                      renderValue: (selected) =>
                        selected ? (
                          selected
                        ) : (
                          <span style={{ color: theme.palette.text.secondary }}>
                            Chọn thiết bị
                          </span>
                        ),
                    }}
                  >
                    <MenuItem value="">
                   
                    </MenuItem>
                    <MenuItem value="Router">Router</MenuItem>
                    <MenuItem value="PC">PC</MenuItem>
                    <MenuItem value="USB">USB</MenuItem>
                    <MenuItem value="Access Point">Access Point</MenuItem>
                    <MenuItem value="Switch">Switch</MenuItem>
                    <MenuItem value="Server">Server</MenuItem>
                    <MenuItem value="FPGA">FPGA</MenuItem>
                  </TextField>

                  <Box sx={{ flexShrink: 0 }}>
                    <Button
                      variant="outlined"
                      component="label"
                      fullWidth
                      startIcon={<CloudUpload />}
                      sx={{ borderRadius: 2 }}
                    >
                      Tải lên hình ảnh
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </Button>
                    {modalMode === "add" && !imagePreview && (
                      <Typography
                        variant="caption"
                        color="error"
                        sx={{ display: "block", mt: 1 }}
                      >
                        Vui lòng chọn hình ảnh cho thành phần
                      </Typography>
                    )}
                    {(imagePreview ||
                      (modalMode === "edit" &&
                        selectedItem?.imagePath &&
                        !imagePreview)) && (
                      <Box sx={{ mt: 2, textAlign: "center" }}>
                        <Typography variant="caption" color="text.secondary">
                          Xem trước:
                        </Typography>
                        <Box
                          sx={{
                            mt: 1,
                            p: 1,
                            border: "1px dashed",
                            borderColor: "divider",
                            borderRadius: 1,
                            height: 150,
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <img
                            src={
                              imagePreview ||
                              `${REACT_APP_URL_BE}${selectedItem.imagePath}`
                            }
                            alt="Preview"
                            style={{
                              maxWidth: "100%",
                              maxHeight: "100%",
                              objectFit: "contain",
                            }}
                            onError={(e) => {
                              e.target.src = "/placeholder-image.jpg";
                            }}
                          />
                        </Box>
                      </Box>
                    )}
                  </Box>
                </Stack>
              </form>
            )}
          </Box>

          <Box
            sx={{
              p: 2,
              borderTop: 1,
              borderColor: "divider",
              textAlign: "right",
              flexShrink: 0,
            }}
          >
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={() => {
                  setIsModalOpen(false);
                  setNameError("");
                }}
                sx={{ borderRadius: 2 }}
              >
                {modalMode === "view" ? "Đóng" : "Hủy"}
              </Button>
              {modalMode !== "view" && (
                <Button
                  variant="contained"
                  color={modalMode === "delete" ? "error" : "primary"}
                  onClick={handleSubmit}
                  startIcon={
                    modalMode === "delete" ? <Delete /> : <CloudUpload />
                  }
                  disabled={
                    (modalMode !== "delete" &&
                      (!!nameError || formData.name.trim() === "")) ||
                    (modalMode === "add" && !imageFile)
                  }
                  sx={{ borderRadius: 2 }}
                >
                  {modalMode === "add"
                    ? "Thêm"
                    : modalMode === "edit"
                    ? "Lưu"
                    : "Xóa"}
                </Button>
              )}
            </Stack>
          </Box>
        </Box>
      </Modal>

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

export default WeakPoint;
