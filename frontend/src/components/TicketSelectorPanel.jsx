import React from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Grid,
  Divider,
  Chip,
  Paper,
} from "@mui/material";

const TicketSelectorPanel = ({
  types,
  selectedCategories,
  ticketCounts,
  onTicketCountChange,
}) => {
  // Filter types based on selected categories and ensure prices are valid
  const filteredTypes = types
    .filter((t) => selectedCategories.includes(t.category))
    .map((type) => ({
      ...type,
      price: Number(type.price || 0), // Ensure price is a number
    }));

  if (filteredTypes.length === 0) {
    return (
      <Paper sx={{ p: 3, bgcolor: "#E0F7FF", height: "100%" }}>
        <Typography variant="h6" sx={{ color: "#00AEEF" }}>
          Ticket Selection
        </Typography>
        <Box mt={2} p={2} bgcolor="#f5f5f5" borderRadius={1}>
          <Typography align="center" color="textSecondary">
            Select a category from the left panel to see available tickets.
          </Typography>
        </Box>
      </Paper>
    );
  }

  // Group tickets by category
  const groupedTypes = filteredTypes.reduce((grouped, type) => {
    if (!grouped[type.category]) {
      grouped[type.category] = [];
    }
    grouped[type.category].push(type);
    return grouped;
  }, {});

  return (
    <Paper sx={{ p: 3, bgcolor: "#E0F7FF", height: "100%" }}>
      <Typography variant="h6" sx={{ color: "#00AEEF" }}>
        Ticket Selection
      </Typography>

      <Box
        mt={2}
        sx={{ maxHeight: "calc(100vh - 250px)", overflowY: "auto" }}
      >
        {Object.keys(groupedTypes).map((category) => (
          <Box key={category} mb={3}>
            <Chip
              label={category}
              sx={{ mb: 1, bgcolor: "#00AEEF", color: "white" }}
            />
            <Grid container spacing={2}>
              {groupedTypes[category].map((type) => (
                <Grid item xs={12} key={type.id}>
                  <Card variant="outlined" sx={{ bgcolor: "white" }}>
                    <CardContent>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Box>
                          <Typography
                            variant="subtitle1"
                            fontWeight="bold"
                            sx={{ color: "#007EA7" }}
                          >
                            {type.subcategory}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="textSecondary"
                            sx={{ mb: 1 }}
                          >
                            {type.description || "No description"}
                          </Typography>
                          <Typography
                            variant="body1"
                            fontWeight="bold"
                            color="#00AEEF"
                          >
                            EGP {type.price.toFixed(2)}
                          </Typography>
                        </Box>
                        <TextField
                          label="Quantity"
                          type="number"
                          size="small"
                          inputProps={{ min: 0 }}
                          value={ticketCounts[type.id] || ""}
                          onChange={(e) =>
                            onTicketCountChange(type.id, e.target.value)
                          }
                          sx={{ width: "100px" }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            <Divider sx={{ mt: 2 }} />
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

export default TicketSelectorPanel;
