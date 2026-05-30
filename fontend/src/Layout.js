import * as React from "react";
import { useState, useEffect } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Collapse,
  Button,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Menu as MenuIcon,
  ExpandLess,
  ExpandMore,
  Home,
  Assessment,
  AdminPanelSettings,
  BarChart,
  Logout,
  Login,
} from "@mui/icons-material";
import AccountContext from "./context/AccountContext";
import StorageIcon from "@mui/icons-material/Storage";
import { AuthContext } from "./context/AuthContext";
import { hasPermission } from "./helper/function";
import DeveloperBoard from "@mui/icons-material/DeveloperBoard";

const drawerWidth = 300;

const Layout = ({ children }) => {
  const { user, logout } = React.useContext(AuthContext);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [subMenus, setSubMenus] = useState({
    menu1: false,
    menu2: false,
    menu3: false,
  });

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const navigateTo = () => {
    navigate("/login");
  };

  const toggleSubMenu = (menu) => {
    setSubMenus((prev) => ({
      ...prev,
      [menu]: !prev[menu],
    }));
  };

  useEffect(() => {
    if (
      currentPath.includes("/page/") ||
      currentPath.includes("/microchip") ||
      currentPath.includes("/weak-point") ||
      currentPath.includes("/block-diagram")
    ) {
      setSubMenus((prev) => ({ ...prev, menu1: true }));
    }
    if (currentPath.includes("/admin/manager-account")) {
      setSubMenus((prev) => ({ ...prev, menu3: true }));
    }
  }, [currentPath]);

  const drawer = (
    <Box
      sx={{
        bgcolor: "primary.main",
        color: "white",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header của Drawer */}
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          gap: 2,
          bgcolor: "primary.dark",
        }}
      >
        <Avatar
          sx={{
            width: 48,
            height: 48,
            bgcolor: "white",
            color: "primary.main",
          }}
        >
          <AdminPanelSettings />
        </Avatar>
        <Box sx={{ flexGrow: 1 }}>
          {user?.fullName ? (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 500 }}>
                {user?.fullName}
              </Typography>
              <Button
                startIcon={<Logout />}
                onClick={logout}
                sx={{
                  color: "white",
                  p: 0,
                  mt: 0.5,
                  textTransform: "none",
                  "&:hover": { color: "grey.300" },
                }}
              >
                Đăng xuất
              </Button>
            </Box>
          ) : (
            <Button
              variant="contained"
              color="secondary"
              onClick={navigateTo}
              startIcon={<Login />}
              sx={{ textTransform: "none", fontWeight: 500 }}
            >
              Đăng Nhập
            </Button>
          )}
        </Box>
      </Box>

      <Divider sx={{ bgcolor: "white", opacity: 0.3, my: 1 }} />

      <List sx={{ flexGrow: 1, px: 1 }}>
        {hasPermission(user, "dashboard") && (
          <ListItem disablePadding>
            <ListItemButton
              component={Link}
              to="/dashboard"
              selected={currentPath === "/dashboard"}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                "&.Mui-selected": {
                  bgcolor: "primary.light",
                  color: "white",
                  "&:hover": { bgcolor: "primary.light" },
                },
                "&:hover": { bgcolor: "rgba(255, 255, 255, 0.1)" },
              }}
            >
              <ListItemIcon sx={{ color: "white", minWidth: 40 }}>
                <Home />
              </ListItemIcon>
              <ListItemText
                primary="Trang chủ"
                primaryTypographyProps={{ fontWeight: 500 }}
              />
            </ListItemButton>
          </ListItem>
        )}

        <ListItem disablePadding>
          <ListItemButton
            component={Link}
            to="/identification"
            selected={currentPath === "/identification"}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              "&.Mui-selected": {
                bgcolor: "primary.light",
                color: "white",
                "&:hover": { bgcolor: "primary.light" },
              },
              "&:hover": { bgcolor: "rgba(255, 255, 255, 0.1)" },
            }}
          >
            <ListItemIcon sx={{ color: "white", minWidth: 40 }}>
              <DeveloperBoard />
            </ListItemIcon>
            <ListItemText
              primary="Nhận diện"
              primaryTypographyProps={{ fontWeight: 500 }}
            />
          </ListItemButton>
        </ListItem>

        {/* Xây dựng dữ liệu */}
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => toggleSubMenu("menu1")}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              "&:hover": { bgcolor: "rgba(255, 255, 255, 0.1)" },
            }}
          >
            <ListItemIcon sx={{ color: "white", minWidth: 40 }}>
              <StorageIcon />
            </ListItemIcon>
            <ListItemText
              primary="Xây dựng dữ liệu"
              primaryTypographyProps={{ fontWeight: 500 }}
            />
            {subMenus.menu1 ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={subMenus.menu1} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {[
              { text: "Mẫu linh kiện, chủng loại", path: "/page/1" },
              { text: "Mẫu điểm yếu trên bo mạch", path: "/weak-point" },
              { text: "Mẫu sơ đồ khối", path: "/block-diagram" },
              { text: "Mẫu bản mạch", path: "/microchip" },
            ].map((item) => (
              <ListItemButton
                key={item.path}
                component={Link}
                to={item.path}
                selected={currentPath.includes(item.path)}
                sx={{
                  pl: 6,
                  borderRadius: 1,
                  mb: 0.5,
                  "&.Mui-selected": {
                    bgcolor: "white",
                    color: "primary.main",
                    "&:hover": { bgcolor: "grey.200" },
                  },
                  "&:hover": { bgcolor: "rgba(255, 255, 255, 0.1)" },
                }}
              >
                <ListItemText primary={item.text} />
              </ListItemButton>
            ))}
          </List>
        </Collapse>

        {/* Quản lý đánh giá */}
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => toggleSubMenu("menu2")}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              "&:hover": { bgcolor: "rgba(255, 255, 255, 0.1)" },
            }}
          >
            <ListItemIcon sx={{ color: "white", minWidth: 40 }}>
              <Assessment />
            </ListItemIcon>
            <ListItemText
              primary="Quản lý đánh giá"
              primaryTypographyProps={{ fontWeight: 500 }}
            />
            {subMenus.menu2 ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={subMenus.menu2} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {[
              { text: "Danh mục sản phẩm đã đánh giá", path: "/reviewed-product-catalog" },
            ].map((item) => (
              <ListItemButton
                key={item.text}
                component={Link}
                to={item.path}
                sx={{
                  pl: 6,
                  borderRadius: 1,
                  mb: 0.5,
                  "&:hover": { bgcolor: "rgba(255, 255, 255, 0.1)" },
                }}
              >
                <ListItemText primary={item.text} />
              </ListItemButton>
            ))}
          </List>
        </Collapse>

        {hasPermission(user, "manageUser") && (
          <>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => toggleSubMenu("menu3")}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  "&:hover": { bgcolor: "rgba(255, 255, 255, 0.1)" },
                }}
              >
                <ListItemIcon sx={{ color: "white", minWidth: 40 }}>
                  <AdminPanelSettings />
                </ListItemIcon>
                <ListItemText
                  primary="Quản trị"
                  primaryTypographyProps={{ fontWeight: 500 }}
                />
                {subMenus.menu3 ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
            </ListItem>
            <Collapse in={subMenus.menu3} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {[
                  { text: "Admin", path: "/admin/manager-account/admin" },
                  {
                    text: "Đánh giá viên",
                    path: "/admin/manager-account/assessor",
                  },
                  { text: "Khách hàng", path: "/admin/manager-account/user" },
                ].map((item) => (
                  <ListItemButton
                    key={item.path}
                    component={Link}
                    to={item.path}
                    selected={currentPath.includes(item.path)}
                    sx={{
                      pl: 6,
                      borderRadius: 1,
                      mb: 0.5,
                      "&.Mui-selected": {
                        bgcolor: "white",
                        color: "primary.main",
                        "&:hover": { bgcolor: "grey.200" },
                      },
                      "&:hover": { bgcolor: "rgba(255, 255, 255, 0.1)" },
                    }}
                  >
                    <ListItemText primary={item.text} />
                  </ListItemButton>
                ))}
              </List>
            </Collapse>
          </>
        )}
        {/* Quản trị */}
      </List>

      {/* Footer (optional) */}
      <Box sx={{ p: 2, textAlign: "center", bgcolor: "primary.dark" }}>
        <Typography variant="caption" sx={{ opacity: 0.7 }}>
          © 2025 FPIC
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex" }}>
      {/* AppBar cho mobile */}
      <AppBar
        position="fixed"
        sx={{
          display: { md: "none" },
          bgcolor: "primary.main",
          boxShadow: "none",
          borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            FPIC
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        {/* Drawer mobile */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              bgcolor: "primary.main",
              borderRight: "none",
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Drawer desktop */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              bgcolor: "primary.main",
              borderRight: "none",
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Nội dung chính */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          bgcolor: "grey.70",
          minHeight: "100vh",
          mt: { xs: 7, md: 0 },
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
