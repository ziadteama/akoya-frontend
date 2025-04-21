import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Snackbar,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";

const beep = () => window.navigator.vibrate?.(150);

const AccountantScan = () => {
  const [mode, setMode] = useState("validate");
  const [input, setInput] = useState("");
  const [message, setMessage] = useState({
    open: false,
    text: "",
    type: "info",
  });
  const [validatedTicket, setValidatedTicket] = useState(null);
  const [orderList, setOrderList] = useState([]);

  const showMessage = (text, type = "info") => {
    setMessage({ open: true, text, type });
    if (type === "error") beep();
  };

  const handleValidate = async () => {
    if (!input.trim()) return;

    try {
      const { data } = await axios.get(
        `http://localhost:3000/api/tickets/ticket/${input.trim()}`
      );
      setValidatedTicket(data);

      if (!data.valid) {
        showMessage("Ticket is invalid", "error");
      } else {
        showMessage("Ticket is valid!", "success");
      }
    } catch (err) {
      console.error("Fetch failed:", err);
      showMessage("Ticket not found or invalid", "error");
      setValidatedTicket(null);
    }

    setInput("");
  };

  const handleAddToOrder = async () => {
    if (!input.trim()) return;

    try {
      const { data } = await axios.get(
        `http://localhost:3000/api/tickets/ticket/${input.trim()}`
      );

      if (!data.valid) return showMessage("Ticket is invalid!", "error");
      if (data.status !== "available")
        return showMessage("Ticket already sold!", "error");

      if (orderList.find((t) => t.id === data.id)) {
        return showMessage("Ticket already added", "warning");
      }

      setOrderList([...orderList, data]);
      showMessage("Ticket added!", "success");
    } catch (err) {
      console.error("Fetch failed:", err);
      showMessage("Ticket not found or invalid", "error");
    }

    setInput("");
  };

  const handleCheckout = async () => {
    const ticketIds = orderList.map((t) => t.id);
    try {
      await axios.put("http://localhost:3000/api/tickets/mark-sold", {
        ids: ticketIds,
      });
      setOrderList([]);
      showMessage("Order checked out!", "success");
    } catch {
      showMessage("Checkout failed", "error");
    }
  };

  const handleInputKey = (e) => {
    if (e.key === "Enter") {
      mode === "validate" ? handleValidate() : handleAddToOrder();
    }
  };

  const removeFromOrder = (id) => {
    setOrderList(orderList.filter((t) => t.id !== id));
  };

  const renderTicketInfo = (ticket) => (
    <Box>
      <Typography variant="subtitle1">Ticket ID: {ticket.id}</Typography>

      <Typography variant="subtitle1">
        Category: {ticket.category || "-"} | Subcategory:{" "}
        {ticket.subcategory || "-"}
      </Typography>

      <Typography variant="subtitle1">
        Status:{" "}
        {ticket.status === "sold" ? (
          <span style={{ color: "green", fontWeight: 600 }}>Sold</span>
        ) : (
          ticket.status
        )}
      </Typography>

      {!ticket.valid && (
        <Typography variant="subtitle1" sx={{ color: "red", fontWeight: 600 }}>
          Invalid Ticket
        </Typography>
      )}

      <Typography variant="subtitle1">
        Created At: {new Date(ticket.created_at).toLocaleString()}
      </Typography>

      {ticket.sold_at && (
        <Typography variant="subtitle1">
          Sold At: {new Date(ticket.sold_at).toLocaleString()}
        </Typography>
      )}

      {ticket.sold_price && (
        <Typography variant="subtitle1">
          Sold Price: ${ticket.sold_price}
        </Typography>
      )}
    </Box>
  );

  return (
    <Box p={3}>
      <Typography variant="h4" mb={2}>
        Scan Tickets
      </Typography>

      <ToggleButtonGroup
        value={mode}
        exclusive
        onChange={(e, newMode) => newMode && setMode(newMode)}
        sx={{ mb: 2 }}
      >
        <ToggleButton value="validate">Validate Only</ToggleButton>
        <ToggleButton value="order">Build Order</ToggleButton>
      </ToggleButtonGroup>

      <TextField
        label="Scan or Enter Ticket ID"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleInputKey}
        fullWidth
        autoFocus
        sx={{ mb: 2 }}
      />

      {mode === "validate" && validatedTicket && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Ticket Info
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {renderTicketInfo(validatedTicket)}
        </Paper>
      )}

      {mode === "order" && (
        <Paper sx={{ p: 2, mb: 2, maxHeight: "400px", overflowY: "auto" }}>
          <Typography variant="h6">
            Tickets in Order: {orderList.length}
          </Typography>
          <List>
            {orderList.map((t) => (
              <ListItem
                key={t.id}
                secondaryAction={
                  <IconButton onClick={() => removeFromOrder(t.id)} edge="end">
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemText
                  primary={`Ticket #${t.id} - ${t.category || "Unknown"} / ${
                    t.subcategory || "Unknown"
                  }`}
                />
              </ListItem>
            ))}
          </List>
          {orderList.length > 0 && (
            <Button
              variant="contained"
              color="success"
              onClick={handleCheckout}
            >
              Checkout Order
            </Button>
          )}
        </Paper>
      )}

      <Snackbar
        open={message.open}
        autoHideDuration={3000}
        onClose={() => setMessage({ ...message, open: false })}
      >
        <Alert
          severity={message.type}
          onClose={() => setMessage({ ...message, open: false })}
        >
          {message.text}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AccountantScan;
