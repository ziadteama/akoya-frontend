import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox
} from "@mui/material";

const CheckoutPanel = ({ ticketCounts, types, onCheckout, onClear, onRemoveCategory }) => {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [visaAmount, setVisaAmount] = useState(0);
  const [cashAmount, setCashAmount] = useState(0);
  const [vodafoneAmount, setVodafoneAmount] = useState(0);
  const [postponed, setPostponed] = useState(false);

  const selected = types.filter((t) => Number(ticketCounts[t.id] || 0) > 0);
  const total = selected.reduce(
    (sum, t) => sum + Number(ticketCounts[t.id]) * Number(t.price),
    0
  );

  const enteredTotal = Number(visaAmount) + Number(cashAmount) + Number(vodafoneAmount);
  const remaining = total - enteredTotal;

  if (selected.length === 0) return null;

  const handleConfirm = async () => {
    const user_id = parseInt(localStorage.getItem("userId"), 10);
    if (!user_id || isNaN(user_id)) {
      alert("Missing or invalid user ID.");
      return;
    }

    const payments = postponed
      ? [{ method: "postponed", amount: parseFloat(total.toFixed(2)) }]
      : [
          { method: "visa", amount: parseFloat(Number(visaAmount).toFixed(2)) },
          { method: "cash", amount: parseFloat(Number(cashAmount).toFixed(2)) },
          { method: "vodafone_cash", amount: parseFloat(Number(vodafoneAmount).toFixed(2)) }
        ].filter(p => p.amount > 0);

    const tickets = selected.map((t) => ({
      ticket_type_id: parseInt(t.id, 10),
      quantity: parseInt(ticketCounts[t.id], 10)
    }));

    const payload = {
      user_id,
      description: description.trim(),
      tickets,
      payments
    };

    console.log("📦 Final payload:", JSON.stringify(payload, null, 2));

    if (payments.length === 0) {
      alert("Please enter at least one payment method or select Postponed.");
      return;
    }

    if (!postponed && Math.abs(remaining) > 0.01) {
      alert("Paid amount doesn't match required total.");
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/api/tickets/sell", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        console.error("Checkout failed:", errData);
        alert("Checkout failed: " + (errData?.message || response.statusText));
        return;
      }

      onCheckout();
      setOpen(false);
      setDescription("");
      setVisaAmount(0);
      setCashAmount(0);
      setVodafoneAmount(0);
      setPostponed(false);
    } catch (error) {
      console.error("Network error during checkout:", error);
      alert("Network error. Please try again.");
    }
  };

  return (
    <>
      <Box mt={4} p={3} sx={{
        border: "1px solid #00AEEF",
        borderRadius: "16px",
        backgroundColor: "#E0F7FF",
        textAlign: "center"
      }}>
        <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: "#007EA7", mb: 2 }}>
          🧾 Order Summary
        </Typography>
        <Box>
          {selected.map((t) => (
            <Typography key={t.id}>
              {t.category} - {t.subcategory} × {ticketCounts[t.id]} = EGP {(ticketCounts[t.id] * t.price).toFixed(2)}
            </Typography>
          ))}
        </Box>
        <Divider sx={{ my: 2 }} />
        <Typography variant="h6">Total: EGP {total.toFixed(2)}</Typography>
        <Button variant="contained" sx={{ mt: 2 }} onClick={() => setOpen(true)}>Checkout</Button>
        <Button variant="outlined" sx={{ mt: 1, ml: 2 }} color="error" onClick={onClear}>Clear</Button>
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Confirm Checkout</DialogTitle>
        <DialogContent>
          <TextField
            label="Add Description"
            fullWidth
            margin="normal"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            minRows={3}
            sx={{ mb: 3 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={postponed}
                onChange={(e) => setPostponed(e.target.checked)}
              />
            }
            label="Postponed Payment"
          />
          {!postponed && (
            <>
              <Box display="flex" gap={2} mt={2} justifyContent="space-between">
                <TextField
                  label="Visa"
                  type="number"
                  inputProps={{ step: 'any', min: 0 }}
                  value={visaAmount}
                  onChange={(e) => setVisaAmount(e.target.value)}
                  fullWidth
                  variant="outlined"
                />
                <TextField
                  label="Cash"
                  type="number"
                  inputProps={{ step: 'any', min: 0 }}
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  fullWidth
                  variant="outlined"
                />
                <TextField
                  label="Vodafone"
                  type="number"
                  inputProps={{ step: 'any', min: 0 }}
                  value={vodafoneAmount}
                  onChange={(e) => setVodafoneAmount(e.target.value)}
                  fullWidth
                  variant="outlined"
                />
              </Box>
              <Typography sx={{ mt: 2 }} color={Math.abs(remaining) < 0.01 ? "green" : "red"}>
                Remaining: EGP {remaining.toFixed(2)}
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleConfirm} 
            variant="contained" 
            disabled={!postponed && Math.abs(remaining) > 0.01}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CheckoutPanel;
