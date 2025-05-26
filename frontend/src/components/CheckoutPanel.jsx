import React, { useState, useEffect, useMemo } from "react";
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
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  IconButton,
  Chip,
} from "@mui/material";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

const CheckoutPanel = ({ ticketCounts, types, onCheckout, onClear }) => {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [mealCounts, setMealCounts] = useState({});
  const [meals, setMeals] = useState([]);
  const [selectedMealId, setSelectedMealId] = useState("");
  const [customMealQty, setCustomMealQty] = useState(1);

  const [selectedMethods, setSelectedMethods] = useState([]);
  const [amounts, setAmounts] = useState({ visa: 0, cash: 0, vodafone_cash: 0, postponed: 0, discount: 0 });

  const getAmount = (method) => amounts[method] || 0;
  const setAmount = (method, value) =>
    setAmounts((prev) => ({ ...prev, [method]: Number(value) }));

  useEffect(() => {
    fetch("http://localhost:3000/api/meals?archived=false")
      .then((res) => res.json())
      .then((data) => setMeals(data))
      .catch((err) => console.error("Failed to fetch meals:", err));
  }, []);

  const selected = types.filter((t) => Number(ticketCounts[t.id] || 0) > 0);
  const ticketTotal = selected.reduce(
    (sum, t) => sum + Number(ticketCounts[t.id]) * Number(t.price),
    0
  );
  const mealTotal = meals.reduce(
    (sum, m) => sum + (mealCounts[m.id] || 0) * m.price,
    0
  );
  const grossTotal = ticketTotal + mealTotal;
const discountAmount = getAmount("discount");
const finalTotal = grossTotal - discountAmount;

  const hasItems = selected.length > 0 || Object.values(mealCounts).some(qty => qty > 0);

  const enteredTotal = useMemo(() => {
  return selectedMethods
    .filter(method => method !== "discount")
    .reduce((sum, method) => sum + getAmount(method), 0);
}, [selectedMethods, amounts]);

  const remaining = finalTotal - enteredTotal;

  useEffect(() => {
    if (selectedMethods.length === 1 && selectedMethods[0] !== "discount") {
      setAmounts((prev) => ({
        ...prev,
        [selectedMethods[0]]: finalTotal
      }));
    }
  }, [selectedMethods, finalTotal]);

  useEffect(() => {
    Object.keys(amounts).forEach(method => {
      if (!selectedMethods.includes(method)) {
        setAmount(method, 0);
      }
    });

    if (selectedMethods.length > 1) {
      selectedMethods.forEach(method => {
        if (method !== "discount") {
          setAmount(method, 0);
        }
      });
    }
  }, [selectedMethods]);

  const handleAddMeal = () => {
    if (!selectedMealId || customMealQty <= 0) return;
    setMealCounts((prev) => ({
      ...prev,
      [selectedMealId]: (prev[selectedMealId] || 0) + Number(customMealQty)
    }));
    setCustomMealQty(1);
    setSelectedMealId("");
  };

  const handleRemoveMeal = (mealId) => {
    setMealCounts((prev) => {
      const updated = { ...prev };
      delete updated[mealId];
      return updated;
    });
  };

  const handleConfirm = async () => {
    const user_id = parseInt(localStorage.getItem("userId"), 10);
    if (!user_id || isNaN(user_id)) {
      alert("Missing or invalid user ID.");
      return;
    }

    const payments = selectedMethods.map((method) => ({
      method,
      amount: parseFloat((amounts[method] || 0).toFixed(2))
    })).filter((p) => p.amount !== 0);

    const tickets = selected.map((t) => ({
      ticket_type_id: parseInt(t.id, 10),
      quantity: parseInt(ticketCounts[t.id], 10)
    }));

    const mealsPayload = Object.entries(mealCounts).map(([meal_id, quantity]) => {
      const meal = meals.find((m) => m.id === parseInt(meal_id));
      return {
        meal_id: parseInt(meal_id),
        quantity,
        price_at_order: meal?.price || 0
      };
    });

    const payload = {
      user_id,
      description: description.trim(),
      tickets,
      payments,
      meals: mealsPayload
    };

    try {
      const response = await fetch("http://localhost:3000/api/tickets/sell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        alert("Checkout failed: " + (errData?.message || response.statusText));
        return;
      }

      onCheckout();
      setOpen(false);
      setDescription("");
      setSelectedMethods([]);
      setAmounts({ visa: 0, cash: 0, vodafone_cash: 0, postponed: 0, discount: 0 });
      setMealCounts({});
    } catch (error) {
      alert("Network error. Please try again.");
    }
  };

  return (
    <>
      <Box mt={4} p={3} border="1px solid #00AEEF" borderRadius={2} bgcolor="#E0F7FF">
        <Typography variant="h6">🧾 Order Summary</Typography>

        {selected.length > 0 &&
          selected.map((t) => (
            <Typography key={t.id}>
              {t.category} - {t.subcategory} × {ticketCounts[t.id]} = EGP{" "}
              {(ticketCounts[t.id] * t.price).toFixed(2)}
            </Typography>
          ))}

        <Box mt={2}>
          <FormControl fullWidth>
            <InputLabel>Select Meal</InputLabel>
            <Select
              value={selectedMealId}
              label="Select Meal"
              onChange={(e) => setSelectedMealId(e.target.value)}
            >
              {meals.map((m) => (
                <MenuItem key={m.id} value={m.id}>
                  {m.name} — EGP {m.price}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box display="flex" alignItems="center" mt={1} gap={2}>
            <TextField
              type="number"
              label="Quantity"
              inputProps={{ min: 1 }}
              value={customMealQty}
              onChange={(e) => setCustomMealQty(e.target.value)}
            />
            <Button variant="outlined" onClick={handleAddMeal}>
              Add Meal
            </Button>
          </Box>

          <Box mt={2}>
            {Object.entries(mealCounts).map(([id, qty]) => {
              const meal = meals.find((m) => m.id === parseInt(id));
              return (
                <Box key={id} display="flex" alignItems="center" justifyContent="space-between">
                  <Typography>
                    {meal?.name} × {qty} = EGP {(meal?.price * qty).toFixed(2)}
                  </Typography>
                  <IconButton onClick={() => handleRemoveMeal(id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </Box>
              );
            })}
          </Box>
        </Box>

        {!hasItems && (
          <Typography sx={{ color: "gray", mt: 2 }}>
            No tickets or meals selected yet.
          </Typography>
        )}

        <Divider sx={{ my: 2 }} />
        <Typography variant="h6">{"Final Total: EGP = " }<strong>{finalTotal.toFixed(2)}</strong></Typography>

        <Box mt={2} display="flex" gap={2}>
          <Button
            variant="contained"
            fullWidth
            onClick={() => setOpen(true)}
            disabled={!hasItems}
          >
            Checkout
          </Button>
          <Button variant="outlined" fullWidth color="error" onClick={onClear}>
            Clear
          </Button>
        </Box>
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md">
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
          />

          <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: "bold" }}>
            💳 Select Payment Method(s)
          </Typography>

          <ToggleButtonGroup
            value={selectedMethods}
            onChange={(_, newMethods) => setSelectedMethods(newMethods)}
            aria-label="payment methods"
          >
            {["visa", "cash", "vodafone_cash", "postponed"].map((method) => (
              <ToggleButton key={method} value={method} aria-label={method}>
                {method === "postponed" ? "POSTPONED" : method.replace("_", " ").toUpperCase()}
              </ToggleButton>
            ))}
            <ToggleButton value="discount" aria-label="discount" sx={{ color: "green" }}>
              DISCOUNT
            </ToggleButton>
          </ToggleButtonGroup>

          <Box display="flex" flexWrap="wrap" gap={2} mt={2}>
            {selectedMethods.map((method) => (
              <TextField
                key={method}
                label={method.replace("_", " ").toUpperCase()}
                type="number"
                inputProps={{ step: "any", min: 0 }}
                value={getAmount(method)}
                onChange={(e) => setAmount(method, e.target.value)}
                sx={{ minWidth: "180px", flex: 1, ...(method === "discount" && { color: "green" }) }}
              />
            ))}
          </Box>

          <Typography
            sx={{
              mt: 2,
              fontWeight: "bold",
              color: Math.abs(remaining) < 0.01 ? "green" : "red"
            }}
          >
            {Math.abs(remaining) < 0.01 ?
              "✅ Payment Complete" :
              `Remaining: EGP ${remaining.toFixed(2)}`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            onClick={handleConfirm}
            variant="contained"
            disabled={!hasItems || Math.abs(remaining) > 0.01}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CheckoutPanel;
