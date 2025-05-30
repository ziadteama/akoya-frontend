import React, { useState, useEffect } from "react";
import { Box, Grid, useMediaQuery, useTheme, Paper, Typography } from "@mui/material";
import axios from "axios";
import TicketCategoryPanel from "../components/TicketCategoryPanel";
import TicketSelectorPanel from "../components/TicketSelectorPanel";
import CheckoutPanel from "../components/CheckoutPanel";
import { notify } from '../utils/toast';

const CashierSellingPanel = () => {
  // Add theme hooks for responsive design
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const isSquareScreen = useMediaQuery('(max-aspect-ratio: 4/3)');
  const isExtraWideScreen = useMediaQuery(theme.breakpoints.up('xl'));
  
  // Define baseUrl at the top of the component
  const baseUrl = window.runtimeConfig?.apiBaseUrl;
  
  const [types, setTypes] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [ticketCounts, setTicketCounts] = useState({});

  // Update the category mapping to include all variations
  const categoryMapping = {
    'child': 'اطفال',
    'kid': 'اطفال',
    'kids': 'اطفال',
    'children': 'اطفال',
    'toddler': 'اطفال',
    'baby': 'اطفال',
    'infant': 'اطفال',
    'adult': 'كبار',
    'adults': 'كبار',
    'grown': 'كبار',
    'grownup': 'كبار',
    'senior': 'جدود',
    'seniors': 'جدود',
    'elderly': 'جدود',
    'elder': 'جدود',
    'old': 'جدود',
    'aged': 'جدود'
  };

  // Enhanced translate function with better logging
  const translateCategory = (category) => {
    if (!category) {
      console.log('No category provided to translate');
      return category;
    }
    
    const lowerCategory = category.toLowerCase().trim();
    const translated = categoryMapping[lowerCategory] || category;
    
    // Log the translation for debugging
    console.log(`CashierPanel - Translating category: "${category}" -> "${translated}"`);
    
    return translated;
  };

  // Fetch ticket types with proper price handling
  useEffect(() => {
    // Add check for baseUrl
    if (!baseUrl) {
      console.error("API base URL is not configured");
      notify.error("API configuration missing. Please refresh the page.");
      return;
    }
    
    const fetchTicketTypes = async () => {
      try {
        const { data } = await axios.get(`${baseUrl}/api/tickets/ticket-types?archived=false`);
        
        // Ensure all prices are valid numbers and translate categories
        const typesWithValidPrices = data.map(type => ({
          ...type,
          price: Number(type.price),
          // Keep original category for backend compatibility
          originalCategory: type.category,
          // Add translated category for display
          category: translateCategory(type.category)
        }));
        
        console.log('Ticket types with Arabic categories:', 
          typesWithValidPrices.slice(0, 3).map(t => ({ 
            id: t.id, 
            originalCategory: t.originalCategory,
            category: t.category, 
            subcategory: t.subcategory,
            price: t.price 
          }))
        );
        
        setTypes(typesWithValidPrices);
      } catch (error) {
        console.error("Failed to fetch ticket types:", error);
        notify.error("Failed to load ticket types");
      }
    };
    
    fetchTicketTypes();
  }, [baseUrl]);

  const handleSelectCategory = (category) => {
    if (!selectedCategories.includes(category)) {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const handleRemoveCategory = (category) => {
    setSelectedCategories((prev) => prev.filter((c) => c !== category));
    const updatedCounts = { ...ticketCounts };

    types
      .filter((t) => t.category === category)
      .forEach((t) => delete updatedCounts[t.id]);
    setTicketCounts(updatedCounts);
  };

  const handleTicketCountChange = (typeId, value) => {
    const count = parseInt(value);

    if (count <= 0) {
      const updatedCounts = { ...ticketCounts };
      delete updatedCounts[typeId];
      setTicketCounts(updatedCounts);
    } else {
      setTicketCounts({ ...ticketCounts, [typeId]: count });
    }
  };

  const handleCheckout = async (checkoutData) => {
    // Check for baseUrl here too
    if (!baseUrl) {
      notify.error("API configuration missing. Unable to process checkout.");
      return;
    }
    
    // Convert Arabic categories back to original English for backend
    const modifiedCheckoutData = {
      ...checkoutData,
      tickets: checkoutData.tickets?.map(ticket => {
        const originalType = types.find(t => t.id === ticket.type_id);
        return {
          ...ticket,
          category: originalType?.originalCategory || ticket.category
        };
      })
    };
    
    try {
      const response = await axios.post(`${baseUrl}/api/tickets/sell`, modifiedCheckoutData);
      
      notify.success(`Order completed successfully! Order #${response.data.order_id || 'Created'}`);
      
      // Reset the component state
      setTicketCounts({});
      // Keep selected categories to improve UX
    } catch (error) {
      console.error("Checkout error:", error);
      notify.error(error.response?.data?.message || "Failed to process checkout");
    }
  };

  const handleClear = () => {
    setTicketCounts({});
  };

  return (
    <Box sx={{ 
      height: "calc(100vh - 80px)", 
      display: "flex",
      flexDirection: "column",
      backgroundColor: "#f8f9fa",
      overflow: "hidden"
    }}>
      {/* Header */}
      <Paper 
        elevation={1} 
        sx={{ 
          p: 1.5,  // Reduced padding
          m: 1, 
          backgroundColor: "#E0F7FF",
          borderRadius: 2
        }}
      >
        <Typography 
          variant="h6"  // Smaller header
          sx={{ 
            color: "#00AEEF", 
            fontWeight: 600, 
            textAlign: "center"
          }}
        >
          🎫 Ticket Sales System
        </Typography>
      </Paper>

      {/* Main Content Area */}
      <Box sx={{ 
        flex: 1, 
        p: 1, 
        display: "flex",
        gap: 1,
        overflow: "hidden"
      }}>
        {/* Square/Mobile Layout - Adjusted proportions */}
        {(isSmallScreen || isSquareScreen) ? (
          <Box sx={{ 
            width: "100%", 
            display: "flex", 
            flexDirection: "column", 
            gap: 1,
            height: "100%"
          }}>
            {/* Top Row: Give categories more space */}
            <Box sx={{ 
              display: "flex", 
              gap: 1, 
              height: "40%",  // Increased from 35%
              minHeight: "280px"  // Increased min height
            }}>
              <Box sx={{ flex: 1.2 }}>  {/* More space for categories */}
                <TicketCategoryPanel
                  types={types}
                  selectedCategories={selectedCategories}
                  onSelectCategory={handleSelectCategory}
                  onRemoveCategory={handleRemoveCategory}
                  compact={true}
                />
              </Box>
              <Box sx={{ flex: 0.8 }}>  {/* Less space for checkout */}
                <CheckoutPanel
                  ticketCounts={ticketCounts}
                  types={types}
                  onCheckout={handleCheckout}
                  onClear={handleClear}
                  mode="new"
                  baseUrl={baseUrl}
                  compact={true}
                />
              </Box>
            </Box>
            
            {/* Bottom Row: Ticket Selector - more compact */}
            <Box sx={{ flex: 1, minHeight: "250px" }}>  {/* Reduced min height */}
              <TicketSelectorPanel
                types={types}
                selectedCategories={selectedCategories}
                ticketCounts={ticketCounts}
                onTicketCountChange={handleTicketCountChange}
                translateCategory={translateCategory}
                compact={true}
              />
            </Box>
          </Box>
        ) : (
          /* Wide Screen Layout - Adjusted column proportions */
          <Grid container spacing={1} sx={{ height: "100%" }}>
            <Grid item xs={12} md={3.5} lg={3}>  {/* More space for categories */}
              <TicketCategoryPanel
                types={types}
                selectedCategories={selectedCategories}
                onSelectCategory={handleSelectCategory}
                onRemoveCategory={handleRemoveCategory}
                compact={true}
              />
            </Grid>
            <Grid item xs={12} md={4.5} lg={5.5}>  {/* Less space for selector */}
              <TicketSelectorPanel
                types={types}
                selectedCategories={selectedCategories}
                ticketCounts={ticketCounts}
                onTicketCountChange={handleTicketCountChange}
                translateCategory={translateCategory}
                compact={true}
              />
            </Grid>
            <Grid item xs={12} md={4} lg={3.5}>  {/* Checkout remains same */}
              <CheckoutPanel
                ticketCounts={ticketCounts}
                types={types}
                onCheckout={handleCheckout}
                onClear={handleClear}
                mode="new"
                baseUrl={baseUrl}
                compact={true}
              />
            </Grid>
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default CashierSellingPanel;

