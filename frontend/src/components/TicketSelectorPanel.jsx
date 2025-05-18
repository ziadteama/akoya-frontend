import React from "react";
import {
  Box,
  Typography,
  Card,
  IconButton,
  TextField,
  Button,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DeleteIcon from "@mui/icons-material/Delete";

const TicketSelectorPanel = ({
  types,
  selectedCategories,
  ticketCounts,
  onTicketCountsChange,
  onRemoveCategory
}) => {
  if (!Array.isArray(types) || !Array.isArray(selectedCategories) || types.length === 0 || selectedCategories.length === 0) return null;

  const increment = (id) => {
    const current = Number(ticketCounts[id] || 0);
    onTicketCountsChange({ ...ticketCounts, [id]: String(current + 1) });
  };

  const decrement = (id) => {
    const current = Number(ticketCounts[id] || 0);
    onTicketCountsChange({
      ...ticketCounts,
      [id]: String(current > 0 ? current - 1 : 0)
    });
  };

  const handleInputChange = (id, value) => {
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      onTicketCountsChange({ ...ticketCounts, [id]: String(parsed) });
    }
  };

  return (
    <Box>
      {selectedCategories.map((category) => {
        const subtypes = types.filter((type) => type.category === category);
        if (subtypes.length === 0) return null;

        return (
          <Card
            key={category}
            sx={{
              backgroundColor: "#F0F9FF",
              border: "1px solid #00AEEF",
              borderRadius: "12px",
              mb: 3,
              px: 3,
              py: 2
            }}
          >



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

            <Box display="flex" flexWrap="wrap" gap={4} justifyContent="center">
              {subtypes.map((type) => (
                <Box key={type.id} textAlign="center">
                  <Typography sx={{ fontSize: 14 }}>{type.name}</Typography>
                  <Typography sx={{ fontSize: 12, mb: 1 }}>
                    {type.subcategory} - {type.price} EGP
                  </Typography>

                  <Box display="flex" alignItems="center" justifyContent="center">
                    <IconButton onClick={() => decrement(type.id)} size="small" sx={{ color: "#007EA7" }}>
                      <RemoveIcon fontSize="small" />
                    </IconButton>

                    <TextField
                      size="small"
                      value={ticketCounts[type.id] || "0"}
                      onChange={(e) => handleInputChange(type.id, e.target.value)}
                      inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                      sx={{
                        width: "50px",
                        "& input": {
                          textAlign: "center",
                          fontSize: "14px",
                          py: "6px"
                        }
                      }}
                    />

                    <IconButton onClick={() => increment(type.id)} size="small" sx={{ color: "#007EA7" }}>
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              ))}
            </Box>
          </Card>
        );
      })}
    </Box>
  );
};

export default TicketSelectorPanel;
