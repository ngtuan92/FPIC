import { useState } from "react";
import {
  Dialog,
  Button,
  Typography,
  Box,
  Stack,
  IconButton,
  alpha,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CloseIcon from "@mui/icons-material/Close";

export default function DeleteConfirmationDialog({
  setOpenConfirmDelete,
  handleDeleteAccessory,
  openConfirmDelete,
}) {
  return (
    <>
      <Dialog
        open={openConfirmDelete}
        onClose={() => setOpenConfirmDelete(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: "hidden",
            width: 380,
            background: "linear-gradient(145deg, #ffffff 0%, #f9fafb 100%)",
            boxShadow: "0 12px 56px rgba(0, 0, 0, 0.15)",
          },
        }}
      >
        <Box
          sx={{
            position: "relative",
            bgcolor: "#FFF5F5",
            pt: 5,
            pb: 3,
            borderBottom: "1px solid",
            borderColor: alpha("#FF3D3D", 0.1),
          }}
        >
          <IconButton
            aria-label="close"
            onClick={() => setOpenConfirmDelete(false)}
            sx={{
              position: "absolute",
              right: 12,
              top: 12,
              color: "text.secondary",
            }}
            size="small"
          >
            <CloseIcon fontSize="small" />
          </IconButton>

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Box
              sx={{
                width: 70,
                height: 70,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: alpha("#FF3D3D", 0.1),
                mb: 3,
              }}
            >
              <WarningAmberIcon sx={{ fontSize: 34, color: "#FF3D3D" }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: "#FF3D3D" }}>
              Xác nhận xoá
            </Typography>
          </Box>
        </Box>

        <Box sx={{ p: 4 }}>
          <Typography
            variant="body1"
            align="center"
            sx={{
              mb: 4,
              color: "text.primary",
              lineHeight: 1.6,
            }}
          >
            Bạn có chắc chắn muốn xoá không?
            <br />
            <Typography
              component="span"
              variant="body2"
              sx={{
                color: "text.secondary",
                fontWeight: 500,
                display: "block",
                mt: 1,
              }}
            >
              Hành động này không thể hoàn tác.
            </Typography>
          </Typography>

          <Stack direction="row" spacing={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => setOpenConfirmDelete(false)}
              sx={{
                py: 1.2,
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                color: "text.primary",
                borderColor: "#E0E0E0",
                "&:hover": {
                  borderColor: "#BDBDBD",
                  backgroundColor: "#F5F5F5",
                },
              }}
            >
              Huỷ
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={() => {
                handleDeleteAccessory();
                setOpenConfirmDelete(false);
              }}
              startIcon={<DeleteOutlineIcon />}
              sx={{
                py: 1.2,
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                background: "linear-gradient(45deg, #FF3D3D 0%, #FF7070 100%)",
                boxShadow: "0 4px 12px rgba(255, 61, 61, 0.3)",
                "&:hover": {
                  background:
                    "linear-gradient(45deg, #E53535 0%, #FF5050 100%)",
                  boxShadow: "0 6px 16px rgba(255, 61, 61, 0.4)",
                },
              }}
            >
              Xoá
            </Button>
          </Stack>
        </Box>
      </Dialog>
    </>
  );
}
