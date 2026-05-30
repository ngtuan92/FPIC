import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  styled,
  Paper,
  IconButton,
  Tooltip as MuiTooltip,
  Fade,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  People,
  Memory,
  DeveloperBoard,
  Schema,
  AccountTree,
  Refresh,
  ViewList,
} from "@mui/icons-material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import axios from "axios";
import { REACT_APP_URL_BE } from "../config";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import html2pdf from 'html2pdf.js';

// Danh mục và màu Pie cố định
const PCB_TYPES = [
  "Router",
  "PC",
  "USB",
  "Access Point",
  "Switch",
  "Server",
  "FPGA",
];
const PCB_COLORS = {
  Router: "#1E88E5",
  PC: "#00A86B",
  USB: "#FFB300",
  "Access Point": "#FB8C00",
  Switch: "#7E57C2",
  Server: "#26A69A",
  FPGA: "#F4C20D",
};

const WEAK_COLORS = [
  "#7E57C2",
  "#00A86B",
  "#F4C20D",
  "#1E88E5",
  "#FB8C00",
  "#FF6B6B",
  "#8D6E63",
  "#29B6F6",
];

// 5 card thống kê
const STAT_CARDS = [
  {
    title: "Tổng số người dùng",
    icon: People,
    color: "#1E88E5",
    key: "users",
    linkTo: "/admin/manager-account/admin",
  },
  {
    title: "Tổng số mẫu linh kiện",
    icon: Memory,
    color: "#00A86B",
    key: "accessories",
    linkTo: "/page/1",
  },
  {
    title: "Tổng số mẫu bản mạch",
    icon: DeveloperBoard,
    color: "#FFB300",
    key: "microchips",
    linkTo: "/microchip",
  },
  {
    title: "Tổng số mẫu điểm yếu",
    icon: Schema,
    color: "#FB8C00",
    key: "weakPoints",
    linkTo: "/weak-point",
  },
  {
    title: "Tổng số mẫu sơ đồ khối",
    icon: AccountTree,
    color: "#7E57C2",
    key: "blockDiagrams",
    linkTo: "/block-diagram",
  },
];

const WEAK_POINT_TYPES = [
  "SMB",
  "JTAG",
  "Test Pin",
  "SPI",
  "LPC",
  "Unused ports",
  "Vias",
  "Footprint",
];

// Card với border rõ nét và height cao hơn
const AnimatedCard = styled(Card)(({ theme }) => ({
  height: "100%",
  minHeight: "240px",
  display: "flex",
  flexDirection: "column",
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  border: "1px solid rgba(0,0,0,0.12)",
  transition:
    "transform .25s ease, box-shadow .25s ease, border-color .25s ease",
  "&:hover": {
    transform: "translateY(-6px)",
    boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
    borderColor: theme.palette.primary.light,
  },
}));

// Label % cho Pie
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}) => {
  const RAD = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.6;
  const x = cx + r * Math.cos(-midAngle * RAD);
  const y = cy + r * Math.sin(-midAngle * RAD);
  return percent > 0.03 ? (
    <text
      x={x}
      y={y}
      fill="#fff"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize={11}
      fontWeight="bold"
      style={{ textShadow: "0 0 3px rgba(0,0,0,0.5)" }}
    >
      {(percent * 100).toFixed(0)}%
    </text>
  ) : null;
};

