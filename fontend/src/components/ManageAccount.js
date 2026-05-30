import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Button,
  Form,
  Modal,
  Badge,
} from "react-bootstrap";
import AccountContext from "../context/AccountContext";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  FiEdit2,
  FiTrash2,
  FiUserPlus,
  FiSearch,
  FiShield,
  FiSave,
  FiAlertTriangle,
  FiAlertCircle,
  FiUser,
  FiLock,
  FiInfo,
  FiMail,
} from "react-icons/fi";
import {
  Paper,
  styled,
  TextField,
  Box,
  InputAdornment,
  useTheme,
  alpha,
  Typography,
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Memory,
} from "@mui/icons-material";

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

const ManageAccount = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);

  const [search, setSearch] = useState("");
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [accountToDelete, setAccountToDelete] = useState(null);
  const [accountToUpdate, setAccountToUpdate] = useState(null);
  const [newAccount, setNewAccount] = useState({
    password: "",
    fullName: "",
    email: "",
  });
  const [accountUpdated, setAccountUpdated] = useState({
    password: "",
    fullName: "",
    email: "",
    status: "",
  });

  const { type } = useParams();

  const roleTranslations = {
    admin: "Quản trị viên",
    editor: "Đánh giá viên",
    viewer: "Khách hàng",
    assessor: "Đánh giá viên",
    user: "Người dùng",
  };

  // Handle token expiration
  const handleTokenExpiration = (status) => {
    if (status === 401) {
      // Clear user data from localStorage
      localStorage.removeItem("user");
      localStorage.removeItem("token");

      // Show alert about session expiration
      Swal.fire({
        icon: "warning",
        title: "Phiên đăng nhập hết hạn",
        text: "Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại.",
        confirmButtonText: "Đăng nhập lại",
      }).then(() => {
        // Redirect to login page
        navigate("/login");
      });
      return true; // Token is expired
    }
    return false; // Token is valid
  };

  const fetchAccounts = async () => {
    try {
      const response = await AccountContext.getAllAccounts();

      if (handleTokenExpiration(response.status)) {
        return; // Stop execution if token expired
      } else if (response.status === 403) {
        setErrorMessage("Bạn không có quyền truy cập tài nguyên này.");
      } else if (response.status === "success" && response.accounts) {
        setAccounts(
          response.accounts.filter((account) => account.role === type)
        );
        setFilteredAccounts(
          response.accounts.filter((account) => account.role === type)
        );
        setErrorMessage("");
      } else {
        setErrorMessage(
          response.message || "Có lỗi xảy ra khi lấy danh sách tài khoản."
        );
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Lỗi server...",
        text: "Có lỗi xảy ra khi lấy danh sách tài khoản.",
      });
      console.error("Failed to fetch accounts:", error);
      setErrorMessage("Có lỗi xảy ra khi lấy danh sách tài khoản.");
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [type]);

  const handleCreateAccount = async () => {
    try {
      const response = await AccountContext.createAccount({
        ...newAccount,
        role: type,
      });

      if (handleTokenExpiration(response.status)) {
        return; // Stop execution if token expired
      } else if (response.status === 201) {
        const updatedAccounts = [...accounts, response.data.account];
        setAccounts(updatedAccounts);
        setFilteredAccounts(updatedAccounts);
        setShowModal(false);

        setNewAccount({
          password: "",
          fullName: "",
          email: "",
        });

        Swal.fire({
          icon: "success",
          title: "Thành công!",
          text: "Tài khoản đã được tạo thành công.",
        });
        setErrorMessage("");
      } else {
        setErrorMessage(response.data.message);
        setShowModal(false);
      }
    } catch (error) {
      console.error("Failed to create account:", error);
      Swal.fire({
        icon: "error",
        title: "Lỗi server...",
        text: "Có lỗi xảy ra khi tạo tài khoản",
      });
      setErrorMessage("Có lỗi xảy ra khi tạo tài khoản.");
    }
  };

  const handleUpdateAccount = async () => {
    try {
      const response = await AccountContext.updateAccount(
        accountToUpdate._id,
        accountUpdated
      );

      if (handleTokenExpiration(response.status)) {
        return; // Stop execution if token expired
      } else if (response.status === 200) {
        const updatedAccounts = accounts.map((account) =>
          account._id === accountUpdated._id ? accountUpdated : account
        );
        setAccounts(updatedAccounts);
        fetchAccounts();
        setFilteredAccounts(updatedAccounts);
        Swal.fire({
          icon: "success",
          title: "Thành công!",
          text: "Cập nhật tài khoản thành công!",
          confirmButtonText: "OK",
        });
        setShowUpdateModal(false);
        setErrorMessage("");
      } else {
        setErrorMessage("Có lỗi xảy ra khi cập nhật tài khoản.");
      }
    } catch (error) {
      console.error("Failed to update account:", error);
      Swal.fire({
        icon: "error",
        title: "Lỗi server...",
        text: "Có lỗi xảy ra khi cập nhật tài khoản",
      });
      setErrorMessage("Có lỗi xảy ra khi cập nhật tài khoản.");
    }
  };

  const handleDeleteAccount = async () => {
    if (!accountToDelete) return;

    try {
      const response = await AccountContext.deleteAccount(accountToDelete._id);

      if (handleTokenExpiration(response.status)) {
        return; // Stop execution if token expired
      } else if (response.status === 200) {
        const updatedAccounts = accounts.filter(
          (account) => account._id !== accountToDelete._id
        );
        setAccounts(updatedAccounts);
        setFilteredAccounts(updatedAccounts);
        setShowDeleteModal(false);
        Swal.fire({
          icon: "success",
          title: "Thành công!",
          text: "Xóa tài khoản thành công!",
          confirmButtonText: "OK",
        });
        setErrorMessage("");
      } else {
        setErrorMessage("Có lỗi xảy ra khi xóa tài khoản.");
      }
    } catch (error) {
      console.error("Failed to delete account:", error);
      Swal.fire({
        icon: "error",
        title: "Lỗi server...",
        text: "Có lỗi xảy ra khi xóa tài khoản",
      });
      setErrorMessage("Có lỗi xảy ra khi xóa tài khoản.");
    }
  };

  useEffect(() => {
    const results = accounts.filter(
      (account) =>
        account.email.toLowerCase().includes(search.toLowerCase()) ||
        account.fullName.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredAccounts(results);
  }, [search, accounts]);

  return (
    <Container fluid className="">
      <Row className="mb-4 align-items-center">
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
              <Typography variant="h6" component="h1" sx={{ fontWeight: 700 }}>
                Quản lý tài khoản{" "}
                {type && `(${roleTranslations[type] || type})`}
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
              <StyledPaper elevation={1} component="form" sx={{ flex: 1 }}>
                <StyledTextField
                  fullWidth
                  variant="outlined"
                  placeholder="Tìm kiếm theo tên hoặc email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon
                          color="primary"
                          sx={{ fontSize: "1.25rem" }}
                        />
                      </InputAdornment>
                    ),
                  }}
                />
              </StyledPaper>

              <AddButton
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowModal(true)}
              >
                Thêm
              </AddButton>
            </Box>
          </Box>
        </Box>
      </Row>

      {errorMessage && (
        <Row className="mb-3">
          <Col>
            <div className="alert alert-danger alert-dismissible fade show">
              {errorMessage}
              <button
                type="button"
                className="btn-close"
                onClick={() => setErrorMessage("")}
              />
            </div>
          </Col>
        </Row>
      )}

      <Row>
        <Col>
          <div className="card border-0 shadow-sm">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="text-center" style={{ width: "5%" }}>
                        STT
                      </th>
                      <th style={{ width: "25%" }}>Họ và tên</th>
                      <th style={{ width: "30%" }}>Email</th>
                      <th className="text-center" style={{ width: "15%" }}>
                        Vai trò
                      </th>
                      <th className="text-center" style={{ width: "15%" }}>
                        Tình trạng
                      </th>
                      <th className="text-center" style={{ width: "15%" }}>
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAccounts.length > 0 ? (
                      filteredAccounts.map((account, index) => (
                        <tr key={account?._id}>
                          <td className="text-center">{index + 1}</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="avatar-sm bg-light rounded-circle me-2 d-flex align-items-center justify-content-center">
                                <span className="text-dark">
                                  {account?.fullName}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="text-muted">{account?.email}</span>
                          </td>
                          <td className="text-center">
                            <Badge
                              bg={
                                account?.role === "admin"
                                  ? "danger"
                                  : account?.role === "assessor"
                                  ? "warning"
                                  : "primary"
                              }
                              className="px-3 py-2 rounded-pill"
                            >
                              {roleTranslations[account?.role] || account?.role}
                            </Badge>
                          </td>
                          <td className="text-center">
                            <Badge
                              bg={
                                account?.status === "active"
                                  ? "success"
                                  : "secondary"
                              }
                              className="px-3 py-2 rounded-pill"
                            >
                              {account?.status === "active"
                                ? "Đang hoạt động"
                                : "Không hoạt động"}
                            </Badge>
                          </td>
                          <td className="text-center">
                            {JSON.parse(localStorage.getItem("user"))._id !==
                              account._id && (
                              <>
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  className="me-2"
                                  onClick={() => {
                                    setAccountToUpdate(account);
                                    setAccountUpdated({ ...account });
                                    setShowUpdateModal(true);
                                  }}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "32px",
                                    height: "32px",
                                    padding: "0",
                                  }}
                                >
                                  <FiEdit2 />
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => {
                                    setAccountToDelete(account);
                                    setShowDeleteModal(true);
                                  }}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "32px",
                                    height: "32px",
                                    padding: "0",
                                  }}
                                >
                                  <FiTrash2 />
                                </Button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center py-4">
                          <div className="text-muted">
                            {search
                              ? "Không tìm thấy tài khoản phù hợp"
                              : "Không có tài khoản nào"}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Col>
      </Row>

      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        centered
        backdrop="static"
        className="modal-fade-transform"
        size="md"
      >
        <div className="position-relative">
          <Modal.Header
            closeButton
            className="border-0 pb-2 pt-3 px-4"
            style={{
              background: "linear-gradient(135deg,rgb(75, 129, 245))",
            }}
          >
            <Modal.Title className="text-white w-100">
              <div className="d-flex align-items-center">
                <div className="icon-container p-2 rounded-3 me-3 bg-white bg-opacity-25">
                  <FiUserPlus size={22} />
                </div>
                <div>
                  <h5 className="mb-0 fw-bold">Tạo tài khoản mới</h5>
                  <small className="opacity-75">
                    Thêm người dùng vào hệ thống
                  </small>
                </div>
              </div>
            </Modal.Title>
          </Modal.Header>

          <Modal.Body className="py-4 px-4">
            <Form>
              <div className="mb-4">
                <Form.Label className="fw-semibold text-dark mb-2 small">
                  HỌ VÀ TÊN
                </Form.Label>
                <div className="input-group input-group-merge shadow-sm rounded-3 overflow-hidden">
                  <span className="input-group-text bg-light border-0">
                    <FiUser className="text-blue-600" />
                  </span>
                  <Form.Control
                    type="text"
                    placeholder="Nhập họ và tên đầy đủ"
                    value={newAccount.fullName}
                    onChange={(e) =>
                      setNewAccount({ ...newAccount, fullName: e.target.value })
                    }
                    className="py-2 border-0"
                  />
                </div>
              </div>

              <div className="mb-4">
                <Form.Label className="fw-semibold text-dark mb-2 small">
                  MẬT KHẨU
                </Form.Label>
                <div className="input-group input-group-merge shadow-sm rounded-3 overflow-hidden">
                  <span className="input-group-text bg-light border-0">
                    <FiLock className="text-blue-600" />
                  </span>
                  <Form.Control
                    type="password"
                    placeholder="Nhập mật khẩu (tối thiểu 8 ký tự)"
                    value={newAccount.password}
                    onChange={(e) =>
                      setNewAccount({ ...newAccount, password: e.target.value })
                    }
                    className="py-2 border-0"
                  />
                </div>
                <div className="mt-2">
                  <small className="text-muted d-flex align-items-center">
                    <FiInfo size={14} className="me-1" />
                    Mật khẩu phải có ít nhất 8 ký tự
                  </small>
                </div>
              </div>

              <div className="mb-4">
                <Form.Label className="fw-semibold text-dark mb-2 small">
                  EMAIL
                </Form.Label>
                <div className="input-group input-group-merge shadow-sm rounded-3 overflow-hidden">
                  <span className="input-group-text bg-light border-0">
                    <FiMail className="text-blue-600" />
                  </span>
                  <Form.Control
                    type="email"
                    placeholder="Nhập email hợp lệ"
                    value={newAccount.email}
                    onChange={(e) =>
                      setNewAccount({ ...newAccount, email: e.target.value })
                    }
                    className="py-2 border-0"
                  />
                </div>
              </div>

              <div>
                <Form.Label className="fw-semibold text-dark mb-2 small">
                  VAI TRÒ
                </Form.Label>
                <div className="input-group input-group-merge shadow-sm rounded-3 overflow-hidden">
                  <span className="input-group-text bg-light border-0">
                    <FiShield className="text-blue-600" />
                  </span>
                  <Form.Control
                    type="text"
                    value={roleTranslations[type] || type}
                    readOnly
                    disabled
                    className="py-2 bg-light border-0"
                  />
                </div>
              </div>
            </Form>
          </Modal.Body>

          <Modal.Footer className="border-0 px-4 pb-4 pt-2">
            <div className="d-flex gap-3 w-100">
              <Button
                variant="light"
                onClick={() => setShowModal(false)}
                className="flex-grow-1 py-2 rounded-3 fw-medium"
                style={{
                  color: "#64748b",
                  border: "1px solid #e2e8f0",
                }}
              >
                Hủy bỏ
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateAccount}
                className="flex-grow-1 py-2 rounded-3 fw-medium shadow-sm d-flex align-items-center justify-content-center"
                style={{
                  background: "linear-gradient(135deg, #2563eb, #1e40af)",
                  border: "none",
                }}
              >
                <FiUserPlus size={18} className="me-2" />
                Tạo tài khoản
              </Button>
            </div>
          </Modal.Footer>
        </div>
      </Modal>

      <Modal
        show={showUpdateModal}
        onHide={() => setShowUpdateModal(false)}
        centered
        backdrop="static"
        className="modal-fade-transform"
        size="md"
      >
        <div className="position-relative">
          <Modal.Header
            closeButton
            className="border-0 pb-2 pt-3 px-4"
            style={{
              background: "linear-gradient(135deg, #0284c7, #0369a1)",
            }}
          >
            <Modal.Title className="text-white w-100">
              <div className="d-flex align-items-center">
                <div className="icon-container p-2 rounded-3 me-3 bg-white bg-opacity-25">
                  <FiEdit2 size={22} />
                </div>
                <div>
                  <h5 className="mb-0 fw-bold">Cập nhật tài khoản</h5>
                  <small className="opacity-75">
                    Chỉnh sửa thông tin người dùng
                  </small>
                </div>
              </div>
            </Modal.Title>
          </Modal.Header>

          <Modal.Body className="py-4 px-4">
            <Form>
              <div className="mb-4">
                <Form.Label className="fw-semibold text-dark mb-2 small">
                  HỌ VÀ TÊN
                </Form.Label>
                <div className="input-group input-group-merge shadow-sm rounded-3 overflow-hidden">
                  <span className="input-group-text bg-light border-0">
                    <FiUser className="text-sky-600" />
                  </span>
                  <Form.Control
                    type="text"
                    placeholder="Nhập họ và tên đầy đủ"
                    value={accountUpdated.fullName}
                    onChange={(e) =>
                      setAccountUpdated({
                        ...accountUpdated,
                        fullName: e.target.value,
                      })
                    }
                    className="py-2 border-0"
                  />
                </div>
              </div>

              <div className="mb-4">
                <Form.Label className="fw-semibold text-dark mb-2 small">
                  EMAIL
                </Form.Label>
                <div className="input-group input-group-merge shadow-sm rounded-3 overflow-hidden">
                  <span className="input-group-text bg-light border-0">
                    <FiMail className="text-sky-600" />
                  </span>
                  <Form.Control
                    type="email"
                    placeholder="Nhập email"
                    value={accountUpdated.email}
                    onChange={(e) =>
                      setAccountUpdated({
                        ...accountUpdated,
                        email: e.target.value,
                      })
                    }
                    className="py-2 border-0"
                  />
                </div>
              </div>

              <div className="mb-4">
                <Form.Label className="fw-semibold text-dark mb-2 small">
                  VAI TRÒ
                </Form.Label>
                <div className="input-group input-group-merge shadow-sm rounded-3 overflow-hidden">
                  <span className="input-group-text bg-light border-0">
                    <FiShield className="text-sky-600" />
                  </span>
                  <Form.Select
                    value={accountUpdated.role}
                    onChange={(e) =>
                      setAccountUpdated({
                        ...accountUpdated,
                        role: e.target.value,
                      })
                    }
                    className="py-2 border-0"
                  >
                    <option value="user">Người dùng</option>
                    <option value="admin">Quản trị viên</option>
                    <option value="assessor">Đánh giá viên</option>
                  </Form.Select>
                </div>
              </div>

              <div>
                <Form.Label className="fw-semibold text-dark mb-2 small">
                  TÌNH TRẠNG
                </Form.Label>
                <div className="d-flex bg-light rounded-3 p-2 shadow-sm">
                  <div
                    className={`status-option flex-grow-1 py-2 rounded-3 d-flex align-items-center justify-content-center fw-medium ${
                      accountUpdated.status === "active"
                        ? "bg-white shadow-sm text-sky-600"
                        : "text-secondary"
                    }`}
                    onClick={() =>
                      setAccountUpdated({ ...accountUpdated, status: "active" })
                    }
                    style={{ cursor: "pointer", transition: "all 0.2s" }}
                  >
                    <div
                      className="bg-success rounded-circle me-2"
                      style={{ width: "8px", height: "8px" }}
                    ></div>
                    Hoạt động
                  </div>
                  <div
                    className={`status-option flex-grow-1 py-2 rounded-3 d-flex align-items-center justify-content-center fw-medium ${
                      accountUpdated.status === "inactive"
                        ? "bg-white shadow-sm text-sky-600"
                        : "text-secondary"
                    }`}
                    onClick={() =>
                      setAccountUpdated({
                        ...accountUpdated,
                        status: "inactive",
                      })
                    }
                    style={{ cursor: "pointer", transition: "all 0.2s" }}
                  >
                    <div
                      className="bg-secondary rounded-circle me-2"
                      style={{ width: "8px", height: "8px" }}
                    ></div>
                    Không hoạt động
                  </div>
                </div>
              </div>
            </Form>
          </Modal.Body>

          <Modal.Footer className="border-0 px-4 pb-4 pt-2">
            <div className="d-flex gap-3 w-100">
              <Button
                variant="light"
                onClick={() => setShowUpdateModal(false)}
                className="flex-grow-1 py-2 rounded-3 fw-medium"
                style={{
                  color: "#64748b",
                  border: "1px solid #e2e8f0",
                }}
              >
                Hủy bỏ
              </Button>
              <Button
                variant="info"
                onClick={handleUpdateAccount}
                className="flex-grow-1 py-2 rounded-3 fw-medium shadow-sm text-white d-flex align-items-center justify-content-center"
                style={{
                  background: "linear-gradient(135deg, #0284c7, #0369a1)",
                  border: "none",
                }}
              >
                <FiSave size={18} className="me-2" />
                Lưu thay đổi
              </Button>
            </div>
          </Modal.Footer>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        centered
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="text-danger">
            <FiAlertTriangle className="me-2" size={24} />
            Xác nhận xóa tài khoản
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="alert alert-danger bg-soft-danger border-0">
            <div className="d-flex">
              <FiAlertCircle className="me-2 mt-1 flex-shrink-0" size={20} />
              <div>
                <h5 className="alert-heading mb-2">
                  Bạn có chắc chắn muốn xóa?
                </h5>
                <p className="mb-2">
                  Tài khoản{" "}
                  <strong className="text-dark">
                    {accountToDelete?.fullName}
                  </strong>{" "}
                  sẽ bị xóa vĩnh viễn.
                </p>
                <p className="mb-0 small text-muted">
                  Hành động này không thể hoàn tác. Tất cả dữ liệu liên quan sẽ
                  bị mất.
                </p>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button
            variant="outline-secondary"
            onClick={() => setShowDeleteModal(false)}
            className="px-4 rounded-pill"
          >
            Quay lại
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteAccount}
            className="px-4 rounded-pill shadow-sm"
          >
            <FiTrash2 className="me-1" />
            Xác nhận xóa
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ManageAccount;
