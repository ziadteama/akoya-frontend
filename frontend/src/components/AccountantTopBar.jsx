import React from "react";
import { AppBar, Toolbar, Typography, Button } from "@mui/material";
import { Logout } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const AccountantTopBar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    navigate("/"); // Redirect to login page
  };

  return (
    <AppBar
      position="fixed"
      sx={{ 
        width: "calc(100% - 250px)", 
        left: "250px", 
        boxShadow: "none", 
        margin: 0, 
        backgroundColor: "#1976d2" // ✅ MUI default blue color
      }}
    >
      <Toolbar sx={{ display: "flex", justifyContent: "space-between", paddingX: "20px" }}>
        {/* ✅ Add "Accountant Dashboard" text */}
        <Typography variant="h6" sx={{ fontWeight: "bold", color: "white" }}>
          Accountant Dashboard
        </Typography>

        {/* Logout Button */}
        <Button color="inherit" startIcon={<Logout />} onClick={handleLogout}>
          Sign Out
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default AccountantTopBar;
