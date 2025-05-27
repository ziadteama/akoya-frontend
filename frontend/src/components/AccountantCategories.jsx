import React, { useState, useEffect, useRef } from "react";
import {
  TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, Button, IconButton, Box, Fab, Switch, FormControlLabel,
  Snackbar, Alert
} from "@mui/material";
import { Add, Edit, Save, ArrowDownward } from "@mui/icons-material";
import axios from "axios";
import config from '../config';

const AccountantCategories = () => {
  const [categories, setCategories] = useState({});
  const [editing, setEditing] = useState({});
  const [newCategory, setNewCategory] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPrices, setNewPrices] = useState({ child: "", adult: "", grand: "" });
  const [showArchived, setShowArchived] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => { fetchCategories(); }, [showArchived]);

  const fetchCategories = async () => {
    try {
      const { data } = await axios.get(`${config.apiBaseUrl}/api/tickets/ticket-types`);
      const filtered = data.filter(ticket => ticket.archived === showArchived);
      const grouped = filtered.reduce((acc, ticket) => {
        if (!acc[ticket.category]) acc[ticket.category] = [];
        acc[ticket.category].push(ticket);
        return acc;
      }, {});
      Object.keys(grouped).forEach((cat) => {
        grouped[cat].sort((a, b) => {
          const order = ["child", "adult", "grand"];
          return order.indexOf(a.subcategory) - order.indexOf(b.subcategory);
        });
      });
      setCategories(grouped);
    } catch (err) {
      console.error("Error fetching:", err);
    }
  };

  const handleEditPrice = (id, value) => {
    setCategories(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(category => {
        updated[category] = updated[category].map(ticket =>
          ticket.id === id ? { ...ticket, price: value } : ticket
        );
      });
      return updated;
    });
  };

  const handleSave = async (id, price) => {
    try {
      await axios.patch(`${config.apiBaseUrl}/api/tickets/update-price`, {
        tickets: [{ id, price }],
      });
      setEditing(prev => ({ ...prev, [id]: false }));
      fetchCategories();
    } catch (err) {
      console.error("Error saving:", err);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim() || !newDescription.trim() || Object.values(newPrices).some(p => !p || Number(p) <= 0)) {
      return alert("All fields are required and prices must be > 0");
    }
    try {
      await axios.post(`${config.apiBaseUrl}/api/tickets/add-type`, {
        ticketTypes: ["child", "adult", "grand"].map(type => ({
          category: newCategory,
          subcategory: type,
          price: newPrices[type],
          description: newDescription,
        })),
      });
      setNewCategory("");
      setNewDescription("");
      setNewPrices({ child: "", adult: "", grand: "" });
      fetchCategories();
    } catch (err) {
      console.error("Error adding:", err);
    }
  };

  const handleToggleArchive = async (categoryName, archived) => {
    try {
      await axios.patch(`${config.apiBaseUrl}/api/tickets/archive-category`, {
        category: categoryName,
        archived,
      });
      setSnackbarMessage(`${categoryName} ${archived ? "archived" : "unarchived"} successfully.`);
      setSnackbarOpen(true);
      fetchCategories();
    } catch (err) {
      console.error("Error archiving:", err);
    }
  };

  const zebraColors = ["#ffffff", "#E0F9FF"];

  return (
    <Paper sx={{ padding: 3, maxWidth: 1200, margin: "auto", marginTop: 3, background: "#F0F9FF", position: "relative" }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" sx={{ color: "#007EA7", fontWeight: 600 }}>
          Manage Ticket Categories
        </Typography>
        <FormControlLabel
          control={<Switch checked={!showArchived} onChange={(e) => setShowArchived(!e.target.checked)} />}
          label={!showArchived ? "Showing Active" : "Showing Archived"}
        />
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {["Category", "Subcategory", "Description", "Price", "Actions"].map(head => (
                <TableCell key={head} align="center" sx={{ backgroundColor: "#00AEEF", color: "#fff", fontWeight: "bold" }}>
                  {head}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.keys(categories).length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">No Categories Available</TableCell>
              </TableRow>
            ) : (
              Object.entries(categories).map(([categoryName, tickets], i) => (
                <React.Fragment key={categoryName}>
                  {tickets.map((ticket, index) => (
                    <TableRow key={ticket.id} sx={{ backgroundColor: zebraColors[i % 2] }}>
                      {index === 0 && (
                        <TableCell rowSpan={tickets.length} align="center">
                          <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                            <Typography sx={{ fontWeight: "bold", fontSize: "1.2rem", color: "#007EA7" }}>
                              {categoryName}
                            </Typography>
                            <Button
                              variant="outlined"
                              size="small"
                              color={ticket.archived ? "success" : "error"}
                              onClick={() => {
                                const confirmMsg = ticket.archived
                                  ? `Unarchive ${categoryName}?`
                                  : `Archive ${categoryName}?`;
                                if (window.confirm(confirmMsg)) {
                                  handleToggleArchive(categoryName, !ticket.archived);
                                }
                              }}
                            >
                              {ticket.archived ? "Unarchive" : "Archive"}
                            </Button>
                          </Box>
                        </TableCell>
                      )}
                      <TableCell align="center">{ticket.subcategory}</TableCell>
                      <TableCell align="center">{ticket.description}</TableCell>
                      <TableCell align="center">
                        {editing[ticket.id] ? (
                          <TextField
                            type="text"
                            inputProps={{ inputMode: "numeric", pattern: "[0-9]*", min: 0 }}
                            value={ticket.price}
                            onChange={(e) => handleEditPrice(ticket.id, e.target.value)}
                            size="small"
                            sx={{ width: "100px" }}
                          />
                        ) : (
                          `${ticket.price}EGP`
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {editing[ticket.id] ? (
                          <IconButton onClick={() => handleSave(ticket.id, ticket.price)}>
                            <Save sx={{ color: "#00AEEF" }} />
                          </IconButton>
                        ) : (
                          <IconButton onClick={() => setEditing((prev) => ({ ...prev, [ticket.id]: true }))}>
                            <Edit sx={{ color: "#007EA7" }} />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Paper sx={{ padding: 3, marginTop: 3, backgroundColor: "#E4F8FC" }} ref={bottomRef}>
        <Typography variant="h6" sx={{ color: "#007EA7" }}>Add New Category</Typography>
        <TextField label="Category Name" fullWidth sx={{ mb: 2 }} value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
        <TextField label="Description" fullWidth sx={{ mb: 2 }} value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
        <Box display="flex" gap={2} sx={{ mb: 2 }}>
          {Object.entries(newPrices).map(([type, value]) => (
            <TextField
              key={type}
              label={`${type.charAt(0).toUpperCase() + type.slice(1)} Price`}
              type="text"
              inputProps={{ inputMode: "numeric", pattern: "[0-9]*", min: 0 }}
              value={value}
              onChange={(e) => setNewPrices((prev) => ({ ...prev, [type]: e.target.value }))}
              size="small"
              sx={{ width: "120px" }}
            />
          ))}
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={handleAddCategory} sx={{ backgroundColor: "#00AEEF", "&:hover": { backgroundColor: "#00C2CB" } }}>
          Add Category
        </Button>
      </Paper>

      <Fab color="primary" size="small" sx={{ position: "fixed", bottom: 24, right: 24, backgroundColor: "#00AEEF", "&:hover": { backgroundColor: "#00C2CB" } }} onClick={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })}>
        <ArrowDownward />
      </Fab>

      <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)}>
        <Alert severity="success" onClose={() => setSnackbarOpen(false)}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default AccountantCategories;
