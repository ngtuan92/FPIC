import React, { useState, useEffect } from "react";
import {
  Alert,
  Pagination,
  Snackbar,
  Fade,
  Box,
  Typography,
} from "@mui/material";

import { ImageNotSupported as ImageNotSupportedIcon } from "@mui/icons-material";

import "./Accessory.css";
import { Col, Row, Card } from "react-bootstrap";
import { AccessoryDetailDialog } from "./components/AccessoryDetailDialog";
import { REACT_APP_URL_BE } from "./config";
import api from "./api";
import SeachBox from "./components/SeachBox";
import AddAccessoryDialog from "./components/AddAccessoryDialog";

const Transition = React.forwardRef((props, ref) => (
  <Fade ref={ref} {...props} timeout={700} />
));

function Accessory() {
  const [page, setPage] = useState(1);
  const [limit] = useState(18);
  const [pageAccessory, setPageAccessory] = useState(1);
  const [limitAccessory] = useState(9999);
  const [typeSelected, setTypeSelected] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [showModalDesc, setShowModalDesc] = useState(false);

  const [errors, setErrors] = useState({});
  const [isLoadingButton, setIsLoadingButton] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [formDataUpdate, setFormDataUpdate] = useState({});
  const [formData, setFormData] = useState({
    _id: "",
    title: "",
    image: null,
    type: "",
    description: "",
  });
  const [formAccessory, setFormAccessory] = useState({
    _id: "",
    title: "",
    image: "",
    imagePath: "", // ← THÊM
    type: "",
    description: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [search, setSearch] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const [data, setData] = useState({
    typesAccessories: [],
    accessories: [],
    pagination: { totalPages: 0, currentPage: 1, totalItem: 0 },
    pagination_access: { totalPages: 0, currentPage: 1, totalItem: 0 },
    isLoading: false,
    error: null,
  });

  const [snackBar, setSnackBar] = useState({
    open: false,
    message: "",
    severity: "",
  });

  useEffect(() => {
    fetchData();
  }, [page, limit, search]);

  useEffect(() => {
    if (data.accessories.length > 0 && formAccessory.type) {
      fetchAccessories(formAccessory.type);
    }
  }, [pageAccessory, limitAccessory]);

  useEffect(() => {
    if (
      data.accessories &&
      data.accessories.length > 0 &&
      currentIndex < data.accessories.length
    ) {
      const currentItem = data.accessories[currentIndex];
      if (currentItem && currentItem._id) {
        setFormAccessory({ ...currentItem });
        setFormDataUpdate({ ...currentItem });
      }
    }
  }, [data.accessories, currentIndex]);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchTerm.trim()) {
        handleSearch(searchTerm);
      } else {
        setSearchSuggestions([]);
        setShowSuggestions(false);
      }
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [searchTerm]);

  const fetchData = async () => {
    try {
      setData((prev) => ({ ...prev, isLoading: true, error: null }));
      const response = await api.get(
        `${REACT_APP_URL_BE}/get-types-accessory`,
        {
          params: { page, limit, query: search },
        }
      );

      setData((prev) => ({
        ...prev,
        typesAccessories: response.data.data || [],
        pagination: response.data.pagination || {
          totalPages: 0,
          currentPage: 1,
          totalItem: 0,
        },
        isLoading: false,
      }));

      if (response.data.pagination?.currentPage) {
        setPage(response.data.pagination.currentPage);
      }
    } catch (error) {
      setData((prev) => ({ ...prev, isLoading: false, error }));
      showNotification(
        error.response?.data?.message || "Lỗi hệ thống",
        "error"
      );
      if (error.response && error.response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        showNotification(
          "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại",
          "error"
        );
        window.location.href = "/login";
        return;
      }
    }
  };

  const fetchAccessories = async (type) => {
    if (data.isLoading) return;

    const controller = new AbortController();
    try {
      setData((prev) => ({ ...prev, isLoading: true }));
      const response = await api.get(`${REACT_APP_URL_BE}/accessory`, {
        params: { page: pageAccessory, limit: limitAccessory, type },
        signal: controller.signal,
      });

      if (response) {
        console.log("✅ Fetched accessories:", response.data.data);
        console.log("✅ First accessory:", response.data.data[0]);
        console.log("✅ ImagePath:", response.data.data[0]?.imagePath);
        setData((prev) => ({
          ...prev,
          accessories: response.data.data,
          pagination_access: response.data.pagination,
          isLoading: false,
        }));

        if (response.data.pagination?.currentPage) {
          setPageAccessory(response.data.pagination.currentPage);
        }

        if (response.data.data?.length > 0) {
          setCurrentIndex(0);
          setFormAccessory({ ...response.data.data[0] });
          setFormDataUpdate({ ...response.data.data[0] });
        }
      }
    } catch (error) {
      setData((prev) => ({ ...prev, error, isLoading: false }));
      showNotification(
        error.response?.data?.message || "Lỗi hệ thống",
        "error"
      );
      if (error.response && error.response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        showNotification(
          "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại",
          "error"
        );
        window.location.href = "/login";
        return;
      }
    }

    return () => controller.abort();
  };

  const handleSearch = async (query) => {
    if (!query.trim()) {
      clearSearchState();
      return;
    }

    setIsSearching(true);
    try {
      const response = await api.get(
        `${REACT_APP_URL_BE}/get-types-accessory`,
        {
          params: { query, limit: 5 },
        }
      );

      setSearchSuggestions(response.data.data || []);
      setShowSuggestions(true);
    } catch (error) {
      setSearchSuggestions([]);
      showNotification("Không thể tìm kiếm. Vui lòng thử lại sau.", "error");
      if (error.response && error.response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        showNotification(
          "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại",
          "error"
        );
        window.location.href = "/login";
        return;
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleCreateAccessory = async () => {
    setIsLoadingButton(true);
    const form = new FormData();
    form.append("title", formData.title);
    form.append("description", formData.description ?? "");
    form.append("type", typeSelected._id);
    form.append("file", formData.image);

    try {
      const response = await api.post(`${REACT_APP_URL_BE}/accessory`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response) {
        showNotification("Thêm thành công!", "success");
        await fetchAccessories(typeSelected._id);
        resetFormData();
        setShowModal(false);
      }
    } catch (error) {
      showNotification(
        error.response?.data?.message || `Lỗi máy chủ: ${error}`,
        "error"
      );
      if (error.response && error.response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        showNotification(
          "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại",
          "error"
        );
        window.location.href = "/login";
        return;
      }
    } finally {
      setIsLoadingButton(false);
    }
  };

  const handleAccessoryUpdated = (updatedAccessory) => {
    if (!updatedAccessory || !updatedAccessory._id) return;

    setData((prevData) => {
      const newAccessories = prevData.accessories.map((acc) =>
        acc._id === updatedAccessory._id ? { ...updatedAccessory } : acc
      );

      return {
        ...prevData,
        accessories: newAccessories,
      };
    });

    if (formAccessory._id === updatedAccessory._id) {
      setFormAccessory({ ...updatedAccessory });
      setFormDataUpdate({ ...updatedAccessory });
    }
  };

  const showNotification = (message, severity) => {
    setSnackBar({
      open: true,
      message,
      severity,
    });
  };

  const resetFormData = () => {
    setFormData({
      _id: "",
      title: "",
      image: null,
      type: "",
      description: "",
    });
  };

  const clearSearchState = () => {
    setSearchSuggestions([]);
    setShowSuggestions(false);
    setSearch("");
  };

  const isBase64 = React.useMemo(() => {
    return (str) => {
      if (!str) return false;
      try {
        return btoa(atob(str)) === str;
      } catch (err) {
        return false;
      }
    };
  }, []);

  const handlePageChange = (_, newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAccessoryPageChange = (_, newPage) => {
    setPageAccessory(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleInputChange = (event) => {
    const { name, type, value, files } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "file" ? files[0] : value,
    }));
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (!value.trim()) {
      clearSearchState();
    }
  };

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    setSearch(searchTerm);
    setShowSuggestions(false);
    setPage(1);
  };

  const handleSelectSuggestion = (accessory) => {
    setSearchTerm(accessory.title);
    setSearch(accessory.title);
    setShowSuggestions(false);
    setPage(1);

    if (accessory.type) {
      fetchAccessories(accessory.type);
      handleClickModalDesc(true);
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
    setSearch("");
    clearSearchState();
    setPage(1);
    fetchData();
  };

  const handleClickItem = (type) => {
    setTypeSelected(type);
    setPageAccessory(1);
    fetchAccessories(type._id);
    handleClickModalDesc(true);
  };

  const handleClickOnAnotherImage = (index) => {
    setCurrentIndex(index);
  };

  const hanldeClickNextImage = () => {
    if (data.accessories.length > 0) {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % data.accessories.length);
    }
  };

  const hanldeClickPreviosImage = () => {
    if (data.accessories.length > 0) {
      setCurrentIndex((prevIndex) =>
        prevIndex === 0 ? data.accessories.length - 1 : prevIndex - 1
      );
    }
  };

  const handleSnackbarClose = () => {
    setSnackBar({ open: false, message: "", severity: "" });
  };

  const handleClickModalDesc = (status) => {
    setShowModalDesc(status);
    if (!status && data.accessories[currentIndex]) {
      setFormAccessory({ ...data.accessories[currentIndex] });
    }
  };

  // ← SỬA: Hàm hiển thị ảnh xử lý cả imagePath và image (base64)
  const getImageSource = (item) => {
    if (!item) return "/placeholder-microchip.png";

    // Ưu tiên imagePath (ảnh mới)
    if (item.imagePath) {
      return `${REACT_APP_URL_BE}${item.imagePath}`;
    }

    // Fallback sang image (base64 - ảnh cũ)
    if (item.image) {
      if (isBase64(item.image)) {
        return `${REACT_APP_URL_BE}${atob(item.image)}`;
      }
      return `${REACT_APP_URL_BE}${item.image}`;
    }

    return "/placeholder-microchip.png";
  };

  const renderAccessoryGrid = () => {
    if (data.isLoading) {
      return (
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      );
    }

    if (data.typesAccessories.length === 0) {
      return (
        <Box sx={{ textAlign: "center", py: 5 }}>
          <ImageNotSupportedIcon
            sx={{ fontSize: 60, color: "text.secondary", mb: 2 }}
          />
          <Typography variant="h6">
            {search
              ? "Không tìm thấy linh kiện phù hợp"
              : "Chưa có linh kiện nào được thêm vào"}
          </Typography>
          <Typography color="text.secondary">
            {search
              ? "Vui lòng thử tìm kiếm với từ khóa khác"
              : "Bắt đầu bằng cách thêm linh kiện mới"}
          </Typography>
        </Box>
      );
    }

    return (
      <div className="image-grid">
        {data.typesAccessories.map((type, index) => {
          const imageSrc = getImageSource(type);

          return (
            <Card
              key={type._id || index}
              className="m-2"
              style={{ cursor: "pointer" }}
              onClick={() => handleClickItem(type)}
            >
              <Card.Img
                variant="top"
                src={imageSrc}
                alt={type?.title || "Linh kiện"}
                style={{
                  width: "100%",
                  height: "200px",
                  objectFit: "cover",
                }}
                onError={(e) => {
                  console.error(
                    `Failed to load image for ${type?.title}:`,
                    imageSrc
                  );
                  e.target.src = "/placeholder-microchip.png";
                }}
              />
              <Card.Body>
                <Card.Title>{type?.title || "Không có tiêu đề"}</Card.Title>
              </Card.Body>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-image">
      <Box>
        <SeachBox
          handleSearchSubmit={handleSearchSubmit}
          handleSearchChange={handleSearchChange}
          searchTerm={searchTerm}
          setShowSuggestions={setShowSuggestions}
          clearSearch={clearSearch}
          showSuggestions={showSuggestions}
          searchSuggestions={searchSuggestions}
          handleSelectSuggestion={handleSelectSuggestion}
          isBase64={isBase64}
          isSearching={isSearching}
          setShowModal={setShowModal}
        />

        <Row>
          <Col className="main-content">
            <div className="app">
              <div className="table">
                <div>{renderAccessoryGrid()}</div>
              </div>

              {data.pagination.totalPages > 1 && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    marginTop: "20px",
                    padding: "10px",
                  }}
                >
                  <Pagination
                    count={data.pagination.totalPages}
                    page={page}
                    onChange={handlePageChange}
                    showFirstButton
                    showLastButton
                    shape="rounded"
                    color="primary"
                    size="large"
                    siblingCount={1}
                    boundaryCount={1}
                  />
                </Box>
              )}
            </div>
          </Col>
        </Row>
      </Box>

      <AccessoryDetailDialog
        setShowModal={setShowModal}
        showModalDesc={showModalDesc}
        handleClickModalDesc={handleClickModalDesc}
        formAccessory={formAccessory}
        formDataUpdate={formDataUpdate}
        setFormDataUpdate={setFormDataUpdate}
        data={data}
        errors={errors}
        isLoadingButton={isLoadingButton}
        handleClickOnAnotherImage={handleClickOnAnotherImage}
        hanldeClickPreviosImage={hanldeClickPreviosImage}
        hanldeClickNextImage={hanldeClickNextImage}
        Transition={Transition}
        isBase64={isBase64}
        getImageSource={getImageSource}
        setIsLoadingButton={setIsLoadingButton}
        setSnackBar={setSnackBar}
        setData={setData}
        pageAccessory={pageAccessory}
        handleAccessoryPageChange={handleAccessoryPageChange}
        onAccessoryUpdated={handleAccessoryUpdated}
        currentIndex={currentIndex}
      />

      <AddAccessoryDialog
        setShowModal={setShowModal}
        Transition={Transition}
        data={data}
        showModal={showModal}
        formData={formData}
        handleInputChange={handleInputChange}
        errors={errors}
        handleCreateAccessory={handleCreateAccessory}
        isLoadingButton={isLoadingButton}
        typeSelected={typeSelected}
        setFormData={setFormData}
      />

      <Snackbar
        open={snackBar.open}
        autoHideDuration={3000}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        onClose={handleSnackbarClose}
        TransitionComponent={Transition}
      >
        <Alert onClose={handleSnackbarClose} severity={snackBar.severity}>
          {snackBar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default Accessory;
