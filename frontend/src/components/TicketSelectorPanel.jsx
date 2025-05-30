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
  IconButton,
  Button,
} from "@mui/material";
import { Add, Remove } from "@mui/icons-material";

const TicketSelectorPanel = ({
  types,
  selectedCategories,
  ticketCounts,
  onTicketCountChange,
  compact = false,
}) => {
  // Subcategory mapping from English to Arabic
  const subcategoryMapping = {
    // Children subcategories
    child: "طفل",
    kid: "طفل",
    kids: "أطفال",
    children: "أطفال",
    toddler: "طفل صغير",
    baby: "رضيع",
    grand: "",

    // Adult subcategories
    adult: "كبير",
    adults: "بالغين",
    grown: "بالغ",
    grownup: "بالغ",
    man: "رجل",
    woman: "امرأة",
    male: "ذكر",
    female: "أنثى",

    // Senior subcategories
    senior: "كبير السن",
    seniors: "كبار السن",
    elderly: "مسن",
    elder: "كبير",
    old: "كبير السن",
    aged: "مسن",

    // Common ticket types
    daily: "يومي",
    weekly: "أسبوعي",
    monthly: "شهري",
    yearly: "سنوي",
    single: "مفرد",
    family: "عائلي",
    group: "جماعي",
    vip: "كبار الشخصيات",
    premium: "مميز",
    standard: "عادي",
    basic: "أساسي",
  };

  // Category mapping (keep this for category chips)
  const categoryMapping = {
    child: "اطفال",
    kid: "اطفال",
    kids: "اطفال",
    children: "اطفال",
    toddler: "اطفال",
    baby: "اطفال",
    infant: "اطفال",
    adult: "كبار",
    adults: "كبار",
    grown: "كبار",
    grownup: "كبار",
    senior: "جدود",
    seniors: "جدود",
    elderly: "جدود",
    elder: "جدود",
    old: "جدود",
    aged: "جدود",
  };

  // Function to translate category to Arabic
  const translateCategory = (category) => {
    if (!category) return category;
    const lowerCategory = category.toLowerCase().trim();
    return categoryMapping[lowerCategory] || category;
  };

  // Function to translate subcategory to Arabic
  const translateSubcategory = (subcategory) => {
    if (!subcategory) return subcategory;
    const lowerSubcategory = subcategory.toLowerCase().trim();
    const translated =
      subcategoryMapping[lowerSubcategory] || subcategory;
    console.log(
      `TicketSelector - Translating subcategory: "${subcategory}" -> "${translated}"`
    );
    return translated;
  };

  // Helper functions for quantity controls
  const handleIncrement = (typeId) => {
    const currentCount = parseInt(ticketCounts[typeId] || 0);
    onTicketCountChange(typeId, (currentCount + 1).toString());
  };

  const handleDecrement = (typeId) => {
    const currentCount = parseInt(ticketCounts[typeId] || 0);
    if (currentCount > 0) {
      onTicketCountChange(typeId, (currentCount - 1).toString());
    }
  };

  const handleDirectInput = (typeId, value) => {
    const numValue = parseInt(value) || 0;
    if (numValue >= 0) {
      onTicketCountChange(typeId, value);
    }
  };

  // Filter types based on selected categories
  const filteredTypes = types
    .filter((t) => selectedCategories.includes(t.category))
    .map((type) => ({
      ...type,
      price: Number(type.price || 0),
      displayCategory: translateCategory(type.originalCategory || type.category),
      displaySubcategory: translateSubcategory(type.subcategory),
    }));

  if (filteredTypes.length === 0) {
    return (
      <Paper sx={{ 
        p: compact ? 1.5 : 3, 
        bgcolor: "#E0F7FF", 
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center"
      }}>
        <Typography variant={compact ? "h6" : "h5"} sx={{ color: "#00AEEF", mb: 2 }}>
          🎟️ Ticket Selection
        </Typography>
        <Box 
          p={3} 
          bgcolor="#f5f5f5" 
          borderRadius={2}
          textAlign="center"
          sx={{ maxWidth: "300px" }}
        >
          <Typography variant="body1" color="textSecondary">
            Select a category from the left panel to see available tickets.
          </Typography>
        </Box>
      </Paper>
    );
  }

  // Group tickets by display category
  const groupedTypes = filteredTypes.reduce((grouped, type) => {
    const displayCategory = type.displayCategory;
    if (!grouped[displayCategory]) {
      grouped[displayCategory] = [];
    }
    grouped[displayCategory].push(type);
    return grouped;
  }, {});

  return (
    <Paper sx={{ 
      p: compact ? 1.5 : 3,
      bgcolor: "#E0F7FF", 
      height: "100%",
      maxHeight: "80vh", // Ensure it fits within the viewport
      display: "flex",
      flexDirection: "column",
      overflowY: "auto", // ✅ Add overflow to the main container
      overflowX: "hidden", // Prevent horizontal scroll
    }}>
      <Typography 
        variant={compact ? "h6" : "h5"}
        sx={{ 
          color: "#00AEEF",
          mb: compact ? 1 : 2,
          textAlign: "center",
          fontWeight: 600,
          flexShrink: 0, // Prevent header from shrinking
        }}
      >
        🎟️ Ticket Selection
      </Typography>

      <Box
        sx={{ 
          flex: 1,
          minHeight: 0, // Important for flex children
          pr: 1, // Add padding for scrollbar space
        }}
      >
        {Object.keys(groupedTypes).map((displayCategory, categoryIndex) => (
          <Box key={displayCategory} mb={compact ? 2 : 3}>
            <Chip
              label={displayCategory}
              size={compact ? "medium" : "large"}
              sx={{
                mb: 1.5,
                bgcolor: "#00AEEF",
                color: "white",
                fontFamily: '"Segoe UI", Tahoma, Arial, sans-serif',
                fontSize: compact ? "0.9rem" : "1rem",
                fontWeight: "bold",
                height: compact ? "32px" : "40px"
              }}
            />
            
            <Grid container spacing={compact ? 1 : 1.5}>
              {groupedTypes[displayCategory].map((type) => {
                const currentCount = parseInt(ticketCounts[type.id] || 0);
                
                return (
                  <Grid item xs={12} key={type.id}>
                    <Card 
                      variant="outlined" 
                      sx={{ 
                        bgcolor: currentCount > 0 ? "#f0f9ff" : "white",
                        border: currentCount > 0 ? "2px solid #00AEEF" : "1px solid #e0e0e0",
                        transition: "all 0.2s ease",
                        "&:hover": {
                          boxShadow: "0 2px 8px rgba(0,174,239,0.1)",
                          transform: "translateY(-1px)"
                        }
                      }}
                    >
                      <CardContent sx={{ 
                        py: compact ? 2 : 2.5,
                        px: compact ? 2 : 3,
                        "&:last-child": { pb: compact ? 2 : 2.5 }
                      }}>
                        {/* Ticket Information */}
                        <Box mb={2}>
                          <Typography
                            variant={compact ? "h6" : "h5"}
                            fontWeight="bold"
                            sx={{
                              color: "#007EA7",
                              fontFamily: '"Segoe UI", Tahoma, Arial, sans-serif',
                              mb: 1
                            }}
                          >
                            {type.displaySubcategory}
                          </Typography>
                          
                          <Typography
                            variant={compact ? "h6" : "h5"}
                            fontWeight="bold"
                            color="#00AEEF"
                            sx={{ mb: 1 }}
                          >
                            EGP {type.price.toFixed(0)}
                          </Typography>
                          
                          {type.description && (
                            <Typography
                              variant="body2"
                              color="textSecondary"
                              sx={{ mb: 1 }}
                            >
                              {type.description}
                            </Typography>
                          )}
                        </Box>

                        {/* Quantity Controls */}
                        <Box 
                          display="flex" 
                          alignItems="center" 
                          justifyContent="space-between"
                          sx={{
                            bgcolor: "#f8f9fa",
                            p: 1.5,
                            borderRadius: 2,
                            border: "1px solid #e9ecef"
                          }}
                        >
                          <Typography variant="body1" fontWeight="medium">
                            Quantity:
                          </Typography>
                          
                          <Box display="flex" alignItems="center" gap={1}>
                            <IconButton
                              onClick={() => handleDecrement(type.id)}
                              disabled={currentCount <= 0}
                              size={compact ? "small" : "medium"}
                              sx={{
                                bgcolor: currentCount > 0 ? "#ff6b6b" : "#e9ecef",
                                color: "white",
                                "&:hover": {
                                  bgcolor: currentCount > 0 ? "#fa5252" : "#e9ecef",
                                },
                                "&:disabled": {
                                  bgcolor: "#e9ecef",
                                  color: "#adb5bd"
                                }
                              }}
                            >
                              <Remove fontSize={compact ? "small" : "medium"} />
                            </IconButton>
                            
                            <TextField
                              type="number"
                              size={compact ? "small" : "medium"}
                              inputProps={{ 
                                min: 0,
                                style: { 
                                  textAlign: "center",
                                  fontSize: compact ? "1rem" : "1.1rem",
                                  fontWeight: "bold"
                                }
                              }}
                              value={currentCount}
                              onChange={(e) => handleDirectInput(type.id, e.target.value)}
                              sx={{ 
                                width: compact ? "70px" : "80px",
                                '& .MuiOutlinedInput-root': {
                                  height: compact ? "40px" : "48px",
                                  bgcolor: "white"
                                }
                              }}
                            />
                            
                            <IconButton
                              onClick={() => handleIncrement(type.id)}
                              size={compact ? "small" : "medium"}
                              sx={{
                                bgcolor: "#51cf66",
                                color: "white",
                                "&:hover": {
                                  bgcolor: "#40c057",
                                }
                              }}
                            >
                              <Add fontSize={compact ? "small" : "medium"} />
                            </IconButton>
                          </Box>
                        </Box>

                        {/* Show subtotal if quantity > 0 */}
                        {currentCount > 0 && (
                          <Box 
                            mt={1.5} 
                            p={1} 
                            bgcolor="#e3f2fd" 
                            borderRadius={1}
                            textAlign="center"
                          >
                            <Typography 
                              variant="body1" 
                              fontWeight="bold" 
                              color="#1976d2"
                            >
                              Subtotal: EGP {(currentCount * type.price).toFixed(0)}
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
            
            {/* Divider between categories */}
            {categoryIndex < Object.keys(groupedTypes).length - 1 && (
              <Divider sx={{ 
                mt: compact ? 2 : 3, 
                mb: 1,
                borderColor: "#00AEEF",
                borderWidth: "1px"
              }} />
            )}
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

export default TicketSelectorPanel;
