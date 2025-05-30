import React, { useState, useEffect } from "react";
import { Box, Grid, useMediaQuery, useTheme } from "@mui/material";
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
      p: { 
        xs: 1,
        sm: 2,
        md: isSquareScreen ? 2 : 1, 
        lg: isSquareScreen ? 3 : 2
      },
      backgroundColor: "#f8f9fa", 
      minHeight: "100vh",
      overflowX: "hidden" 
    }}>
      {/* For square screens or mobile, stack the components vertically */}
      {(isSmallScreen || isSquareScreen) ? (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TicketCategoryPanel
              types={types}
              selectedCategories={selectedCategories}
              onSelectCategory={handleSelectCategory}
              onRemoveCategory={handleRemoveCategory}
            />
          </Grid>
          <Grid item xs={12}>
            <TicketSelectorPanel
              types={types}
              selectedCategories={selectedCategories}
              ticketCounts={ticketCounts}
              onTicketCountChange={handleTicketCountChange}
              translateCategory={translateCategory}
            />
          </Grid>
          <Grid item xs={12}>
            <CheckoutPanel
              ticketCounts={ticketCounts}
              types={types}
              onCheckout={handleCheckout}
              onClear={handleClear}
              mode="new"
              baseUrl={baseUrl}
            />
          </Grid>
        </Grid>
      ) : (
        /* More compact horizontal layout */
        <Grid container spacing={1}>
          {/* Reduced width for category panel */}
          <Grid item xs={12} md={2.5} lg={2}>
            <TicketCategoryPanel
              types={types}
              selectedCategories={selectedCategories}
              onSelectCategory={handleSelectCategory}
              onRemoveCategory={handleRemoveCategory}
              compact={true}
            />
          </Grid>
          {/* Increased width for ticket selector */}
          <Grid item xs={12} md={5.5} lg={6}>
            <TicketSelectorPanel
              types={types}
              selectedCategories={selectedCategories}
              ticketCounts={ticketCounts}
              onTicketCountChange={handleTicketCountChange}
              translateCategory={translateCategory}
              compact={true}
            />
          </Grid>
          <Grid item xs={12} md={4} lg={4}>
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
  );
};

export default CashierSellingPanel;

