import * as React from "react";
import "./Header.css";
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Col, Container, Row, Image } from "react-bootstrap";
import AccountContext from "../http/AccountContext";
import { useNavigate } from "react-router-dom";
import { REACT_APP_URL_SERVER, REACT_APP_URL_BE } from "../config";




const Header = ({ onToggleMenu }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const [account, setAccount] = useState({});

  const navigate = useNavigate();
  const handleClick = (event) => {
    event.stopPropagation();
    setIsOpen((prev) => !prev);
  };
  const handleLogout = () => {
    localStorage.removeItem("token");

    navigate("/");
    window.location.reload();
  };
  function navigateTo() {
    window.location.href = "/auth/login";
  }
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await AccountContext.Authentication();

        setAccount(data.account);
      } catch (error) {}
    };

    fetchData(); // Gọi hàm async

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  return (
    <Container fluid className="account-menu bg-dark">
      <Row className="d-flex align-items-center mt-1 ">
        <Col md={10} className="d-flex justify-content-end mt-2">
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
            }}
          >
            {account?.lastName && account?.firstName ? (
              <div>
                <button
                  onClick={handleClick}
                  className="avatar-button pb-1 m-0"
                  aria-controls={isOpen ? "account-menu" : undefined}
                  aria-haspopup="true"
                  aria-expanded={isOpen ? "true" : undefined}
                >
                  <div className="avatar">
                    {account?.firstName?.charAt(0).toUpperCase()}
                  </div>
                </button>
                <div className="text-center text-white">
                  <span className="m-0">
                    {account?.lastName + " " + account?.firstName}
                  </span>
                </div>
                {isOpen && (
                  <div id="account-menu" className="menu" ref={menuRef}>
                    <div className="menu-item">
                      <div className="menu-item-avatar" />
                      <Link to="/my-account" className="lik">
                        Profile
                      </Link>
                    </div>

                    <div className="menu-item">
                      <div className="menu-icon">🚪</div>
                      <Link to="/" className="lik" onClick={handleLogout}>
                        Logout
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button class="full-rounded" onClick={navigateTo}>
                <span>Đăng Nhập</span>
                <div class="border full-rounded"></div>
              </button>
            )}
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Header;
