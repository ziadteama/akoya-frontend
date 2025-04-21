import React from "react";
import {
  Box,
  Typography,
  Button,
  Divider
} from "@mui/material";

const CheckoutPanel = ({ ticketCounts, types, onCheckout }) => {
  const selected = types.filter((t) => Number(ticketCounts[t.id] || 0) > 0);
  const total = selected.reduce((sum, t) => sum + Number(ticketCounts[t.id]) * Number(t.price), 0);

  if (selected.length === 0) return null;

  return (
    <Box mt={4} p={2} sx={{ border: "1px solid #00AEEF", borderRadius: "12px", backgroundColor: "#E0F7FF" }}>
      <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: "#007EA7", mb: 1 }}>
        Order Summary
      </Typography>

      {selected.map((t) => (
        <Typography key={t.id} sx={{ fontSize: 14 }}>
          {ticketCounts[t.id]} × {t.name} = ${Number(ticketCounts[t.id]) * Number(t.price)}
        </Typography>
      ))}

      <Divider sx={{ my: 1 }} />

      <Typography variant="h6" sx={{ color: "#007EA7", fontWeight: 600 }}>
        Total: ${total}
      </Typography>

      <Box mt={2}>
        <Button
          variant="contained"
          onClick={onCheckout}
          sx={{ backgroundColor: "#00AEEF", "&:hover": { backgroundColor: "#00C2CB" } }}
        >
          Checkout
        </Button>
      </Box>
    </Box>
  );
};

export default CheckoutPanel;