import React, { useState, useEffect } from "react";
import TopBar from "../components/TopBar";
import CategoryPanel from "../components/TicketCategoryPanel";
import SelectedCategoryPanel from "../components/SelectedCategoryPanel";
import { Box, Grid, Button, Snackbar, Alert, Typography } from "@mui/material";

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

  const subcategories = selectedCategory
    ? types.filter((t) => t.category === selectedCategory)
    : [];

  const handleCheckout = () => {
    console.log("Checkout button clicked");
    console.log("Ticket counts:", ticketCounts);

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

    console.log("Sending to backend:", ticketsToSell);

    fetch("http://localhost:3000/api/tickets/sell", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tickets: ticketsToSell }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Checkout failed");
        console.log("Tickets sold successfully:", data);
        setSnackbarOpen(true);
        setTicketCounts({});
        setSelectedCategory(null);
      })
      .catch((err) => {
        console.error("Checkout error:", err.message);
        alert("Checkout failed: " + err.message);
      });
  };

  return (
    <Box sx={{ backgroundColor: "#F0F9FF", minHeight: "100vh" }}>
      <TopBar title="Cashier Dashboard" />

      <Box sx={{ px: 3, py: 2 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <CategoryPanel
              types={types}
              onSelectCategory={setSelectedCategory}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <SelectedCategoryPanel
              category={selectedCategory}
              subcategories={subcategories}
              types={types}
              ticketCounts={ticketCounts}
              onTicketCountsChange={setTicketCounts}
              onRemoveCategory={() => setSelectedCategory(null)}
            />

            {/* Checkout Button */}
            <Box mt={2}>
              <Button
                variant="contained"
                onClick={handleCheckout}
                sx={{
                  backgroundColor: "#00AEEF",
                  "&:hover": { backgroundColor: "#00C2CB" },
                }}
              >
                Checkout
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Success Snackbar */}
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
