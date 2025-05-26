import React from "react";
import { Grid, Card, CardActionArea, CardContent, Typography, Box, Paper } from "@mui/material";

const TicketCategoryPanel = ({ types, onSelectCategory }) => {
  const uniqueCategories = [...new Set(types.map((type) => type.category))];

  return (
    <Paper 
      elevation={1}
      sx={{ 
        borderRadius: '12px',
        backgroundColor: '#FAFEFF',
        height: "100%"
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: "bold",
            color: "#007EA7",
            mb: 2,
            textAlign: "center",
            position: "sticky",
            top: 0,
            backgroundColor: "#FAFEFF",
            py: 1,
            zIndex: 2
          }}
        >
          Select Ticket Category
        </Typography>

        <Box 
          sx={{
            maxHeight: "calc(100vh - 180px)",  // adjusted for header and padding
            overflowY: "auto",
            pr: 1,
            // Custom scrollbar styling
            "&::-webkit-scrollbar": {
              width: "8px",
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "#F0F9FF",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "#B3E0FF",
              borderRadius: "4px",
            },
            "&::-webkit-scrollbar-thumb:hover": {
              backgroundColor: "#00AEEF",
            }
          }}
        >
          <Grid container spacing={2} justifyContent="center">
            {uniqueCategories.map((category, index) => (
              <Grid item xs={12} sm={6} md={12} lg={6} key={index}>
                <Card
                  sx={{
                    backgroundColor: "#F0F9FF",
                    border: "1px solid #00AEEF",
                    borderRadius: "12px",
                    transition: "0.3s",
                    height: "100%",
                    "&:hover": {
                      boxShadow: 4,
                      backgroundColor: "#E0F7FF",
                      transform: "translateY(-2px)"
                    },
                  }}
                >
                  <CardActionArea 
                    onClick={() => onSelectCategory(category)}
                    sx={{ height: "100%" }}
                  >
                    <CardContent>
                      <Typography
                        variant="h6"
                        sx={{ 
                          textAlign: "center", 
                          color: "#007EA7",
                          fontWeight: "medium"
                        }}
                      >
                        {category}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
            
            {/* Special card for "Meals Only" */}
            <Grid item xs={12} sm={6} md={12} lg={6}>
              <Card
                sx={{
                  backgroundColor: "#FFF8E1",
                  border: "1px solid #FFB300",
                  borderRadius: "12px",
                  transition: "0.3s",
                  height: "100%",
                  "&:hover": {
                    boxShadow: 4,
                    backgroundColor: "#FFECB3",
                    transform: "translateY(-2px)"
                  },
                }}
              >
                <CardActionArea 
                  onClick={() => onSelectCategory("meals_only")}
                  sx={{ height: "100%" }}
                >
                  <CardContent>
                    <Typography
                      variant="h6"
                      sx={{ 
                        textAlign: "center", 
                        color: "#FF6F00",
                        fontWeight: "medium"
                      }}
                    >
                      Meals Only
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Paper>
  );
};

export default TicketCategoryPanel;
