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
            {["Order ID", "User", "Created At", "Tickets", "Meals", "Total"].map((header) => (
              <TableCell
                key={header}
                align="center"
                sx={{ fontWeight: "bold", color: "#fff", backgroundColor: "#00AEEF", fontSize: "1.1rem" }}
              >
                {header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((order) => (
            <TableRow key={order.order_id}>
              <TableCell align="center">{order.order_id}</TableCell>
              <TableCell align="center">{order.user_name}</TableCell>
              <TableCell align="center">{new Date(order.created_at).toLocaleString()}</TableCell>
              <TableCell align="center">
                {order.tickets && order.tickets.length > 0
                  ? order.tickets.map(t => `${t.subcategory}-${t.category} (${t.sold_price} EGP)`).join(", ")
                  : "-"}
              </TableCell>
              <TableCell align="center">
                {order.meals && order.meals.length > 0
                  ? order.meals.map(m => `${m.quantity}x ${m.name} (${m.price_at_order} EGP)`).join(", ")
                  : "-"}
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold", color: "#00A651" }}>
                ${parseFloat(order.total_amount).toFixed(2)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default OrdersTable;
