import React from "react";
import {
  Box,
  Typography,
  Button,
  Divider,
  Stack,
  IconButton
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

const GenerateSummaryPanel = ({
  ticketCounts,
  types,
  selectedCategories,
  onExport,
  onClear,
  onRemoveCategory
}) => {
  const selected = types.filter((t) => Number(ticketCounts[t.id] || 0) > 0);
  const totalTickets = selected.reduce((sum, t) => sum + Number(ticketCounts[t.id]), 0);

  if (selected.length === 0) return null;

  return (
    <Box
      mt={2}
      p={3}
      sx={{
        border: "1px solid #00AEEF",
        borderRadius: "12px",
        backgroundColor: "#E0F7FF",
        textAlign: "center",
        boxShadow: "0px -1px 6px rgba(0,0,0,0.1)"
      }}
    >
      <Typography
        variant="subtitle1"
        sx={{ fontWeight: "bold", color: "#007EA7", mb: 2 }}
      >
        📦 Ticket Generation Summary
      </Typography>

      {selectedCategories.map((category) => {
        const catItems = selected.filter((t) => t.category === category);
        if (catItems.length === 0) return null;

        return (
          <Box key={category} mb={2}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={1}
              px={1}
            >
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 600, color: "#007EA7" }}
              >
                {category}
              </Typography>
              {onRemoveCategory && (
                <IconButton
                  size="small"
                  onClick={() => onRemoveCategory(category)}
                  color="error"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
            {catItems.map((t) => (
              <Typography key={t.id} sx={{ fontSize: 14 }}>
                {ticketCounts[t.id]} × {t.name} ({t.subcategory})
              </Typography>
            ))}
          </Box>
        );
      })}

      <Divider sx={{ my: 2 }} />

      <Typography
        variant="h6"
        sx={{ color: "#007EA7", fontWeight: 600, mb: 2 }}
      >
        Total Tickets: {totalTickets}
      </Typography>

      <Stack direction="row" justifyContent="center" spacing={2}>
        <Button
          variant="contained"
          onClick={onExport}
          sx={{
            backgroundColor: "#00AEEF",
            "&:hover": { backgroundColor: "#00C2CB" }
          }}
        >
          Export CSV
        </Button>

        <Button
          variant="outlined"
          onClick={onClear}
          sx={{ borderColor: "#00AEEF", color: "#00AEEF" }}
        >
          Clear
        </Button>
      </Stack>
    </Box>
  );
};

export default GenerateSummaryPanel;
