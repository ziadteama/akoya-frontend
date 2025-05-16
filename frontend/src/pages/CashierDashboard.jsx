import React, { useState, useEffect } from "react";
import TopBar from "../components/TopBar";
import TicketCategoryPanel from "../components/TicketCategoryPanel";
import TicketSelectorPanel from "../components/TicketSelectorPanel";
import CheckoutPanel from "../components/CheckoutPanel";
import { Box, Grid, Snackbar, Alert } from "@mui/material";

const CashierDashboard = () => {
  const [types, setTypes] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [ticketCounts, setTicketCounts] = useState({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    fetch("http://localhost:3000/api/tickets/ticket-types?archived=false")
      .then((res) => res.json())
      .then((data) => setTypes(data))
      .catch((err) => console.error("Failed to fetch ticket types:", err));
  }, []);

  const handleSelectCategory = (category) => {
    if (!selectedCategories.includes(category)) {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const handleRemoveCategory = (category) => {
    setSelectedCategories((prev) => prev.filter((c) => c !== category));
    const updatedCounts = { ...ticketCounts };
    types
      .filter((t) => t.category === category)
      .forEach((t) => delete updatedCounts[t.id]);
    setTicketCounts(updatedCounts);
  };

  const handleCheckout = () => {
  setSnackbarOpen(true);
  setTicketCounts({});
  setSelectedCategories([]);
};


  return (
    <Box sx={{ backgroundColor: "#F0F9FF", minHeight: "100vh" }}>
      <TopBar />
      <Box sx={{ px: 3, py: 2 }}>
        <Grid container spacing={3}>
          <Grid item xs={6}>
            <TicketCategoryPanel
              types={types}
              onSelectCategory={handleSelectCategory}
            />
          </Grid>

          <Grid item xs={6}>
            <Box
              sx={{
                maxHeight: "calc(100vh - 120px)",
                overflowY: "auto",
                pr: 1,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Box sx={{ flex: 1 }}>
                <TicketSelectorPanel
                  types={types}
                  selectedCategories={selectedCategories}
                  ticketCounts={ticketCounts}
                  onTicketCountsChange={setTicketCounts}
                  onRemoveCategory={handleRemoveCategory}
                />
              </Box>

              <Box
                sx={{
                  position: "sticky",
                  bottom: 0,
                  backgroundColor: "#F0F9FF",
                  pt: 2,
                  zIndex: 10,
                }}
              >
                <CheckoutPanel
                  ticketCounts={ticketCounts}
                  types={types}
                  onCheckout={handleCheckout}
                  onRemoveCategory={handleRemoveCategory}

                  onClear={() => {
                    setTicketCounts({});
                    setSelectedCategories([]);
                  }}
                />
              </Box>
            </Box>
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
