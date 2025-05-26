import React from "react";
import { Box } from "@mui/material";
import { Outlet, useLocation } from "react-router-dom";
import TopBar from "../components/TopBar";
import CashierSidebar from "../components/CashierSidebar";
import CashierSellingPanel from "../components/CashierSellingPanel";

const CashierDashboard = () => {
  const location = useLocation();
  const isSellPage = location.pathname === "/cashier";

  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden", backgroundColor: "#F0F9FF" }}>
      <CashierSidebar />

      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <TopBar />
        <Box sx={{ px: 3, py: 2, flex: 1, overflowY: "auto" }}>
          {isSellPage ? <CashierSellingPanel /> : <Outlet />}
        </Box>
      </Box>
    </Box>
  );
};

export default CashierDashboard;
