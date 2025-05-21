import React, { useState, useEffect } from "react";
import {
  Box, Typography, TextField, Button, Paper, Snackbar, Alert,
  ToggleButtonGroup, ToggleButton, List, ListItem, ListItemText, IconButton, Dialog, DialogTitle
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";
import CheckoutPanel from "./CheckoutPanel";
import TicketCategoryPanel from "./TicketCategoryPanel";

const beep = () => window.navigator.vibrate?.(150);

const AccountantScan = () => {
  const [mode, setMode] = useState("assign");
  const [input, setInput] = useState("");
  const [message, setMessage] = useState({ open: false, text: "", type: "info" });
  const [ticketIds, setTicketIds] = useState([]);
  const [types, setTypes] = useState([]);
  const [ticketCounts, setTicketCounts] = useState({});
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const showMessage = (text, type = "info") => {
    setMessage({ open: true, text, type });
    if (type === "error") beep();
  };

  const handleAddTicketId = async () => {
    const id = parseInt(input.trim(), 10);
    if (!id || isNaN(id)) return;

    if (ticketIds.includes(id)) {
      showMessage("Already added", "warning");
      return;
    }

    try {
      const { data } = await axios.get(`http://localhost:3000/api/tickets/ticket/${id}`);

      if (!data || typeof data !== 'object') {
        showMessage("Unexpected response format", "error");
        return;
      }

      if (!data.valid) {
        showMessage("Ticket is invalid", "error");
        return;
      }

      if (data.status !== "available" || data.ticket_type_id !== null) {
        showMessage("Ticket already assigned or sold", "error");
        return;
      }

      setTicketIds([...ticketIds, id]);
      showMessage("Ticket added!", "success");
      setInput("");
    } catch (err) {
      console.error("Error fetching ticket:", err);
      if (err.response?.status === 404) {
        showMessage("Ticket not found in system", "error");
      } else {
        showMessage("Server error while checking ticket", "error");
      }
    }
  };

  const handleIncrement = (typeId) => {
    const current = parseInt(ticketCounts[typeId] || 0);
    const totalAssigned = Object.values(ticketCounts).reduce((sum, v) => sum + parseInt(v || 0), 0);
    if (totalAssigned >= ticketIds.length) {
      showMessage("Assigned count exceeds number of added tickets", "error");
      return;
    }
    setTicketCounts({ ...ticketCounts, [typeId]: current + 1 });
  };

  const handleAssign = async () => {
    const totalAssigned = Object.values(ticketCounts).reduce((sum, v) => sum + parseInt(v || 0), 0);
    if (totalAssigned !== ticketIds.length) {
      showMessage("Assigned count must match number of added ticket IDs", "error");
      return;
    }

    const assignments = [];
    let index = 0;
    for (const [typeId, count] of Object.entries(ticketCounts)) {
      for (let i = 0; i < count; i++) {
        assignments.push({
          id: ticketIds[index],
          ticket_type_id: parseInt(typeId)
        });
        index++;
      }
    }

    try {
      await axios.patch("http://localhost:3000/api/tickets/tickets/assign-types", { assignments });
      showMessage("Tickets assigned!", "success");
      setTicketIds([]);
      setTicketCounts({});
      setSelectorOpen(false);
    } catch (e) {
      showMessage("Assignment failed", "error");
    }
  };

  const handleSell = () => {
    setCheckoutOpen(true);
  };

  useEffect(() => {
    axios.get("http://localhost:3000/api/tickets/ticket-types?archived=false")
      .then((res) => {
        if (Array.isArray(res.data)) {
          setTypes(res.data);
        } else {
          showMessage("Invalid ticket types data", "error");
        }
      })
      .catch((err) => {
        console.error("Error fetching ticket types:", err);
        showMessage("Failed to fetch ticket types", "error");
      });
  }, []);

  const groupedTypes = types.reduce((acc, type) => {
    if (!acc[type.category]) acc[type.category] = [];
    acc[type.category].push(type);
    return acc;
  }, {});

  return (
    <Box p={3}>
      <Typography variant="h4" mb={2}>Manage Tickets</Typography>

      <ToggleButtonGroup
        value={mode}
        exclusive
        onChange={(e, val) => val && setMode(val)}
        sx={{ mb: 2 }}
      >
        <ToggleButton value="assign">Assign Ticket Types</ToggleButton>
        <ToggleButton value="sell">Sell Tickets</ToggleButton>
      </ToggleButtonGroup>

      <TextField
        label="Enter Ticket ID"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleAddTicketId()}
        fullWidth
        autoFocus
        sx={{ mb: 2 }}
      />

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6">Ticket IDs: {ticketIds.length}</Typography>
        <List>
          {ticketIds.map((id) => (
            <ListItem key={id} secondaryAction={
              <IconButton onClick={() => setTicketIds(ticketIds.filter((tid) => tid !== id))}>
                <DeleteIcon />
              </IconButton>
            }>
              <ListItemText primary={`Ticket ID: ${id}`} />
            </ListItem>
          ))}
        </List>

        {ticketIds.length > 0 && (
          <Button
            variant="contained"
            color="primary"
            onClick={mode === "assign" ? () => setSelectorOpen(true) : handleSell}
          >
            {mode === "assign" ? "Assign Ticket Types" : "Checkout"}
          </Button>
        )}
      </Paper>

      {/* Assign Dialog */}
      <Dialog open={selectorOpen} onClose={() => setSelectorOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Increment Ticket Counts by Category</DialogTitle>
        <Box p={3}>
          {Object.entries(groupedTypes).map(([category, subtypes]) => (
            <Box key={category} sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>{category}</Typography>
              {subtypes.map((type) => (
                <Paper key={type.id} sx={{ mb: 1, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography>{type.subcategory}</Typography>
                  <Box>
                    <Button variant="outlined" onClick={() => handleIncrement(type.id)}>
                      +
                    </Button>
                    <Typography display="inline" sx={{ mx: 2 }}>{ticketCounts[type.id] || 0}</Typography>
                  </Box>
                </Paper>
              ))}
            </Box>
          ))}
          <Button
            variant="contained"
            onClick={handleAssign}
            disabled={ticketIds.length === 0}
            sx={{ mt: 2 }}
          >
            Confirm Assignment
          </Button>
        </Box>
      </Dialog>

      {/* Sell Panel */}
      {checkoutOpen && (
        <CheckoutPanel
          ticketCounts={ticketIds.reduce((acc, id) => ({ ...acc, [id]: 1 }), {})}
          types={ticketIds.map((id) => ({ id, category: "Assigned", subcategory: "", price: 0 }))}
          onCheckout={() => {
            setCheckoutOpen(false);
            setTicketIds([]);
            showMessage("Tickets sold!", "success");
          }}
          onClear={() => {
            setCheckoutOpen(false);
            showMessage("Checkout canceled", "info");
          }}
        />
      )}

      <Snackbar
        open={message.open}
        autoHideDuration={3000}
        onClose={() => setMessage({ ...message, open: false })}
      >
        <Alert severity={message.type} onClose={() => setMessage({ ...message, open: false })}>
          {message.text}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AccountantScan;  