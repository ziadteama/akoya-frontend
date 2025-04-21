import React from "react";
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import PoolIcon from "@mui/icons-material/Pool";
import { useNavigate } from "react-router-dom";

const TopBar = ({ title = "Cashier Dashboard" }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    navigate("/"); // Redirect to login
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: "#00AEEF", boxShadow: "none" }}>
      <Toolbar sx={{ display: "flex", justifyContent: "space-between", px: 3 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <PoolIcon sx={{ color: "#F0F9FF" }} />
          <Typography variant="h6" sx={{ fontWeight: "bold", color: "#F0F9FF" }}>
            {title}
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          sx={{
            color: "#F0F9FF",
            borderColor: "#F0F9FF",
            "&:hover": {
              backgroundColor: "#00C2CB",
              borderColor: "#F0F9FF"
            }
          }}
        >
          Sign Out
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default TopBar;
