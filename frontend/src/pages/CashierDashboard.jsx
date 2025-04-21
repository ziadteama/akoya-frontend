import React, { useState, useEffect } from "react";
import TopBar from "../components/TopBar";
import TicketCategoryPanel from "../components/TicketCategoryPanel";
import TicketSelectorPanel from "../components/TicketSelectorPanel";
import CheckoutPanel from "../components/CheckoutPanel";
import { Box, Grid, Snackbar, Alert } from "@mui/material";

const CashierDashboard = () => {
  const [types, setTypes] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [ticketCounts, setTicketCounts] = useState({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    fetch("http://localhost:3000/api/tickets/ticket-types")
      .then((res) => res.json())
      .then((data) => setTypes(data))
      .catch((err) => console.error("Failed to fetch ticket types:", err));
  }, []);

  const handleCheckout = () => {
    const ticketsToSell = Object.entries(ticketCounts)
      .filter(([id, qty]) => Number(qty) > 0)
      .map(([id, qty]) => ({
        ticket_type_id: parseInt(id),
        quantity: parseInt(qty),
      }));

    if (ticketsToSell.length === 0) {
      console.warn("No tickets to checkout");
      return;
    }

    fetch("http://localhost:3000/api/tickets/sell", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tickets: ticketsToSell }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Checkout failed");
        setSnackbarOpen(true);
        setTicketCounts({});
        setSelectedCategory(null);
      })
      .catch((err) => {
        console.error("Checkout error:", err.message);
        alert("Checkout failed: " + err.message);
      });
  };

  const subcategories = selectedCategory
    ? types.filter((t) => t.category === selectedCategory)
    : [];

  return (
    <Box sx={{ backgroundColor: "#F0F9FF", minHeight: "100vh" }}>
      <TopBar title="Cashier Dashboard" />
      <Box sx={{ px: 3, py: 2 }}>
        <Grid container spacing={3}>
          <Grid item xs={6}>
            <TicketCategoryPanel types={types} onSelectCategory={setSelectedCategory} />
          </Grid>

          <Grid item xs={6}>
            <TicketSelectorPanel
              category={selectedCategory}
              subcategories={subcategories}
              ticketCounts={ticketCounts}
              onTicketCountsChange={setTicketCounts}
              onRemoveCategory={() => setSelectedCategory(null)}
            />
            <CheckoutPanel
              ticketCounts={ticketCounts}
              types={types}
              onCheckout={handleCheckout}
            />
          </Grid>
        </Grid>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          sx={{ width: "100%" }}
        >
          Tickets successfully sold!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CashierDashboard;
