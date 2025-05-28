import React, { useState, useEffect, useRef } from "react";
import {
  Box, Typography, TextField, Button, Paper, Snackbar, Alert,
  ToggleButtonGroup, ToggleButton, List, ListItem, ListItemText, IconButton, Dialog, DialogTitle
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import axios from "axios";
import CheckoutPanel from "./CheckoutPanel";
import TicketCategoryPanel from "./TicketCategoryPanel";
import config from '../config';

const beep = () => window.navigator.vibrate?.(150);

const AccountantScan = () => {
  const [mode, setMode] = useState("assign");
  const [input, setInput] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [message, setMessage] = useState({ open: false, text: "", type: "info" });
  const [ticketIds, setTicketIds] = useState([]);
  const [ticketDetails, setTicketDetails] = useState([]);
  const [types, setTypes] = useState([]);
  const [ticketCounts, setTicketCounts] = useState({});
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const listEndRef = useRef(null);

  const showMessage = (text, type = "info") => {
    setMessage({ open: true, text, type });
    if (type === "error") beep();
  };

  const handleRangeAdd = async () => {
    const start = parseInt(from);
    const end = parseInt(to);
    if (isNaN(start) || isNaN(end) || start > end) {
      showMessage("Invalid range", "error");
      return;
    }

    const newIds = [];
    for (let id = start; id <= end; id++) {
      if (!ticketIds.includes(id)) {
        newIds.push(id);
      }
    }

    if (newIds.length === 0) {
      showMessage("No new IDs in this range", "warning");
      return;
    }

    try {
      const responses = await Promise.all(
        newIds.map(id => axios.get(`${config.apiBaseUrl}/api/tickets/ticket/${id}`))
      );
      const validDetails = responses.map(r => r.data).filter(data => {
        if (!data.valid) return false;
        if ((mode === "assign" && (data.status !== "available" || data.ticket_type_id !== null)) ||
            (mode === "sell" && data.status !== "available")) return false;
        return true;
      });

      setTicketIds(prev => [...prev, ...validDetails.map(t => t.id)]);
      setTicketDetails(prev => [...prev, ...validDetails]);
      showMessage("Tickets added!", "success");
      setTimeout(() => listEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (e) {
      showMessage("One or more ticket fetches failed", "error");
    }
  };

  const handleAddTicketId = async () => {
    const id = parseInt(input.trim(), 10);
    if (!id || isNaN(id)) return;

    if (ticketIds.includes(id)) {
      showMessage("Already added", "warning");
      return;
    }

    try {
      const { data } = await axios.get(`${config.apiBaseUrl}/api/tickets/ticket/${id}`);
      if (!data.valid) {
        showMessage("Ticket is invalid", "error");
        return;
      }

      if ((mode === "assign" && (data.status !== "available" || data.ticket_type_id !== null)) ||
          (mode === "sell" && data.status !== "available")) {
        showMessage("Ticket is not available for this operation", "error");
        return;
      }

      setTicketIds(prev => [...prev, id]);
      setTicketDetails(prev => [...prev, data]);
      showMessage("Ticket added!", "success");
      setInput("");
    } catch (err) {
      showMessage("Ticket not found", "error");
    }
  };

  const handleManualCount = (typeId, value) => {
    const parsed = parseInt(value);
    const total = Object.entries(ticketCounts).reduce((sum, [id, count]) => id !== String(typeId) ? sum + Number(count) : sum, 0);
    if (!isNaN(parsed) && parsed >= 0 && total + parsed <= ticketIds.length) {
      setTicketCounts({ ...ticketCounts, [typeId]: parsed });
    } else {
      showMessage("Assigned total exceeds available tickets", "error");
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
        assignments.push({ id: ticketIds[index], ticket_type_id: parseInt(typeId) });
        index++;
      }
    }

    try {
      await axios.patch(`${config.apiBaseUrl}/api/tickets/tickets/assign-types`, { assignments });
      showMessage("Tickets assigned!", "success");
      setTicketIds([]);
      setTicketDetails([]);
      setTicketCounts({});
      setSelectorOpen(false);
    } catch (e) {
      showMessage("Assignment failed", "error");
    }
  };

  const handleSell = () => setCheckoutOpen(true);

  const handleCheckoutSubmit = async (paymentDetails) => {
    try {
      // Sanitize and format the payload for the API
      const payload = {
        ticket_ids: ticketIds,
        user_id: parseInt(localStorage.getItem('userId') || '1'),
        description: paymentDetails.description || '',
        payments: Array.isArray(paymentDetails.payments) && paymentDetails.payments.length > 0 
          ? paymentDetails.payments 
          : [{ 
              method: paymentDetails.paymentMethod || 'cash',
              amount: parseFloat((paymentDetails.totalAmount || 0).toFixed(2)) 
            }]
      };
      
      // Add meals if present and valid
      if (Array.isArray(paymentDetails.meals) && paymentDetails.meals.length > 0) {
        payload.meals = paymentDetails.meals;
      }
      
      console.log('Sending checkout payload:', payload);
      
      const response = await axios.put(
        `${config.apiBaseUrl}/api/tickets/checkout-existing`, 
        payload
      );
      
      setCheckoutOpen(false);
      setTicketIds([]);
      setTicketDetails([]);
      showMessage(`Tickets sold successfully! Order #${response.data.order_id || 'Created'}`, "success");
    } catch (error) {
      console.error("Checkout error:", error);
      showMessage(
        `Failed to process checkout: ${error.response?.data?.message || error.message}`,
        "error"
      );
    }
  };

  useEffect(() => {
    axios.get(`${config.apiBaseUrl}/api/tickets/ticket-types?archived=false`)
      .then((res) => Array.isArray(res.data) && setTypes(res.data))
      .catch(() => showMessage("Failed to fetch ticket types", "error"));
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
        sx={{ mb: 1 }}
      />

      {mode === "assign" && (
        <Box display="flex" gap={2} mb={2}>
          <TextField label="From ID" value={from} onChange={(e) => setFrom(e.target.value)} fullWidth />
          <TextField label="To ID" value={to} onChange={(e) => setTo(e.target.value)} fullWidth />
          <Button variant="outlined" onClick={handleRangeAdd}>Add Range</Button>
        </Box>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6">Ticket IDs: {ticketIds.length}</Typography>
        <List>
          {ticketDetails.map((ticket) => (
            <ListItem key={ticket.id}>
              <ListItemText
                primary={`Ticket ID: ${ticket.id} | ${ticket.category || 'Unassigned'} / ${ticket.subcategory || '-'}`}
                secondary={`Created At: ${new Date(ticket.created_at).toLocaleString()}`}
              />
            </ListItem>
          ))}
          <div ref={listEndRef}></div>
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

      <Dialog open={selectorOpen} onClose={() => setSelectorOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Assign Ticket Counts by Category</DialogTitle>
        <Box p={3}>
          {Object.entries(groupedTypes).map(([category, subtypes]) => (
            <Box key={category} sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>{category}</Typography>
              {subtypes.map((type) => (
                <Paper key={type.id} sx={{ mb: 1, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography>{type.subcategory}</Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Button variant="outlined" onClick={() => handleIncrement(type.id)}>+</Button>
                    <TextField
                      size="small"
                      type="number"
                      value={ticketCounts[type.id] || 0}
                      onChange={(e) => handleManualCount(type.id, e.target.value)}
                      sx={{ width: 60 }}
                    />
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

      {checkoutOpen && (
        <CheckoutPanel
          ticketCounts={ticketDetails.reduce((acc, t) => {
            const id = t.ticket_type_id;
            if (id) {
              acc[id] = (acc[id] || 0) + 1;
            }
            return acc;
          }, {})}
          types={types.filter(t => 
            ticketDetails.some(td => td.ticket_type_id === t.id)
          ).map(t => ({
            ...t,
            price: t.price || 0
          }))}
          onCheckout={handleCheckoutSubmit}
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
