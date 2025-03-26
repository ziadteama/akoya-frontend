import React from "react";
import AccountantSidebar from "../components/AccountantSidebar";
import AccountantTopBar from "../components/TopBar"; // ✅ Now using a separate top bar
import { Outlet } from "react-router-dom";

const AccountantDashboard = () => {
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Sidebar (Fixed) */}
      <AccountantSidebar />

      {/* Main Content Area */}
      <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", width: "100%" }}>
        {/* Top Bar */}
        <AccountantTopBar title="Accountant Dashboard" />

        {/* Page Content (Prevents Overlap) */}
        <div style={{  marginTop: "64px", overflowY: "auto" }}>
          <Outlet /> {/* ✅ This is where nested routes will render */}
        </div>
      </div>
    </div>
  );
};

export default AccountantDashboard;
