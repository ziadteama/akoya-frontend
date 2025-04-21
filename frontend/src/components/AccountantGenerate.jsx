import React, { useState, useEffect } from "react";
import TopBar from "../components/TopBar";
import TicketCategoryPanel from "../components/TicketCategoryPanel";
import TicketSelectorPanel from "../components/TicketSelectorPanel";
import GenerateSummaryPanel from "../components/GenerateSummaryPanel"; // <- Summary replaces CheckoutPanel
import { Box, Grid, Snackbar, Alert } from "@mui/material";
import { saveAs } from "file-saver";

const AccountantGenerate = () => {
  const [types, setTypes] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [ticketCounts, setTicketCounts] = useState({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    fetch("http://localhost:3000/api/tickets/ticket-types")
      .then((res) => res.json())
      .then((data) => setTypes(data))
      .catch((err) => console.error("Failed to fetch ticket types:", err));
  }, []);

  const handleSelectCategory = (category) => {
    if (!selectedCategories.includes(category)) {
      setSelectedCategories((prev) => [...prev, category]);
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

  const handleClearAll = () => {
    setSelectedCategories([]);
    setTicketCounts({});
  };

  const handleExportCSV = () => {
    const ticketsToGenerate = Object.entries(ticketCounts)
      .filter(([id, qty]) => Number(qty) > 0)
      .map(([id, qty]) => ({
        ticket_type_id: parseInt(id),
        quantity: parseInt(qty),
      }));
  
    if (ticketsToGenerate.length === 0) {
      console.warn("No tickets to generate");
      return;
    }
  
    fetch("http://localhost:3000/api/tickets/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tickets: ticketsToGenerate }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Generation failed");
  
        const ids = data.generatedTicketIds;
        if (!Array.isArray(ids)) throw new Error("Invalid ticket ID response");
  
        // 🔁 Rebuild a flat list of tickets with their type info
        let flattenedTickets = [];
  
        let index = 0;
        for (const { ticket_type_id, quantity } of ticketsToGenerate) {
          const typeInfo = types.find((t) => t.id === ticket_type_id);
          for (let i = 0; i < quantity; i++) {
            flattenedTickets.push({
              id: ids[index++],
              category: typeInfo?.category || "Unknown",
              subcategory: typeInfo?.subcategory || "Unknown",
            });
          }
        }
  
        // ✅ Build CSV from resolved data
        let csv = "Ticket ID,Category,Subcategory\n";
        flattenedTickets.forEach((t) => {
          csv += `${t.id},${t.category},${t.subcategory}\n`;
        });
  
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
        saveAs(blob, `generated_tickets_${Date.now()}.csv`);
  
        setSnackbarOpen(true);
        setSelectedCategories([]);
        setTicketCounts({});
      })
      .catch((err) => {
        console.error("Generation error:", err.message);
        alert("Ticket generation failed: " + err.message);
      });
  };
  
  
  

  return (
    <Box sx={{ backgroundColor: "#F0F9FF", minHeight: "100vh" }}>

      <Box sx={{ px: 3, py: 2 }}>
        <Grid container spacing={3}>
          {/* LEFT COLUMN */}
          <Grid item xs={6}>
            <TicketCategoryPanel
              types={types}
              onSelectCategory={handleSelectCategory}
            />
          </Grid>

          {/* RIGHT COLUMN (scrollable w/ sticky summary) */}
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
                <GenerateSummaryPanel
                  ticketCounts={ticketCounts}
                  types={types}
                  selectedCategories={selectedCategories}
                  onExport={handleExportCSV}
                  onClear={handleClearAll}
                  onRemoveCategory={handleRemoveCategory}
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
          Tickets successfully exported!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AccountantGenerate;
