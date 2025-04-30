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
  IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

const CheckoutPanel = ({
  ticketCounts,
  types,
  onCheckout,
  onClear,
  onRemoveCategory,
}) => {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");

  const selected = types.filter((t) => Number(ticketCounts[t.id] || 0) > 0);
  const total = selected.reduce(
    (sum, t) => sum + Number(ticketCounts[t.id]) * Number(t.price),
    0
  );

  if (selected.length === 0) return null;

  const handleConfirm = () => {
    onCheckout(description); // Pass to parent
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
          {[...new Set(selected.map((t) => t.category))].map((category) => {
            const catItems = selected.filter((t) => t.category === category);
            if (catItems.length === 0) return null;

            return (
              <Box key={category} mb={2}>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={1}
                  px={1}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, color: "#007EA7" }}
                  >
                    {category}
                  </Typography>
                  {onRemoveCategory && (
                    <IconButton
                      size="small"
                      onClick={() => onRemoveCategory(category)}
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
                {catItems.map((t) => (
                  <Typography
                    key={t.id}
                    sx={{ fontSize: 14, textAlign: "left", ml: 2 }}
                  >
                    {ticketCounts[t.id]} × {t.name} (
                    {t.subcategory || "Unknown"}) = $
                    {Number(ticketCounts[t.id]) * Number(t.price)}
                  </Typography>
                ))}
              </Box>
            );
          })}
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

      {/* Dialog for confirmation & description input */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: {
            maxWidth: "500px",
            width: "100%",
            overflowX: "hidden",
            borderRadius: 3,
            boxShadow: 4,
          },
        }}
      >
        <DialogTitle>Confirm Checkout</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Add Description:
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={2}
            label="Order Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Details about the order"
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
