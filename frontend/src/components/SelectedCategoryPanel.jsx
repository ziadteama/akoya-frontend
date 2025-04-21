import React from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  IconButton,
  TextField,
  Button,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DeleteIcon from "@mui/icons-material/Delete";

const SelectedCategoryPanel = ({
  category,
  subcategories,
  ticketCounts,
  onTicketCountsChange,
  onRemoveCategory,
}) => {
  if (!category || subcategories.length === 0) return null;

  const increment = (id) => {
    const current = Number(ticketCounts[id] || 0);
    onTicketCountsChange({ ...ticketCounts, [id]: String(current + 1) });
  };

  const decrement = (id) => {
    const current = Number(ticketCounts[id] || 0);
    onTicketCountsChange({
      ...ticketCounts,
      [id]: String(current > 0 ? current - 1 : 0),
    });
  };

  const handleInputChange = (id, value) => {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed) || parsed < 0) return;
    onTicketCountsChange({ ...ticketCounts, [id]: String(parsed) });
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" sx={{ color: "#007EA7", fontWeight: "bold" }}>
          {category}
        </Typography>
        <Button
          color="error"
          startIcon={<DeleteIcon />}
          onClick={() => onRemoveCategory(category)}
        >
          Remove
        </Button>
      </Box>

      <Grid container spacing={2}>
        {subcategories.map((sub) => {
          const count = Number(ticketCounts[sub.id] || 0);
          return (
            <Grid item xs={12} sm={6} key={sub.id}>
              <Card
                sx={{
                  backgroundColor: "#F0F9FF",
                  border: "1px solid #00AEEF",
                  borderRadius: "12px",
                }}
              >
                <CardContent>
                  <Typography variant="subtitle1" sx={{ color: "#333", fontWeight: 500 }}>
                    {sub.name} — ${sub.price}
                  </Typography>

                  <Box display="flex" alignItems="center" mt={1}>
                    <IconButton onClick={() => decrement(sub.id)} sx={{ color: "#007EA7" }}>
                      <RemoveIcon />
                    </IconButton>

                    <TextField
                      size="small"
                      value={ticketCounts[sub.id] || "0"}
                      onChange={(e) => handleInputChange(sub.id, e.target.value)}
                      inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                      sx={{
                        width: "60px",
                        mx: 1,
                        "& input": { textAlign: "center" },
                      }}
                    />

                    <IconButton onClick={() => increment(sub.id)} sx={{ color: "#007EA7" }}>
                      <AddIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default SelectedCategoryPanel;
