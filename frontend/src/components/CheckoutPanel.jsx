import React from "react";
import {
  Box,
  Typography,
  Button,
  Divider,
  Stack
} from "@mui/material";

const CheckoutPanel = ({ ticketCounts, types, onCheckout, onClear }) => {
  const selected = types.filter((t) => Number(ticketCounts[t.id] || 0) > 0);
  const total = selected.reduce((sum, t) => sum + Number(ticketCounts[t.id]) * Number(t.price), 0);

  if (selected.length === 0) return null;

  return (
    <Box
      mt={4}
      p={3}
      sx={{
        border: "1px solid #00AEEF",
        borderRadius: "12px",
        backgroundColor: "#E0F7FF",
        textAlign: "center",
      }}
    >
      <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: "#007EA7", mb: 2 }}>
        🧾 Order Summary
      </Typography>

      <Box>
        {selected.map((t) => (
          <Typography key={t.id} sx={{ fontSize: 14 }}>
            {ticketCounts[t.id]} × {t.name} - {t.subcategory || 'Unknown'} ({t.category}) = ${Number(ticketCounts[t.id]) * Number(t.price)}
          </Typography>
        ))}
      </Box>

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" sx={{ color: "#007EA7", fontWeight: 600 }}>
        Total: ${total}
      </Typography>

      <Stack direction="row" justifyContent="center" spacing={2} mt={2}>
        <Button
          variant="contained"
          onClick={onCheckout}
          sx={{ backgroundColor: "#00AEEF", "&:hover": { backgroundColor: "#00C2CB" } }}
        >
          Checkout
        </Button>

        <Button
          variant="outlined"
          onClick={onClear}
          sx={{ borderColor: "#00AEEF", color: "#00AEEF" }}
        >
          Clear
        </Button>
      </Stack>
    </Box>
  );
};

export default CheckoutPanel;
