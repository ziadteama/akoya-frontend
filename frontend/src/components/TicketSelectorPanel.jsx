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
      <Paper sx={{ p: compact ? 1.5 : 3, bgcolor: "#E0F7FF", height: "100%" }}>
        <Typography variant={compact ? "subtitle1" : "h6"} sx={{ color: "#00AEEF" }}>
          Ticket Selection
        </Typography>
        <Box mt={compact ? 1 : 2} p={compact ? 1 : 2} bgcolor="#f5f5f5" borderRadius={1}>
          <Typography align="center" color="textSecondary" variant={compact ? "body2" : "body1"}>
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
    <Paper sx={{ p: compact ? 1.5 : 3, bgcolor: "#E0F7FF", height: "100%" }}>
      <Typography variant={compact ? "subtitle1" : "h6"} sx={{ color: "#00AEEF" }}>
        Ticket Selection
      </Typography>

      <Box
        mt={compact ? 1 : 2}
        sx={{ maxHeight: compact ? "calc(100vh - 180px)" : "calc(100vh - 250px)", overflowY: "auto" }}
      >
        {Object.keys(groupedTypes).map((displayCategory) => (
          <Box key={displayCategory} mb={compact ? 1.5 : 3}>
            <Chip
              label={displayCategory}
              size={compact ? "small" : "medium"}
              sx={{
                mb: 1,
                bgcolor: "#00AEEF",
                color: "white",
                fontFamily: '"Segoe UI", Tahoma, Arial, sans-serif',
                fontSize: compact ? "0.875rem" : "1rem",
              }}
            />
            <Grid container spacing={compact ? 1 : 2}>
              {groupedTypes[displayCategory].map((type) => (
                <Grid item xs={12} key={type.id}>
                  <Card variant="outlined" sx={{ bgcolor: "white" }}>
                    <CardContent sx={{ py: compact ? 1 : 2, px: compact ? 1.5 : 2, "&:last-child": { pb: compact ? 1 : 2 } }}>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Box>
                          <Typography
                            variant={compact ? "body2" : "subtitle1"}
                            fontWeight="bold"
                            sx={{
                              color: "#007EA7",
                              fontFamily: '"Segoe UI", Tahoma, Arial, sans-serif',
                            }}
                          >
                            {type.displaySubcategory}
                          </Typography>
                          {!compact && (
                            <Typography
                              variant="body2"
                              color="textSecondary"
                              sx={{ mb: 1 }}
                            >
                              {type.description || "No description"}
                            </Typography>
                          )}
                          <Typography
                            variant={compact ? "body2" : "body1"}
                            fontWeight="bold"
                            color="#00AEEF"
                          >
                            EGP {type.price.toFixed(2)}
                          </Typography>
                          {/* Only show the debugging info in non-compact mode */}
                          {!compact && (
                            <Typography
                              variant="caption"
                              color="textSecondary"
                              sx={{ fontSize: "0.7rem" }}
                            >
                              Subcategory: {type.displaySubcategory}
                              {type.subcategory !== type.displaySubcategory &&
                                ` (Original: ${type.subcategory})`}
                            </Typography>
                          )}
                        </Box>
                        <TextField
                          label={compact ? "" : "Quantity"}
                          placeholder={compact ? "Qty" : ""}
                          type="number"
                          size="small"
                          inputProps={{ min: 0 }}
                          value={ticketCounts[type.id] || ""}
                          onChange={(e) =>
                            onTicketCountChange(type.id, e.target.value)
                          }
                          sx={{ width: compact ? "70px" : "100px" }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            <Divider sx={{ mt: compact ? 1 : 2 }} />
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

export default TicketSelectorPanel;
