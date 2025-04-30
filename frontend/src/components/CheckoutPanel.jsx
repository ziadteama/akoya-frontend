import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Divider,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";

const CheckoutPanel = ({ ticketCounts, types, onCheckout, onClear }) => {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");

  const selected = types.filter((t) => Number(ticketCounts[t.id] || 0) > 0);
  const total = selected.reduce(
    (sum, t) => sum + Number(ticketCounts[t.id]) * Number(t.price),
    0
  );

  if (selected.length === 0) return null;

  const handleConfirm = () => {
    onCheckout(description); // Pass description to parent
    setOpen(false);
    setDescription("");
  };

  return (
    <>
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
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: "bold", color: "#007EA7", mb: 2 }}
        >
          🧾 Order Summary
        </Typography>

        <Box>
          {selected.map((t) => (
            <Typography key={t.id} sx={{ fontSize: 14 }}>
              {ticketCounts[t.id]} × {t.name} - {t.subcategory || "Unknown"} (
              {t.category}) = ${Number(ticketCounts[t.id]) * Number(t.price)}
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
            onClick={() => setOpen(true)}
            sx={{
              backgroundColor: "#00AEEF",
              "&:hover": { backgroundColor: "#00C2CB" },
            }}
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

      {/* Review & Confirm Dialog */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: {
            maxWidth: "500px",
            width: "100%",
            overflowX: "hidden", // 👈 key fix
          },
        }}
      >
        <DialogTitle>Confirm Checkout</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Add Notes.
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={2}
            label="Order Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. School group visit, 5 children and 2 adults"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleConfirm}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CheckoutPanel;
