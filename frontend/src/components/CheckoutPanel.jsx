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

  // Validate and normalize the inputs to prevent errors
  const normalizedTicketCounts = useMemo(() => {
    if (typeof ticketCounts !== 'object' || ticketCounts === null) {
      console.warn("Invalid ticketCounts provided", ticketCounts);
      return {};
    }
    return ticketCounts;
  }, [ticketCounts]);

  const normalizedTypes = useMemo(() => {
    if (!Array.isArray(types)) {
      console.warn("Invalid types provided", types);
      return [];
    }
    return types;
  }, [types]);

  const normalizedTicketIds = useMemo(() => {
    if (!Array.isArray(ticketIds)) {
      console.warn("Invalid ticketIds provided", ticketIds);
      return [];
    }
    return ticketIds;
  }, [ticketIds]);

  const normalizedTicketDetails = useMemo(() => {
    if (!Array.isArray(ticketDetails)) {
      console.warn("Invalid ticketDetails provided", ticketDetails);
      return [];
    }
    return ticketDetails;
  }, [ticketDetails]);

  // Update the selected tickets calculation to handle both modes properly
  const selected = useMemo(() => {
    try {
      if (mode === "existing" && normalizedTicketIds.length > 0) {
        // For existing tickets, create a representation for each ticket 
        return normalizedTicketIds.map(id => {
          // Find the matching detail for this ticket ID
          const matchingDetail = normalizedTicketDetails.find(td => td && td.id === id) || {};
          
          // Log the exact price from the ticket detail
          console.log(`Processing ticket ${id}, price from API:`, matchingDetail.price);
          
          const price = typeof matchingDetail.price === 'number' ? matchingDetail.price : 0;
          
          return {
            id,
            category: matchingDetail.category || "Ticket",
            subcategory: matchingDetail.subcategory || `ID: ${id}`,
            price
          };
        });
      } else {
        // For new tickets, filter types with counts
        return normalizedTypes.filter(t => 
          t && typeof t === 'object' && t.id && 
          Number(normalizedTicketCounts[t.id] || 0) > 0
        );
      }
    } catch (error) {
      console.error("Error in selected calculation:", error);
      return [];
    }
  }, [mode, normalizedTicketIds, normalizedTicketDetails, normalizedTypes, normalizedTicketCounts]);

  // Make sure the ticketTotal calculation is correct
  const ticketTotal = useMemo(() => {
    try {
      if (mode === "existing" && Array.isArray(selected)) {
        const total = selected.reduce((sum, t) => {
          const price = typeof t.price === 'number' ? t.price : 0;
          return sum + price;
        }, 0);
        return total;
      } else if (Array.isArray(selected)) {
        return selected.reduce((sum, t) => {
          if (!t || typeof t !== 'object') return sum;
          const count = Number(normalizedTicketCounts[t.id] || 0);
          const price = typeof t.price === 'number' ? t.price : 0;
          return sum + (count * price);
        }, 0);
      }
      return 0;
    } catch (error) {
      console.error("Error calculating ticket total:", error);
      return 0;
    }
  }, [mode, selected, normalizedTicketCounts]);
  
  // Calculate meal total
  const mealTotal = useMemo(() => {
    try {
      return Array.isArray(meals) ? meals.reduce(
        (sum, m) => {
          if (!m || typeof m !== 'object') return sum;
          const count = Number(mealCounts[m.id] || 0);
          const price = typeof m.price === 'number' ? m.price : 0;
          return sum + (count * price);
        }, 0
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
      if (!Array.isArray(selectedMethods)) return 0;
      
      return selectedMethods
        .filter(method => method !== "discount")
        .reduce((sum, method) => sum + (amounts[method] || 0), 0); // Use amounts directly
    } catch (error) {
      console.error("Error calculating entered total:", error);
      return 0;
    }
  }, [selectedMethods, amounts]); // Only depend on selectedMethods and amounts

  const remaining = finalTotal - enteredTotal;

  // Set full amount if exactly one method is selected
  useEffect(() => {
    // Avoid updating state if we don't need to
    if (!postponed && selectedMethods.length === 1 && selectedMethods[0] !== "discount") {
      const currentAmount = amounts[selectedMethods[0]] || 0;
      // Only set if the amount is different to avoid infinite loop
      if (Math.abs(currentAmount - finalTotal) >= 0.01) {
        setAmounts(prev => ({
          ...prev,
          [selectedMethods[0]]: finalTotal
        }));
      }
    }
  }, [selectedMethods, finalTotal, postponed, amounts]); // Include amounts in dependencies

  // Clear amounts for methods not selected
  useEffect(() => {
    try {
      // Create a new object to track changes
      const newAmounts = { ...amounts };
      let hasChanges = false;
      
      // Clear unselected methods
      Object.keys(newAmounts).forEach(method => {
        if (!selectedMethods.includes(method) && newAmounts[method] !== 0) {
          newAmounts[method] = 0;
          hasChanges = true;
        }
      });
      
      // Reset multiple payment methods
      if (selectedMethods.length > 1) {
        selectedMethods.forEach(method => {
          if (method !== "discount" && newAmounts[method] !== 0) {
            newAmounts[method] = 0;
            hasChanges = true;
          }
        });
      }
      
      // Only update state if changes were made
      if (hasChanges) {
        setAmounts(newAmounts);
      }
    } catch (error) {
      console.error("Error handling payment methods:", error);
    }
  }, [selectedMethods, amounts]); // Include amounts in dependencies but handle circular updates

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
          selected.map((t, index) => {
            if (!t || typeof t !== 'object') return null;
            return (
              <Typography key={t?.id || `ticket-${index}`}>
                {t?.category || 'Unknown'} - {t?.subcategory || 'Unknown'} × {
                  mode === "existing" 
                    ? 1 
                    : (normalizedTicketCounts[t?.id] || 0)
                } = EGP{" "}
                {(
                  mode === "existing" 
                    ? (typeof t?.price === 'number' ? t.price : 0) 
                    : (normalizedTicketCounts[t?.id] || 0) * (typeof t?.price === 'number' ? t.price : 0)
                ).toFixed(2)}
              </Typography>
            );
          })}

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
