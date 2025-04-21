import React from "react";
import AccountantSidebar from "../components/AccountantSidebar";
import AccountantTopBar from "../components/TopBar";
import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";

const AccountantDashboard = () => {
  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden", backgroundColor: "#F0F9FF" }}>
      {/* Sidebar */}
      <AccountantSidebar />

      {/* Main Area */}
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", width: "100%" }}>
        <AccountantTopBar title="Accountant Dashboard" />

        <Box sx={{ flex: 1, overflowY: "auto", px: 3, py: 2 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default AccountantDashboard;