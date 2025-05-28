import React, { useState, useEffect, useMemo } from "react";
import {
  Box, Typography, Button, Divider, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Select, InputLabel, FormControl, IconButton
} from "@mui/material";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import config from '../config';

const CheckoutPanel = ({ ticketCounts, types, onCheckout, onClear, mode = "new", ticketIds = [], ticketDetails = [] }) => {
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
  
  // Flag to check if postponed payment is selected
  const postponed = selectedMethods.includes('postponed');

  useEffect(() => {
    fetch(`${config.apiBaseUrl}/api/meals?archived=false`)
      .then((res) => res.json())
      .then((data) => setMeals(data))
      .catch((err) => console.error("Failed to fetch meals:", err));
  }, []);

  // Create selected tickets based on mode
  const selected = useMemo(() => {
    try {
      if (mode === "existing" && Array.isArray(ticketIds) && ticketIds.length > 0) {
        // For existing tickets, create a representation for each ticket 
        return ticketIds.map(id => {
          const matchingDetail = Array.isArray(ticketDetails) 
            ? ticketDetails.find(td => td.id === id) || {}
            : {};
            
          return {
            id,
            category: matchingDetail.category || "Ticket",
            subcategory: matchingDetail.subcategory || `ID: ${id}`,
            price: matchingDetail.price || 0
          };
        });
      } else if (Array.isArray(types)) {
        // For new tickets, filter types with counts
        return types.filter(t => t && t.id && Number(ticketCounts[t.id] || 0) > 0);
      }
      
      return [];
    } catch (error) {
      console.error("Error in selected calculation:", error);
      return [];
    }
  }, [mode, ticketIds, ticketDetails, types, ticketCounts]);

  // Calculate ticket total
  const ticketTotal = useMemo(() => {
    try {
      if (mode === "existing" && Array.isArray(selected)) {
        return selected.reduce((sum, t) => sum + Number(t?.price || 0), 0);
      } else if (Array.isArray(selected)) {
        return selected.reduce((sum, t) => {
          const count = Number(ticketCounts[t?.id] || 0);
          const price = Number(t?.price || 0);
          return sum + (count * price);
        }, 0);
      }
      return 0;
    } catch (error) {
      console.error("Error calculating ticket total:", error);
      return 0;
    }
  }, [mode, selected, ticketCounts]);
  
  // Calculate meal total
  const mealTotal = useMemo(() => {
    try {
      return Array.isArray(meals) ? meals.reduce(
        (sum, m) => sum + (mealCounts[m.id] || 0) * (m.price || 0),
        0
      ) : 0;
    } catch (error) {
      console.error("Error calculating meal total:", error);
      return 0;
    }
  }, [meals, mealCounts]);
  
  const grossTotal = ticketTotal + mealTotal;
  const discountAmount = getAmount("discount");
  const finalTotal = grossTotal - discountAmount;

  const hasItems = useMemo(() => {
    return (Array.isArray(selected) && selected.length > 0) || 
      Object.values(mealCounts).some(qty => qty > 0);
  }, [selected, mealCounts]);

  // Calculate remaining amount
  const enteredTotal = useMemo(() => {
    try {
      return selectedMethods
        .filter(method => method !== "discount")
        .reduce((sum, method) => sum + getAmount(method), 0);
    } catch (error) {
      console.error("Error calculating entered total:", error);
      return 0;
    }
  }, [selectedMethods, amounts]);
  
  const remaining = finalTotal - enteredTotal;

  // Set full amount if exactly one method is selected
  useEffect(() => {
    if (!postponed && selectedMethods.length === 1 && selectedMethods[0] !== "discount") {
      setAmounts((prev) => ({
        ...prev,
        [selectedMethods[0]]: finalTotal
      }));
    }
  }, [selectedMethods, finalTotal, postponed]);

  // Clear amounts for methods not selected
  useEffect(() => {
    try {
      Object.keys(amounts).forEach(method => {
        if (!selectedMethods.includes(method)) {
          setAmount(method, 0);
        }
      });

      // Reset amounts when multiple payment methods are selected
      if (selectedMethods.length > 1) {
        selectedMethods.forEach(method => {
          if (method !== "discount") {
            setAmount(method, 0);
          }
        });
      }
    } catch (error) {
      console.error("Error handling payment methods:", error);
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

  const handleSubmit = () => {
    setOpen(true);
  };

  const handleConfirm = async () => {
    try {
      const user_id = parseInt(localStorage.getItem("userId"), 10);
      if (!user_id || isNaN(user_id)) {
        alert("Missing or invalid user ID.");
        return;
      }

      const payments = selectedMethods
        .map((method) => ({
          method,
          amount: parseFloat((amounts[method] || 0).toFixed(2))
        }))
        .filter((p) => p.amount !== 0);

      // Create payload based on mode
      let payload;
      
      if (mode === "existing") {
        // For existing tickets (AccountantScan)
        payload = {
          ticket_ids: Array.isArray(ticketIds) ? ticketIds : [],
          user_id,
          description: description.trim(),
          payments
        };
      } else {
        // For new tickets (CashierSellingPanel)
        payload = {
          user_id,
          description: description.trim(),
          tickets: selected.map((t) => ({
            ticket_type_id: parseInt(t.id, 10),
            quantity: parseInt(ticketCounts[t.id], 10)
          })),
          payments
        };
      }

      // Add meals if present
      if (Object.keys(mealCounts).length > 0) {
        payload.meals = Object.entries(mealCounts).map(([meal_id, quantity]) => {
          const meal = meals.find((m) => m.id === parseInt(meal_id));
          return {
            meal_id: parseInt(meal_id),
            quantity,
            price_at_order: meal?.price || 0
          };
        });
      }

      // Use different endpoints based on mode
      const endpoint = mode === "existing" 
        ? `${config.apiBaseUrl}/api/tickets/checkout-existing`
        : `${config.apiBaseUrl}/api/tickets/sell`;
      
      const method = mode === "existing" ? "PUT" : "POST";
      
      const response = await fetch(endpoint, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        alert("Checkout failed: " + (errData?.message || response.statusText));
        return;
      }

      const responseData = await response.json();
      
      onCheckout({...payload, order_id: responseData.order_id});
      setOpen(false);
      setDescription("");
      setSelectedMethods([]);
      setAmounts({ visa: 0, cash: 0, vodafone_cash: 0, postponed: 0, discount: 0 });
      setMealCounts({});
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Network error. Please try again.");
    }
  };

  return (
    <>
      <Box mt={4} p={3} border="1px solid #00AEEF" borderRadius={2} bgcolor="#E0F7FF">
        <Typography variant="h6">🧾 Order Summary</Typography>

        {Array.isArray(selected) && selected.length > 0 &&
          selected.map((t) => (
            <Typography key={t?.id || Math.random()}>
              {t?.category || 'Unknown'} - {t?.subcategory || 'Unknown'} × {
                mode === "existing" 
                  ? 1                  : (ticketCounts[t?.id] || 0)
              } = EGP{" "}
              {(
                mode === "existing" 
                  ? (t?.price || 0) 
                  : (ticketCounts[t?.id] || 0) * (t?.price || 0)
              ).toFixed(2)}
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
                    {meal?.name} × {qty} = EGP {((meal?.price || 0) * qty).toFixed(2)}
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
            onClick={handleSubmit}
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
            disabled={!hasItems || (!postponed && Math.abs(remaining) > 0.01)}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CheckoutPanel;
