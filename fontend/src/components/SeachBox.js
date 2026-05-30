import {
  Box,
  CardMedia,
  CircularProgress,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  TextField,
  Typography,
  useTheme,
  styled,
  Button,
  alpha,
} from "@mui/material";
import React, { useContext } from "react";
import {
  Search as SearchIcon,
  Close as CloseIcon,
  Add as AddIcon,
  ImageNotSupported as ImageNotSupportedIcon,
  Memory,
} from "@mui/icons-material";
import { REACT_APP_URL_BE } from "../config";
import { hasPermission } from "../helper/function";
import { AuthContext } from "../context/AuthContext";

// Styled components for better customization
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

export default function SearchBox({
  handleSearchSubmit,
  handleSearchChange,
  searchTerm,
  setShowSuggestions,
  clearSearch,
  showSuggestions,
  searchSuggestions,
  handleSelectSuggestion,
  isBase64,
  isSearching,
  setShowModal,
}) {
  const theme = useTheme();
  const { user } = useContext(AuthContext);

  return (
    <>
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
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Memory sx={{ fontSize: 40, mr: 2 }} />
            <Typography variant="h6" component="h1" sx={{ fontWeight: 700 }}>
              Quản lý Vi mạch
            </Typography>
          </Box>
        </Box>
      </Paper>
      <Box
        sx={{ width: "100%", maxWidth: 1500, mx: "auto", position: "relative" }}
      >
        <Box
          sx={{
            display: "flex",
            gap: 2,
            alignItems: "center",
            justifyContent: "start",
          }}
        >
          <StyledPaper
            elevation={1}
            component="form"
            onSubmit={handleSearchSubmit}
            sx={{ flex: 1, justifyContent: "start" }}
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
                {searchSuggestions.map((accessory) => (
                  <MenuItem
                    key={accessory._id}
                    onClick={() => handleSelectSuggestion(accessory)}
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
                      {accessory.image ? (
                        <CardMedia
                          component="img"
                          image={`${REACT_APP_URL_BE}${
                            accessory.image && isBase64(accessory.image)
                              ? atob(accessory.image)
                              : accessory.image
                          }`}
                          alt={accessory.title}
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
                      ) : (
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            mr: 2,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: theme.palette.grey[100],
                            borderRadius: 1,
                          }}
                        >
                          <ImageNotSupportedIcon
                            sx={{ color: theme.palette.grey[500] }}
                          />
                        </Box>
                      )}
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
                          {accessory.title}
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
                          {accessory.description?.substring(0, 60) ||
                            "Không có mô tả"}
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </SuggestionsPaper>
            )}
          </StyledPaper>
        </Box>
      </Box>
    </>
  );
}
