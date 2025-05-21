import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Divider
} from "@mui/material";

const OrdersTable = ({ data }) => {
  const zebraColors = ["#E4F8FC", "#D1F2F5"];
  const [selectedOrder, setSelectedOrder] = useState(null);

  if (!data || data.length === 0) {
    return (
      <Typography align="center" sx={{ mt: 4 }}>
        No Orders Available
      </Typography>
    );
  }

  const renderDetailView = () => (
    <Dialog open={!!selectedOrder} onClose={() => setSelectedOrder(null)} maxWidth="md" fullWidth>
      <DialogTitle>Order #{selectedOrder?.order_id}</DialogTitle>
      <DialogContent>
        <Typography><b>User:</b> {selectedOrder.user_name}</Typography>
        <Typography><b>Created At:</b> {new Date(selectedOrder.created_at).toLocaleString()}</Typography>
        <Typography><b>Total:</b> ${parseFloat(selectedOrder.total_amount).toFixed(2)}</Typography>
        <Typography sx={{ mt: 2 }}><b>Description:</b> {selectedOrder.description || '-'}</Typography>

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6">Tickets</Typography>
        {selectedOrder.tickets?.length ? (
          <Box component="ul" sx={{ pl: 3 }}>
            {Object.entries(selectedOrder.tickets.reduce((acc, t) => {
              if (!acc[t.category]) acc[t.category] = [];
              acc[t.category].push(t);
              return acc;
            }, {})).map(([category, subs], idx) => (
              <Box key={idx} sx={{ mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#007EA7' }}>{category}</Typography>
                <Box component="ul" sx={{ pl: 3 }}>
                  {subs.map((sub, i) => (
                    <li key={i}>{sub.quantity}x {sub.subcategory} @ {sub.sold_price} EGP</li>
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        ) : <Typography>No Tickets</Typography>}

        <Typography variant="h6" sx={{ mt: 2 }}>Meals</Typography>
        {selectedOrder.meals?.length ? (
          <Box component="ul" sx={{ pl: 3 }}>
            {selectedOrder.meals.map((m, i) => (
              <li key={i}>{m.quantity}x {m.name} @ {m.price_at_order} EGP</li>
            ))}
          </Box>
        ) : <Typography>No Meals</Typography>}

        <Typography variant="h6" sx={{ mt: 2 }}>Payments</Typography>
        {selectedOrder.payments?.length ? (
          <Box component="ul" sx={{ pl: 3 }}>
            {selectedOrder.payments.map((p, i) => (
              <li key={i}>{p.amount} EGP via {p.method}</li>
            ))}
          </Box>
        ) : <Typography>No Payment Info</Typography>}
      </DialogContent>
      <DialogActions sx={{ displayPrint: 'none' }}>
  <Box sx={{ flexGrow: 1 }} />
  <Button onClick={() => window.print()} sx={{ backgroundColor: '#00AEEF', color: '#fff', '&:hover': { backgroundColor: '#00C2CB' } }}>
    Print
  </Button>
  <Button onClick={() => setSelectedOrder(null)}>Close</Button>
</DialogActions>
    </Dialog>
  );

  return (
    <>
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
                <TableRow
                  key={order.order_id}
                  sx={{ backgroundColor: bgColor, cursor: 'pointer' }}
                  onClick={() => setSelectedOrder(order)}
                >
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
      {selectedOrder && renderDetailView()}
    </>
  );
};

export default OrdersTable;
