import React from "react";
import { Drawer, List, ListItem, ListItemIcon, ListItemText } from "@mui/material";
import { Event, QrCodeScanner, Category, Download } from "@mui/icons-material";
import { Link } from "react-router-dom";

const AccountantSidebar = () => {
  const menuItems = [
    { text: "Day Reports", icon: <Event />, path: "/accountant/accountant-reports" },
    { text: "Scan Tickets", icon: <QrCodeScanner />, path: "/accountant/accountant-scan" },
    { text: "Manage Categories", icon: <Category />, path: "/accountant/accountant-categories" },
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
          boxSizing: "border-box",
        },
      }}
    >
      <List>
        {menuItems.map((item) => (
          <ListItem button key={item.text} component={Link} to={item.path} sx={{ color: "inherit", textDecoration: "none" }}>
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default AccountantSidebar;
