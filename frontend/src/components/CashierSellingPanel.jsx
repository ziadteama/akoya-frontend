import React, { useState, useEffect } from "react";
import { Box, Grid } from "@mui/material";
import axios from "axios";
import TicketCategoryPanel from "../components/TicketCategoryPanel";
import TicketSelectorPanel from "../components/TicketSelectorPanel";
import CheckoutPanel from "../components/CheckoutPanel";
import { notify } from '../utils/toast';

const CashierSellingPanel = () => {
  // Define baseUrl at the top of the component
  const baseUrl = window.runtimeConfig?.apiBaseUrl;
  
  const [types, setTypes] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [ticketCounts, setTicketCounts] = useState({});

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
        
        // Ensure all prices are valid numbers
        const typesWithValidPrices = data.map(type => ({
          ...type,
          price: Number(type.price)
        }));
        
        console.log('Ticket types with prices:', 
          typesWithValidPrices.slice(0, 3).map(t => ({ 
            id: t.id, 
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
  }, [baseUrl]); // Include baseUrl in the dependency array

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
    
    try {
      const response = await axios.post(`${baseUrl}/api/tickets/sell`, checkoutData);
      
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
    <Box sx={{ p: 3, backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <TicketCategoryPanel
            types={types}
            selectedCategories={selectedCategories}
            onSelectCategory={handleSelectCategory}
            onRemoveCategory={handleRemoveCategory}
          />
        </Grid>
        <Grid item xs={12} md={5}>
          <TicketSelectorPanel
            types={types}
            selectedCategories={selectedCategories}
            ticketCounts={ticketCounts}
            onTicketCountChange={handleTicketCountChange}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <CheckoutPanel
            ticketCounts={ticketCounts}
            types={types}
            onCheckout={handleCheckout}
            onClear={handleClear}
            mode="new"
            baseUrl={baseUrl} // Pass baseUrl to CheckoutPanel
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default CashierSellingPanel;

