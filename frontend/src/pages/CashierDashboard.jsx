import React, { useState, useEffect } from "react";
import { 
  Box, 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton,
  Menu,
  MenuItem
} from "@mui/material";
import { 
  AccountCircle, 
  ExitToApp,
  Person
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import CashierSellingPanel from "../components/CashierSellingPanel";
import { notify } from '../utils/toast';

const CashierDashboard = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    // Get user name from localStorage
    const storedName = localStorage.getItem("userName") || "Cashier";
    setUserName(storedName);
  }, []);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");
    notify.success("Logged out successfully");
    navigate("/");
    handleMenuClose();
  };

  return (
    <Box sx={{ 
      width: "100vw", 
      height: "100vh", 
      backgroundColor: "#f8f9fa",
      display: "flex",
      flexDirection: "column"
    }}>
      {/* Top Bar */}
      <AppBar 
        position="static" 
        sx={{ 
          backgroundColor: "#00AEEF",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between" }}>
          {/* Left side - Title */}
          <Typography variant="h6" sx={{ fontWeight: "bold", color: "white" }}>
            🏊‍♂️ Akoya Water Park - Cashier
          </Typography>

          {/* Right side - User menu */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography variant="body1" sx={{ color: "white" }}>
              Welcome, {userName}
            </Typography>
            
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenuOpen}
              color="inherit"
            >
              <AccountCircle />
            </IconButton>
            
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={handleMenuClose}>
                <Person sx={{ mr: 1 }} />
                Profile
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <ExitToApp sx={{ mr: 1 }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content - Selling Panel */}
      <Box sx={{ 
        flex: 1,
        overflow: "auto"
      }}>
        <CashierSellingPanel />
      </Box>
    </Box>
  );
};

export default CashierDashboard;
