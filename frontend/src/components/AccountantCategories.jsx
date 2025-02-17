import React, { useState, useEffect } from "react";
import {
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Button,
  IconButton,
  Box,
} from "@mui/material";
import { Add, Edit, Save } from "@mui/icons-material";
import axios from "axios";

const AccountantCategories = () => {
  const [categories, setCategories] = useState({});
  const [editing, setEditing] = useState({});
  const [newCategory, setNewCategory] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPrices, setNewPrices] = useState({
    child: "",
    adult: "",
    grand: "",
  });

  // Fetch ticket data
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data } = await axios.get(
        "http://localhost:3000/api/tickets/ticket-types"
      );

      // Group data by category
      const groupedCategories = data.reduce((acc, ticket) => {
        if (!acc[ticket.category]) acc[ticket.category] = [];
        acc[ticket.category].push(ticket);
        return acc;
      }, {});

      // Sort subcategories within each category (child, adult, grand)
      Object.keys(groupedCategories).forEach((category) => {
        groupedCategories[category].sort((a, b) => {
          const order = ["child", "adult", "grand"];
          return order.indexOf(a.subcategory) - order.indexOf(b.subcategory);
        });
      });

      setCategories(groupedCategories);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  // Handle price edit
  const handleEditPrice = (id, value) => {
    setCategories((prev) => {
      const updatedCategories = { ...prev };
      Object.keys(updatedCategories).forEach((category) => {
        updatedCategories[category] = updatedCategories[category].map(
          (ticket) =>
            ticket.id === id
              ? { ...ticket, price: value } // Only edit price for the specific ticket
              : ticket
        );
      });
      return updatedCategories;
    });
  };

  // Save updated price
  const handleSave = async (id, price) => {
    try {
      await axios.patch("http://localhost:3000/api/tickets/update-price", {
        tickets: [{ id, price }],
      });
      setEditing((prev) => ({ ...prev, [id]: false }));
      fetchCategories(); // Refresh data
    } catch (error) {
      console.error("Error updating price:", error);
    }
  };

  // Handle adding a new category (Ticket Type)
  const handleAddCategory = async () => {
    if (
      !newCategory.trim() ||
      !newDescription.trim() ||
      !newPrices.child ||
      !newPrices.adult ||
      !newPrices.grand
    ) {
      return alert("All fields are required");
    }

    try {
      await axios.post("http://localhost:3000/api/tickets/add-type", {
        ticketTypes: [
          {
            category: newCategory,
            subcategory: "child",
            price: newPrices.child,
            description: newDescription,
          },
          {
            category: newCategory,
            subcategory: "adult",
            price: newPrices.adult,
            description: newDescription,
          },
          {
            category: newCategory,
            subcategory: "grand",
            price: newPrices.grand,
            description: newDescription,
          },
        ],
      });
      setNewCategory("");
      setNewDescription("");
      setNewPrices({ child: "", adult: "", grand: "" });
      fetchCategories(); // Refresh data
    } catch (error) {
      console.error("Error adding category:", error);
    }
  };

  return (
    <Paper sx={{ padding: 2, maxWidth: 1200, margin: "auto", marginTop: 3 }}>
      <Typography variant="h4" sx={{ marginBottom: 2 }}>
        Manage Ticket Categories
      </Typography>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                Category
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                Subcategory
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                Description
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                Price
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.keys(categories).length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No Categories Available
                </TableCell>
              </TableRow>
            ) : (
              Object.entries(categories).map(([categoryName, tickets]) => (
                <React.Fragment key={categoryName}>
                  {/* Render category row only once */}
                  {tickets.map((ticket, index) => (
                    <TableRow key={ticket.id}>
                      {/* Display category name only on the first row */}
                      {index === 0 && (
                        <TableCell
                          rowSpan={tickets.length}
                          align="center"
                          sx={{
                            fontWeight: "bold",
                            fontSize: "1.2rem",
                            verticalAlign: "middle",
                          }}
                        >
                          {categoryName}
                        </TableCell>
                      )}
                      <TableCell align="center">{ticket.subcategory}</TableCell>
                      <TableCell align="center">{ticket.description}</TableCell>
                      <TableCell align="center">
                        {editing[ticket.id] ? (
                          <TextField
                            type="number"
                            value={ticket.price}
                            onChange={(e) =>
                              handleEditPrice(ticket.id, e.target.value)
                            }
                            size="small"
                            sx={{ width: "100px" }}
                          />
                        ) : (
                          `$${ticket.price}`
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {editing[ticket.id] ? (
                          <IconButton
                            onClick={() => handleSave(ticket.id, ticket.price)}
                          >
                            <Save color="primary" />
                          </IconButton>
                        ) : (
                          <IconButton
                            onClick={() =>
                              setEditing((prev) => ({ ...prev, [ticket.id]: true }))
                            }
                          >
                            <Edit color="secondary" />
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

      {/* Add New Category */}
      <Paper sx={{ padding: 2, marginTop: 3, backgroundColor: "#f9f9f9" }}>
        <Typography variant="h6">Add New Category</Typography>
        <TextField
          label="Category Name"
          fullWidth
          sx={{ marginBottom: 2 }}
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
        />
        <TextField
          label="Description"
          fullWidth
          sx={{ marginBottom: 2 }}
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
        />
        <Box display="flex" gap={2} sx={{ marginBottom: 2 }}>
          <TextField
            label="Child Price"
            type="number"
            value={newPrices.child}
            onChange={(e) =>
              setNewPrices((prev) => ({ ...prev, child: e.target.value }))
            }
            size="small"
            sx={{ width: "100px" }}
          />
          <TextField
            label="Adult Price"
            type="number"
            value={newPrices.adult}
            onChange={(e) =>
              setNewPrices((prev) => ({ ...prev, adult: e.target.value }))
            }
            size="small"
            sx={{ width: "100px" }}
          />
          <TextField
            label="Grand Price"
            type="number"
            value={newPrices.grand}
            onChange={(e) =>
              setNewPrices((prev) => ({ ...prev, grand: e.target.value }))
            }
            size="small"
            sx={{ width: "100px" }}
          />
        </Box>
        <Button
          variant="contained"
          color="primary"
          onClick={handleAddCategory}
          startIcon={<Add />}
        >
          Add Category
        </Button>
      </Paper>
    </Paper>
  );
};

export default AccountantCategories;
