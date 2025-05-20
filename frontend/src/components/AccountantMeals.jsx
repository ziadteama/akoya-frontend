// AccountantMeals.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, Button, IconButton, Box, Fab, Switch, FormControlLabel,
  Snackbar, Alert
} from "@mui/material";
import { Add, Edit, Save, ArrowDownward } from "@mui/icons-material";
import axios from "axios";

const ageGroups = ["child", "adult", "grand"];

const AccountantMeals = () => {
  const [meals, setMeals] = useState([]);
  const [editing, setEditing] = useState({});
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPrices, setNewPrices] = useState({ child: "", adult: "", grand: "" });
  const [showArchived, setShowArchived] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => { fetchMeals(); }, [showArchived]);

  const fetchMeals = async () => {
    try {
      const { data } = await axios.get(`http://localhost:3000/api/meals?archived=${showArchived}`);
      setMeals(data);
    } catch (err) {
      console.error("Error fetching meals:", err);
    }
  };

  const handleEditPrice = (id, value) => {
    setMeals(prev => prev.map(meal => meal.id === id ? { ...meal, price: value } : meal));
  };

  const handleSave = async (id, price) => {
    try {
      await axios.put("http://localhost:3000/api/meals/edit", {
        meals: [{ id, name: meals.find(m => m.id === id).name, description: meals.find(m => m.id === id).description, price, age_group: meals.find(m => m.id === id).age_group }]
      });
      setEditing(prev => ({ ...prev, [id]: false }));
      fetchMeals();
    } catch (err) {
      console.error("Error saving:", err);
    }
  };

  const handleAddMeal = async () => {
    if (!newName.trim() || !newDescription.trim() || Object.values(newPrices).some(p => !p || Number(p) <= 0)) {
      return alert("All fields are required and prices must be > 0");
    }
    try {
      await axios.post("http://localhost:3000/api/meals/add", {
        meals: ageGroups.map(age_group => ({
          name: newName,
          age_group,
          price: newPrices[age_group],
          description: newDescription
        }))
      });
      setNewName("");
      setNewDescription("");
      setNewPrices({ child: "", adult: "", grand: "" });
      fetchMeals();
    } catch (err) {
      console.error("Error adding meals:", err);
    }
  };

  const handleToggleArchive = async (name, archived) => {
    try {
      await axios.patch("http://localhost:3000/api/meals/archive", { name, archived });
      setSnackbarMessage(`${name} ${archived ? "archived" : "unarchived"} successfully.`);
      setSnackbarOpen(true);
      fetchMeals();
    } catch (err) {
      console.error("Error archiving:", err);
    }
  };

  const zebraColors = ["#ffffff", "#E0F9FF"];

  return (
    <Paper sx={{ padding: 3, maxWidth: 1200, margin: "auto", marginTop: 3, background: "#F0F9FF", position: "relative" }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" sx={{ color: "#007EA7", fontWeight: 600 }}>
          Manage Meals
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
              {["Name", "Age Group", "Description", "Price", "Actions"].map(head => (
                <TableCell key={head} align="center" sx={{ backgroundColor: "#00AEEF", color: "#fff", fontWeight: "bold" }}>
                  {head}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {meals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">No Meals Available</TableCell>
              </TableRow>
            ) : (
              meals.map((meal, i) => (
                <TableRow key={meal.id} sx={{ backgroundColor: zebraColors[i % 2] }}>
                  <TableCell align="center">
                    <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                      <Typography sx={{ fontWeight: "bold", fontSize: "1.1rem", color: "#007EA7" }}>{meal.name}</Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        color={meal.archived ? "success" : "error"}
                        onClick={() => {
                          const confirmMsg = meal.archived
                            ? `Unarchive ${meal.name}?`
                            : `Archive ${meal.name}?`;
                          if (window.confirm(confirmMsg)) {
                            handleToggleArchive(meal.name, !meal.archived);
                          }
                        }}
                      >
                        {meal.archived ? "Unarchive" : "Archive"}
                      </Button>
                    </Box>
                  </TableCell>
                  <TableCell align="center">{meal.age_group}</TableCell>
                  <TableCell align="center">{meal.description}</TableCell>
                  <TableCell align="center">
                    {editing[meal.id] ? (
                      <TextField
                        type="text"
                        inputProps={{ inputMode: "numeric", pattern: "[0-9]*", min: 0 }}
                        value={meal.price}
                        onChange={(e) => handleEditPrice(meal.id, e.target.value)}
                        size="small"
                        sx={{ width: "100px" }}
                      />
                    ) : (
                      `${meal.price} EGP`
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {editing[meal.id] ? (
                      <IconButton onClick={() => handleSave(meal.id, meal.price)}>
                        <Save sx={{ color: "#00AEEF" }} />
                      </IconButton>
                    ) : (
                      <IconButton onClick={() => setEditing((prev) => ({ ...prev, [meal.id]: true }))}>
                        <Edit sx={{ color: "#007EA7" }} />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Paper sx={{ padding: 3, marginTop: 3, backgroundColor: "#E4F8FC" }} ref={bottomRef}>
        <Typography variant="h6" sx={{ color: "#007EA7" }}>Add New Meal</Typography>
        <TextField label="Meal Name" fullWidth sx={{ mb: 2 }} value={newName} onChange={(e) => setNewName(e.target.value)} />
        <TextField label="Description" fullWidth sx={{ mb: 2 }} value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
        <Box display="flex" gap={2} sx={{ mb: 2 }}>
          {ageGroups.map((type) => (
            <TextField
              key={type}
              label={`${type.charAt(0).toUpperCase() + type.slice(1)} Price`}
              type="text"
              inputProps={{ inputMode: "numeric", pattern: "[0-9]*", min: 0 }}
              value={newPrices[type]}
              onChange={(e) => setNewPrices((prev) => ({ ...prev, [type]: e.target.value }))}
              size="small"
              sx={{ width: "120px" }}
            />
          ))}
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={handleAddMeal} sx={{ backgroundColor: "#00AEEF", "&:hover": { backgroundColor: "#00C2CB" } }}>
          Add Meal
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

export default AccountantMeals;