const AdminDashboard = () => {
  const theme = useTheme();

  const [stats, setStats] = useState({
    users: 0,
    accessories: 0,
    microchips: 0,
    weakPoints: 0,
    blockDiagrams: 0,
  });

  const [componentTypes, setComponentTypes] = useState([]);
  const [weakPointData, setWeakPointData] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const [chartError, setChartError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [refreshing, setRefreshing] = useState(false);

  const barContainerRef = useRef(null);

  // Fetch stats
  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${REACT_APP_URL_BE}/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!mounted) return;
        const d = res.data || {};
        setStats({
          users: d.accounts ?? 0,
          accessories: d.accessories ?? 0,
          microchips: d.microchips ?? 0,
          weakPoints: d.weakPoints ?? 0,
          blockDiagrams: d.soDoKhois ?? 0,
        });
      } catch (e) {
        mounted &&
          setSnackbar({
            open: true,
            message:
              e.response?.data?.message || "Không thể tải dữ liệu thống kê",
            severity: "error",
          });
      } finally {
        mounted && setIsLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [refreshing]);

  // Fetch charts
  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setChartLoading(true);
      try {
        const token = localStorage.getItem("token");
        const microRes = await axios.get(
          `${REACT_APP_URL_BE}/microchips/dashboard-data`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const weakRes = await axios.get(
          `${REACT_APP_URL_BE}/weakpoint/dashboard-data`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!mounted) return;

        const apiData = microRes.data?.data || [];
        const map = new Map(apiData.map((d) => [d.name, Number(d.value) || 0]));
        const fullPie = PCB_TYPES.map((name) => ({
          name,
          value: map.get(name) ?? 0,
        }));
        const total = fullPie.reduce((s, it) => s + it.value, 0);
        setComponentTypes(fullPie.map((it) => ({ ...it, total })));

        setWeakPointData(weakRes.data?.data || []);
        setChartError(null);
      } catch (e) {
        const fallback = [
          { name: "Router", value: 25 },
          { name: "PC", value: 21 },
          { name: "USB", value: 16 },
          { name: "Access Point", value: 14 },
          { name: "Switch", value: 7 },
          { name: "Server", value: 11 },
          { name: "FPGA", value: 6 },
        ];
        const total = fallback.reduce((s, it) => s + it.value, 0);
        setComponentTypes(fallback.map((it) => ({ ...it, total })));
        setChartError(null);
      } finally {
        mounted && setChartLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [refreshing]);

  const handleRefresh = () => {
    setSnackbar({
      open: true,
      message: "Đang cập nhật dữ liệu...",
      severity: "info",
    });
    setRefreshing((v) => !v);
  };

  const handleCloseSnackbar = () => setSnackbar((s) => ({ ...s, open: false }));

  const exportExcel = async () => {
    try {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("Phân bố điểm yếu");

      // Tiêu đề báo cáo
      ws.mergeCells("A1:I1");
      const titleCell = ws.getCell("A1");
      titleCell.value = "BÁO CÁO THỐNG KÊ PHÂN BỐ MẪU ĐIỂM YẾU";
      titleCell.font = { size: 16, bold: true };
      titleCell.alignment = { vertical: "middle", horizontal: "center" };
      ws.getRow(1).height = 35;

      // Thêm ngày xuất báo cáo
      ws.mergeCells("A2:I2");
      const dateCell = ws.getCell("A2");
      dateCell.value = `Ngày xuất báo cáo: ${new Date().toLocaleDateString("vi-VN")}`;
      dateCell.font = { size: 11, italic: true };
      dateCell.alignment = { horizontal: "center" };
      ws.getRow(2).height = 25;

      // Header của bảng
      const headerRow = ws.getRow(4);
      const headers = ["Thiết bị", ...WEAK_POINT_TYPES];
      headers.forEach((text, i) => {
        const cell = headerRow.getCell(i + 1);
        cell.value = text;
        cell.font = { bold: true, size: 11 };
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" }
        };
      });
      headerRow.height = 30;

      // Dữ liệu
      weakPointData.forEach((row, index) => {
        const dataRow = ws.getRow(index + 5);
        const values = [row.name, ...WEAK_POINT_TYPES.map(k => Number(row[k] || 0))];

        values.forEach((value, colIndex) => {
          const cell = dataRow.getCell(colIndex + 1);
          cell.value = value;
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" }
          };

          // Căn giữa cho số, căn trái cho tên thiết bị
          if (colIndex === 0) {
            cell.alignment = { vertical: "middle", horizontal: "left" };
          } else {
            cell.alignment = { vertical: "middle", horizontal: "center" };
          }
        });

        dataRow.height = 25;
      });

      // Tổng số liệu
      const totalRow = ws.getRow(weakPointData.length + 5);
      const totals = ["TỔNG", ...WEAK_POINT_TYPES.map(type =>
        weakPointData.reduce((sum, row) => sum + Number(row[type] || 0), 0)
      )];

      totals.forEach((value, i) => {
        const cell = totalRow.getCell(i + 1);
        cell.value = value;
        cell.font = { bold: true };
        cell.border = {
          top: { style: "double" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" }
        };
        cell.alignment = { vertical: "middle", horizontal: "center" };
      });
      totalRow.height = 30;

      // Điều chỉnh độ rộng cột
      ws.getColumn(1).width = 35; // Cột tên thiết bị
      for (let i = 2; i <= headers.length; i++) {
        ws.getColumn(i).width = 15;
      }

      // Xuất file
      const buf = await wb.xlsx.writeBuffer();
      saveAs(new Blob([buf]), `bao_cao_phan_bo_diem_yeu_${new Date().toISOString().split('T')[0]}.xlsx`);

    } catch (err) {
      setSnackbar({
        open: true,
        message: "Không thể tạo file Excel",
        severity: "error",
      });
    }
  };

  const exportPDF = () => {
    try {
      // Tạo element tạm thời để render PDF
      const element = document.createElement('div');
      element.innerHTML = `
        <div style="padding: 20px;">
          <h1 style="text-align: center; font-size: 20px; margin-bottom: 10px;">
            BÁO CÁO THỐNG KÊ PHÂN BỐ MẪU ĐIỂM YẾU
          </h1>
          <p style="text-align: center; margin-bottom: 20px;">
            Ngày xuất báo cáo: ${new Date().toLocaleDateString('vi-VN')}
          </p>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr>
                <th style="border: 1px solid #ddd; padding: 8px;">Thiết bị</th>
                ${WEAK_POINT_TYPES.map(type =>
        `<th style="border: 1px solid #ddd; padding: 8px;">${type}</th>`
      ).join('')}
              </tr>
            </thead>
            <tbody>
              ${weakPointData.map(row => `
                <tr>
                  <td style="border: 1px solid #ddd; padding: 8px;">${row.name}</td>
                  ${WEAK_POINT_TYPES.map(type =>
        `<td style="border: 1px solid #ddd; padding: 8px; text-align: center;">
                      ${Number(row[type] || 0)}
                    </td>`
      ).join('')}
                </tr>
              `).join('')}
              <tr style="font-weight: bold;">
                <td style="border: 1px solid #ddd; padding: 8px;">TỔNG</td>
                ${WEAK_POINT_TYPES.map(type =>
        `<td style="border: 1px solid #ddd; padding: 8px; text-align: center;">
                    ${weakPointData.reduce((sum, row) => sum + Number(row[type] || 0), 0)}
                  </td>`
      ).join('')}
              </tr>
            </tbody>
          </table>
        </div>
      `;

      const opt = {
        margin: 1,
        filename: `bao_cao_phan_bo_diem_yeu_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
      };

      html2pdf().from(element).set(opt).save();

    } catch (err) {
      console.error('PDF Error:', err);
      setSnackbar({
        open: true,
        message: "Không thể tạo file PDF: " + err.message,
        severity: "error"
      });
    }
  };

  return (
    <Box
      sx={{
        backgroundColor: alpha(theme.palette.background.default, 0.7),
        minHeight: "100vh",
      }}
    >
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Header */}
        <Paper
          elevation={3}
          sx={{
            p: { xs: 2, sm: 3 },
            mb: 3,
            background: `linear-gradient(135deg, ${theme.palette.primary.main
              }, ${alpha(theme.palette.primary.light, 0.85)})`,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 2,
            borderRadius: 3,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Memory sx={{ fontSize: 36, mr: 1.5 }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Thống kê dữ liệu
            </Typography>
          </Box>
          <MuiTooltip title="Làm mới dữ liệu">
            <IconButton
              color="inherit"
              onClick={handleRefresh}
              sx={{
                bgcolor: alpha("#fff", 0.12),
                "&:hover": {
                  bgcolor: alpha("#fff", 0.2),
                  transform: "rotate(180deg)",
                },
                transition: "all .4s ease",
              }}
            >
              <Refresh />
            </IconButton>
          </MuiTooltip>
        </Paper>

        {/* 6 cards: 5 số liệu + 1 Pie */}
        {isLoading ? (
          <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {/* 5 card số liệu */}
            {STAT_CARDS.map((c) => (
              <Grid item key={c.key} xs={12} sm={6} md={4}>
                <AnimatedCard>
                  <CardContent
                    sx={{
                      p: 3,
                      textAlign: "center",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      height: "100%",
                    }}
                  >
                    <Box>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          mx: "auto",
                          mb: 1.25,
                          borderRadius: 2,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: c.color,
                        }}
                      >
                        <c.icon sx={{ fontSize: 32 }} />
                      </Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1.5 }}
                      >
                        {c.title}
                      </Typography>
                      <Typography
                        variant="h3"
                        sx={{ color: c.color, fontWeight: 700, mb: 2 }}
                      >
                        {Number(stats[c.key] ?? 0).toLocaleString()}
                      </Typography>
                    </Box>
                    <Button
                      href={c.linkTo}
                      variant="contained"
                      sx={{
                        width: "120px",
                        mx: "auto",
                        px: 2.5,
                        py: 0.75,
                        textTransform: "none",
                        fontWeight: 600,
                        bgcolor: c.color,
                        "&:hover": { bgcolor: c.color, opacity: 0.9 },
                      }}
                    >
                      Xem chi tiết
                    </Button>
                  </CardContent>
                </AnimatedCard>
              </Grid>
            ))}

            {/* Card thứ 6: Phân bố mẫu bản mạch với Legend bên phải */}
            <Grid item xs={12} sm={6} md={4}>
              <AnimatedCard>
                <CardContent sx={{ p: 2, height: "100%" }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 0.5,
                      mb: 1,
                    }}
                  >
                    <Schema sx={{ fontSize: 18 }} />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontWeight: 600 }}
                    >
                      Phân bố mẫu bản mạch
                    </Typography>
                  </Box>

                  {chartLoading ? (
                    <Box sx={{ py: 4 }}>
                      <CircularProgress size={36} />
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={componentTypes}
                            cx="40%"
                            cy="50%"
                            outerRadius={65}
                            labelLine={false}
                            label={renderCustomizedLabel}
                            dataKey="value"
                          >
                            {componentTypes.map((e) => (
                              <Cell key={e.name} fill={PCB_COLORS[e.name]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend
                            layout="vertical"
                            align="right"
                            verticalAlign="middle"
                            iconType="square"
                            iconSize={10}
                            wrapperStyle={{
                              paddingLeft: "10px",
                              fontSize: "11px",
                              lineHeight: "16px",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  )}
                </CardContent>
              </AnimatedCard>
            </Grid>
          </Grid>
        )}

        {/* Phân bố mẫu điểm yếu FULL WIDTH */}
        <Box sx={{ mt: 4 }}>
          <Paper
            elevation={1}
            sx={{
              borderRadius: 3,
              overflow: "hidden",
              border: "1px solid rgba(0,0,0,0.12)",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 2.5,
                py: 1.5,
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
              }}
            >
              <Schema sx={{ fontSize: 20 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Phân bố mẫu điểm yếu
              </Typography>
            </Box>

            <Box ref={barContainerRef} sx={{ px: 2.5, pt: 1.5, pb: 2 }}>
              {chartLoading ? (
                <Box sx={{ p: 3, textAlign: "center" }}>
                  <CircularProgress />
                </Box>
              ) : chartError ? (
                <Typography color="error" sx={{ textAlign: "center", py: 5 }}>
                  {chartError}
                </Typography>
              ) : !weakPointData.length ? (
                <Typography sx={{ textAlign: "center", py: 5 }}>
                  Không có dữ liệu
                </Typography>
              ) : (
                <ResponsiveContainer width="100%" height={360}>
                  <BarChart
                    data={weakPointData}
                    margin={{ top: 10, right: 20, left: 0, bottom: 24 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {WEAK_POINT_TYPES.map((k, i) => (
                      <Bar
                        key={k}
                        dataKey={k}
                        fill={WEAK_COLORS[i % WEAK_COLORS.length]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Box>

            <Box sx={{ display: "flex", gap: 2, px: 2.5, pb: 2 }}>
              <Button
                variant="contained"
                color="warning"
                startIcon={<ViewList />}
                onClick={exportPDF}
              >
                Xuất PDF
              </Button>
              <Button variant="contained" color="success" onClick={exportExcel}>
                Xuất Excel
              </Button>
            </Box>
          </Paper>
        </Box>
      </Container>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={handleCloseSnackbar}
        TransitionComponent={Fade}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
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

export default AdminDashboard;
