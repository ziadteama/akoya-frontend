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
  LunchDining
} from "@mui/icons-material";
import { Link, useLocation } from "react-router-dom";

const AccountantSidebar = () => {
  const location = useLocation();

  const menuItems = [
    { text: "Day Reports", icon: <Event />, path: "/accountant/accountant-reports" },
    { text: "Scan Tickets", icon: <QrCodeScanner />, path: "/accountant/accountant-scan" },
    { text: "Manage Categories", icon: <Category />, path: "/accountant/accountant-categories" },
    { text: "Manage Meals", icon: <LunchDining />, path: "/accountant/accountant-meals" },
    { text: "Generate Tickets", icon: <Download />, path: "/accountant/accountant-generate" },
  ];

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
