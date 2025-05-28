import React, { useState, useEffect, useRef } from "react";
import {
  Box, Typography, TextField, Button, Paper, Snackbar, Alert,
  ToggleButtonGroup, ToggleButton, List, ListItem, ListItemText, IconButton, Dialog, DialogTitle,
  Tooltip, Chip
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ClearAllIcon from "@mui/icons-material/ClearAll";
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

  // Add a loading state
  const [loading, setLoading] = useState(false);

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

    if (end - start > 100) {
      showMessage("Range too large (max 100 tickets at once)", "error");
      return;
    }

    setLoading(true);
    const newIds = [];
    for (let id = start; id <= end; id++) {
      if (!ticketIds.includes(id)) {
        newIds.push(id);
      }
    }

    if (newIds.length === 0) {
      showMessage("No new IDs in this range", "warning");
      setLoading(false);
      return;
    }

    try {
      const responses = await Promise.all(
        newIds.map(id => axios.get(`${config.apiBaseUrl}/api/tickets/ticket/${id}`))
      );
      
      // Track invalid tickets for better error reporting
      const invalidTickets = [];
      const alreadyAssignedTickets = [];
      
      const validDetails = responses.map((r, index) => {
        const data = r.data;
        // Check validity conditions
        if (!data.valid) {
          invalidTickets.push(data.id || newIds[index]);
          return null;
        }
        
        if (mode === "assign" && data.status !== "available") {
          invalidTickets.push(data.id);
          return null;
        }
        
        if (mode === "assign" && data.ticket_type_id !== null) {
          alreadyAssignedTickets.push(data.id);
          return null;
        }
        
        if (mode === "sell" && data.status !== "available") {
          invalidTickets.push(data.id);
          return null;
        }
        
        return data;
      }).filter(Boolean); // Filter out null values

      // Show specific errors
      if (invalidTickets.length > 0) {
        showMessage(`${invalidTickets.length} invalid or unavailable tickets: ${invalidTickets.slice(0, 5).join(', ')}${invalidTickets.length > 5 ? '...' : ''}`, "warning");
      }
      
      if (alreadyAssignedTickets.length > 0) {
        showMessage(`${alreadyAssignedTickets.length} tickets already have assigned types: ${alreadyAssignedTickets.slice(0, 5).join(', ')}${alreadyAssignedTickets.length > 5 ? '...' : ''}`, "warning");
      }

      if (validDetails.length > 0) {
        setTicketIds(prev => [...prev, ...validDetails.map(t => t.id)]);
        setTicketDetails(prev => [...prev, ...validDetails]);
        showMessage(`${validDetails.length} tickets added successfully!`, "success");
        setTimeout(() => listEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      } else {
        showMessage("No valid tickets found in this range", "error");
      }
    } catch (e) {
      showMessage("One or more ticket fetches failed", "error");
    } finally {
      setLoading(false);
    }
  };

  // Add this function to handle removing a single ticket
  const handleRemoveTicket = (id) => {
    setTicketIds(prev => prev.filter(ticketId => ticketId !== id));
    setTicketDetails(prev => prev.filter(ticket => ticket.id !== id));
    showMessage("Ticket removed", "info");
  };

  // Add this function to clear all tickets
  const handleClearAll = () => {
    setTicketIds([]);
    setTicketDetails([]);
    setTicketCounts({});
    showMessage("All tickets cleared", "info");
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
        ticket_ids: ticketIds, // This already contains the correct ticket IDs
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

  // Add this new function to handle mode changes
  const handleModeChange = (e, val) => {
    if (val) {
      // Close checkout panel when switching modes
      if (val !== mode && checkoutOpen) {
        setCheckoutOpen(false);
      }
      setMode(val);
    }
  };

  // Add this useEffect to show checkout panel automatically in sell mode
  useEffect(() => {
    if (mode === "sell" && ticketIds.length > 0) {
      setCheckoutOpen(true);
    }
  }, [ticketIds, mode]);

  return (
    <Box p={3}>
      <Typography variant="h4" mb={2}>Manage Tickets</Typography>

      <ToggleButtonGroup
        value={mode}
        exclusive
        onChange={handleModeChange}
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
          <Button 
            variant="outlined" 
            onClick={handleRangeAdd} 
            disabled={loading}
          >
            {loading ? "Loading..." : "Add Range"}
          </Button>
        </Box>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6">
            Ticket IDs: {ticketIds.length}
          </Typography>
          {ticketIds.length > 0 && (
            <Tooltip title="Clear all tickets">
              <IconButton color="error" onClick={handleClearAll}>
                <ClearAllIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        
        <List>
          {ticketDetails.map((ticket) => (
            <ListItem
              key={ticket.id}
              secondaryAction={
                <IconButton edge="end" aria-label="delete" onClick={() => handleRemoveTicket(ticket.id)}>
                  <DeleteIcon />
                </IconButton>
              }
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>Ticket ID: {ticket.id}</span>
                    <Chip 
                      label={ticket.category && ticket.subcategory ? `${ticket.category} / ${ticket.subcategory}` : 'Unassigned'} 
                      size="small"
                      color={ticket.category ? 'primary' : 'default'}
                      variant={ticket.category ? 'filled' : 'outlined'}
                    />
                  </Box>
                }
                secondary={`Created At: ${new Date(ticket.created_at).toLocaleString()}`}
              />
            </ListItem>
          ))}
          <div ref={listEndRef}></div>
        </List>
        
        {ticketIds.length > 0 && (
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            {mode === "assign" ? (
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={() => setSelectorOpen(true)}
              >
                Assign Ticket Types
              </Button>
            ) : null /* No button in sell mode */}
            <Button
              variant="outlined"
              color="error"
              onClick={handleClearAll}
              fullWidth={mode === "sell"} // Make full width in sell mode
            >
              Clear All
            </Button>
          </Box>
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
          ticketCounts={
            mode === "sell"
              ? ticketDetails.reduce((acc, td) => {
                  // Group by ticket type ID if available
                  if (td.ticket_type_id) {
                    acc[td.ticket_type_id] = (acc[td.ticket_type_id] || 0) + 1;
                  } else {
                    // Otherwise use ticket ID
                    acc[`ticket_${td.id}`] = 1;
                  }
                  return acc;
                }, {})
              : ticketDetails.reduce((acc, t) => {
                  const typeId = t.ticket_type_id;
                  if (typeId) {
                    acc[typeId] = (acc[typeId] || 0) + 1;
                  }
                  return acc;
                }, {})
          }
          types={
            mode === "sell"
              ? ticketDetails.map(td => ({
                  id: td.id,
                  category: td.category || "Ticket",
                  subcategory: td.subcategory || `ID: ${td.id}`,
                  price: td.price || 0,
                  // Just use the ticket ID directly
                  ticketId: td.id
                }))
              : types.filter(t => 
                  ticketDetails.some(td => td.ticket_type_id === t.id)
                ).map(t => ({
                  ...t,
                  price: t.price || 0
                }))
          }
          onCheckout={handleCheckoutSubmit}
          onClear={() => {
            setCheckoutOpen(false);
            showMessage("Checkout canceled", "info");
          }}
          mode="existing"
          ticketIds={ticketIds} // Pass the full list of ticket IDs directly
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
