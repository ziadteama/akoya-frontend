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
  FormControlLabel,
  Checkbox,
  MenuItem,
  Select,
  InputLabel,
  FormControl
} from "@mui/material";

const CheckoutPanel = ({ ticketCounts, types, onCheckout, onClear }) => {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [postponed, setPostponed] = useState(false);
  const [mealCounts, setMealCounts] = useState({});
  const [meals, setMeals] = useState([]);
  const [selectedMealId, setSelectedMealId] = useState("");
  const [customMealQty, setCustomMealQty] = useState(1);

  const [selectedMethods, setSelectedMethods] = useState([]);
  const [amounts, setAmounts] = useState({ visa: 0, cash: 0, vodafone_cash: 0 });
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
  const finalTotal = ticketTotal + mealTotal;

  // Auto-fill logic for 1 method (optional safety)
  useEffect(() => {
    if (!postponed && selectedMethods.length === 1) {
      setAmounts((prev) => ({
        ...prev,
        [selectedMethods[0]]: finalTotal
      }));
    }
  }, [postponed, selectedMethods, finalTotal]);

  // Compute entered amount safely
  const enteredTotal = useMemo(() => {
    if (postponed) return finalTotal;
    if (selectedMethods.length === 1) return finalTotal;
    return selectedMethods.reduce((sum, method) => sum + getAmount(method), 0);
  }, [postponed, selectedMethods, finalTotal, amounts]);

  const remaining = finalTotal - enteredTotal;

  const handleAddMeal = () => {
    if (!selectedMealId || customMealQty <= 0) return;
    setMealCounts((prev) => ({
      ...prev,
      [selectedMealId]: (prev[selectedMealId] || 0) + Number(customMealQty)
    }));
    setCustomMealQty(1);
    setSelectedMealId("");
  };

  if (selected.length === 0) return null;

  const handleConfirm = async () => {
    const user_id = parseInt(localStorage.getItem("userId"), 10);
    if (!user_id || isNaN(user_id)) {
      alert("Missing or invalid user ID.");
      return;
    }

    let paymentData;

    if (postponed) {
      paymentData = [{ method: "postponed", amount: parseFloat(finalTotal.toFixed(2)) }];
    } else if (selectedMethods.length === 1) {
      paymentData = [{
        method: selectedMethods[0],
        amount: parseFloat(finalTotal.toFixed(2))
      }];
    } else {
      paymentData = selectedMethods.map((method) => ({
        method,
        amount: parseFloat((amounts[method] || 0).toFixed(2))
      })).filter((p) => p.amount > 0);
    }

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
      payments: paymentData,
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
      setAmounts({ visa: 0, cash: 0, vodafone_cash: 0 });
      setPostponed(false);
      setMealCounts({});
    } catch (error) {
      alert("Network error. Please try again.");
    }
  };

  return (
    <>
      <Box mt={4} p={3} border="1px solid #00AEEF" borderRadius={2} bgcolor="#E0F7FF">
        <Typography variant="h6">🧾 Order Summary</Typography>
        {selected.map((t) => (
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
                <Typography key={id}>
                  {meal?.name} × {qty} = EGP {(meal?.price * qty).toFixed(2)}
                </Typography>
              );
            })}
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />
        <Typography variant="h6">Final Total: EGP {finalTotal.toFixed(2)}</Typography>
        <Button variant="contained" sx={{ mt: 2 }} onClick={() => setOpen(true)}>
          Checkout
        </Button>
        <Button variant="outlined" sx={{ mt: 1, ml: 2 }} color="error" onClick={onClear}>
          Clear
        </Button>
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
              <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: "bold" }}>
                💳 Select Payment Methods
              </Typography>

              {["visa", "cash", "vodafone_cash"].map((method) => (
                <FormControlLabel
                  key={method}
                  control={
                    <Checkbox
                      checked={selectedMethods.includes(method)}
                      onChange={(e) => {
                        const updated = e.target.checked
                          ? [...selectedMethods, method]
                          : selectedMethods.filter((m) => m !== method);
                        setSelectedMethods(updated);
                      }}
                    />
                  }
                  label={method.replace("_", " ").toUpperCase()}
                />
              ))}

              {selectedMethods.length === 1 ? (
                <TextField
                  label={selectedMethods[0].replace("_", " ").toUpperCase()}
                  type="number"
                  value={finalTotal.toFixed(2)}
                  disabled
                  fullWidth
                  sx={{ mt: 2 }}
                />
              ) : (
                <Box display="flex" gap={2} mt={2}>
                  {selectedMethods.map((method) => (
                    <TextField
                      key={method}
                      label={method.replace("_", " ").toUpperCase()}
                      type="number"
                      inputProps={{ step: "any", min: 0 }}
                      value={getAmount(method)}
                      onChange={(e) => setAmount(method, e.target.value)}
                      fullWidth
                    />
                  ))}
                </Box>
              )}

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
