import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from "@mui/material";

const OrdersTable = ({ data }) => {
  const zebraColors = ["#E4F8FC", "#D1F2F5"];

  if (!data || data.length === 0) {
    return (
      <Typography align="center" sx={{ mt: 4 }}>
        No Orders Available
      </Typography>
    );
  }

  return (
    <TableContainer>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            {["Order ID", "User", "Time", "Tickets", "Meals", "Description", "Total"].map((header) => (
              <TableCell
                key={header}
                align="center"
                sx={{ fontWeight: "bold", color: "#fff", backgroundColor: "#00AEEF", fontSize: "1.2rem" }}
              >
                {header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((order, index) => {
            const bgColor = zebraColors[index % 2];
            return (
              <TableRow key={order.order_id} sx={{ backgroundColor: bgColor }}>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: "bold",
                    fontSize: "1.1rem",
                    backgroundColor: "#00C2CB",
                    color: "#fff",
                    borderRight: "1px solid #ccc",
                  }}
                >
                  {order.order_id}
                </TableCell>
                <TableCell align="center">{order.user_name}</TableCell>
                <TableCell align="center">{new Date(order.created_at).toLocaleTimeString()}</TableCell>
                <TableCell align="center">{order.tickets?.reduce((sum, t) => sum + (t.quantity || 1), 0) || 0}</TableCell>
                <TableCell align="center">{order.meals?.reduce((sum, m) => sum + m.quantity, 0) || 0}</TableCell>
                <TableCell align="center" sx={{ whiteSpace: "pre-wrap", wordWrap: "break-word", maxWidth: 300 }}>
                  {order.description || "-"}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold", color: "#00A651" }}>
                  ${parseFloat(order.total_amount).toFixed(2)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default OrdersTable;
