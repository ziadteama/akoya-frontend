import React from "react";
import { Grid, Card, CardActionArea, CardContent, Typography } from "@mui/material";

const TicketCategoryPanel = ({ types, onSelectCategory }) => {
  const uniqueCategories = [...new Set(types.map((type) => type.category))];

  return (
    <div style={{ padding: "8px" }}>
      <Typography variant="h6" sx={{ fontWeight: "bold", color: "#007EA7", mb: 2 }}>
        Select Ticket Category
      </Typography>

      <Grid container spacing={2}>
        {uniqueCategories.map((category, index) => (
          <Grid item xs={12} key={index}>
            <Card
              sx={{
                backgroundColor: "#F0F9FF",
                border: "1px solid #00AEEF",
                borderRadius: "12px",
                transition: "0.3s",
                "&:hover": {
                  boxShadow: 4,
                  backgroundColor: "#E0F7FF",
                },
              }}
            >
              <CardActionArea onClick={() => onSelectCategory(category)}>
                <CardContent>
                  <Typography
                    variant="h6"
                    sx={{ textAlign: "center", color: "#007EA7" }}
                  >
                    {category}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </div>
  );
};

export default TicketCategoryPanel;
