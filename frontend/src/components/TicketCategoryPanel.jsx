import React, { useMemo } from "react";
import {
  Box, Typography, List, ListItem, ListItemText, Chip, Paper
} from "@mui/material";

const TicketCategoryPanel = ({ types, selectedCategories, onSelectCategory, onRemoveCategory }) => {
  // Extract unique categories and track their ticket counts and price ranges
  const categories = useMemo(() => {
    const categoriesMap = {};
    
    types.forEach(type => {
      if (!categoriesMap[type.category]) {
        categoriesMap[type.category] = {
          name: type.category,
          count: 0,
          minPrice: Infinity,
          maxPrice: -Infinity
        };
      }
      
      categoriesMap[type.category].count += 1;
      
      // Ensure price is a number for comparison
      const price = Number(type.price || 0);
      
      if (price < categoriesMap[type.category].minPrice) {
        categoriesMap[type.category].minPrice = price;
      }
      
      if (price > categoriesMap[type.category].maxPrice) {
        categoriesMap[type.category].maxPrice = price;
      }
    });
    
    return Object.values(categoriesMap);
  }, [types]);

  return (
    <Paper sx={{ p: 3, bgcolor: "#E0F7FF", height: "100%" }}>
      <Typography variant="h6" sx={{ color: "#00AEEF" }}>Categories</Typography>
      
      {selectedCategories.length > 0 && (
        <Box mt={2} mb={2}>
          <Typography variant="subtitle2" gutterBottom>Selected:</Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {selectedCategories.map((cat) => (
              <Chip
                key={cat}
                label={cat}
                onDelete={() => onRemoveCategory(cat)}
                sx={{ bgcolor: "#00AEEF", color: "white" }}
              />
            ))}
          </Box>
        </Box>
      )}
      
      <List sx={{ maxHeight: "calc(100vh - 300px)", overflowY: "auto" }}>
        {categories.length === 0 ? (
          <Typography align="center" color="textSecondary" sx={{ p: 2 }}>
            No categories available
          </Typography>
        ) : (
          categories.map((cat) => (
            <ListItem
              button
              key={cat.name}
              onClick={() => onSelectCategory(cat.name)}
              disabled={selectedCategories.includes(cat.name)}
              sx={{
                bgcolor: selectedCategories.includes(cat.name) ? "rgba(0, 174, 239, 0.1)" : "white",
                mb: 1,
                borderRadius: 1,
                "&:hover": {
                  bgcolor: "rgba(0, 174, 239, 0.2)",
                },
              }}
            >
              <ListItemText
                primary={cat.name}
                secondary={`${cat.count} ticket types • EGP ${cat.minPrice.toFixed(2)} - ${cat.maxPrice.toFixed(2)}`}
              />
            </ListItem>
          ))
        )}
      </List>
    </Paper>
  );
};

export default TicketCategoryPanel;
