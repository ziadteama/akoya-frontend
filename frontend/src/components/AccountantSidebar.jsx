import React from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Event,
  QrCodeScanner,
  Category,
  Download,
  LunchDining,
  PointOfSale,
  PersonAdd
} from "@mui/icons-material";
import { Link, useLocation } from "react-router-dom";

const AccountantSidebar = ({ excludeRoutes = [], includeRoutes = [], basePath = "/accountant" }) => {
  const location = useLocation();

  // Core accountant menu items
  const allMenuItems = [
    { text: "Reports", icon: <Event />, path: `${basePath}/accountant-reports`, id: "reports" },
    { text: "Scan Tickets", icon: <QrCodeScanner />, path: `${basePath}/accountant-scan`, id: "scan" },
    { text: "Manage Categories", icon: <Category />, path: `${basePath}/accountant-categories`, id: "categories" },
    { text: "Manage Meals", icon: <LunchDining />, path: `${basePath}/accountant-meals`, id: "meals" },
    { text: "Sell Tickets", icon: <PointOfSale />, path: `${basePath}/sell-tickets`, id: "sell" }, // Added selling panel
    { text: "Register User", icon: <PersonAdd />, path: `${basePath}/register-user`, id: "register" },
  ];

  // Extra menu items that can be used in other dashboards
  const additionalRoutes = [
    { text: "Sales History", icon: <Download />, path: `/cashier/history`, id: "history" },
  ];

  // Start with base menu items
  let menuItems = [...allMenuItems];

  // Exclude specific items
  console.log("Excluding routes:", excludeRoutes);
  if (excludeRoutes && excludeRoutes.length > 0) {
    menuItems = menuItems.filter(item => !excludeRoutes.includes(item.id));
    console.log("After exclusion:", menuItems.map(item => item.id));
  }

  // Include additional routes
  if (includeRoutes && includeRoutes.length > 0) {
    const includedItems = additionalRoutes.filter(item => includeRoutes.includes(item.id));
    menuItems = [...menuItems, ...includedItems];
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: "250px",
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: "250px",
          background: "#F0F9FF",
          color: "#007EA7",
          boxSizing: "border-box",
        },
      }}
    >
      <List>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <ListItem
              button
              key={item.text}
              component={Link}
              to={item.path}
              sx={{
                color: isActive ? "#fff" : "#007EA7",
                backgroundColor: isActive ? "#00AEEF" : "transparent",
                fontWeight: isActive ? "bold" : "normal",
                "&:hover": {
                  backgroundColor: "#00C2CB",
                  color: "#fff",
                },
              }}
            >
              <ListItemIcon sx={{ color: isActive ? "#fff" : "#007EA7" }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          );
        })}
      </List>
    </Drawer>
  );
};

export default AccountantSidebar;
