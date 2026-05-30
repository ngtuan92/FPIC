import axios from "axios";
import { REACT_APP_URL_SERVER, REACT_APP_URL_BE } from "../config";
import api from "../api";
class AccountContext {
  async Authentication() {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return { message: "Chưa đăng nhập", status: 401 };
      }

      const response = await axios.get(`${REACT_APP_URL_BE}/authentication`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      if (
        error.response &&
        (error.response.status === 401 || error.response.status === 403)
      ) {
        localStorage.removeItem("token");

        localStorage.removeItem("user");

        window.location.href = "/login";

        return {
          message: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại",
          status: 401,
        };
      }

      return error;
    }
  }

  async getAllAccounts() {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get(`${REACT_APP_URL_BE}/admin/accounts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error("Error fetching data:", error);

      if (error.response) {
        if (error.response.status === 401) {
          return { message: "Chưa đăng nhập", status: 401 };
        } else if (error.response.status === 403) {
          return {
            message: "Bạn không có quyền truy cập tài nguyên này.",
            status: 403,
          };
        }
      }

      return {
        message: "Có lỗi xảy ra khi lấy danh sách tài khoản.",
        status: 500,
      };
    }
  }

  async createAccount(account) {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        return { message: "Chưa đăng nhập", status: 401 };
      }

      const response = await api.post(
        `${REACT_APP_URL_BE}/admin/create-account`,
        { account },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response;
    } catch (error) {
      if (
        error.response &&
        (error.response.status === 401 || error.response.status === 403)
      ) {
        localStorage.removeItem("token");

        localStorage.removeItem("user");

        window.location.href = "/login";

        return {
          message: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại",
          status: 401,
        };
      }

 
      console.error("Error creating account:", error);
      return error.response || { message: "Có lỗi xảy ra khi tạo tài khoản" };
    }
  }

  async deleteAccount(id) {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return { message: "Chưa đăng nhập", status: 401 };
      }
      const response = await api.delete(
        `${REACT_APP_URL_BE}/admin/delete-account`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: {
            id,
          },
        }
      );

      return response.data;
    } catch (error) {
      if (
        error.response &&
        (error.response.status === 401 || error.response.status === 403)
      ) {
        localStorage.removeItem("token");

        localStorage.removeItem("user");

        window.location.href = "/login";

        return {
          message: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại",
          status: 401,
        };
      }

    
      console.error("Error creating account:", error);
      return error.response || { message: "Có lỗi xảy ra khi tạo tài khoản" };
    }
  }

  async updateAccount(id, accountUpdated) {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        return { message: "Chưa đăng nhập", status: 401 };
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      };

      const response = await api.put(
        `${REACT_APP_URL_BE}/admin/update-account/${id}`,
        accountUpdated,
        config
      );

      return {
        message: "Cập nhật thành công",
        status: response.status,
        data: response.data,
      };
    } catch (error) {
      if (
        error.response &&
        (error.response.status === 401 || error.response.status === 403)
      ) {
        localStorage.removeItem("token");

        localStorage.removeItem("user");

        window.location.href = "/login";

        return {
          message: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại",
          status: 401,
        };
      }

  
      console.error("Error updating account:", error);
      return (
        error.response || { message: "Có lỗi xảy ra khi cập nhật tài khoản" }
      );
    }
  }
  async getCountUser() {
    try {
      const response = await api.get(
        `${REACT_APP_URL_BE}/admin/accounts/count`
      );

      return {
        message: "Cập nhật thành công",
        status: response.status,
        data: response.data,
      };
    } catch (error) {
      if (
        error.response &&
        (error.response.status === 401 || error.response.status === 403)
      ) {
        localStorage.removeItem("token");

        localStorage.removeItem("user");

        window.location.href = "/login";

        return {
          message: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại",
          status: 401,
        };
      }

   
      console.error("Error updating account:", error);
      return error.response || { message: "Có lỗi xảy ra " };
    }
  }
}

// eslint-disable-next-line import/no-anonymous-default-export
export default new AccountContext();
