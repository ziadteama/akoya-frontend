import React, { useState, useEffect, useContext } from "react";
import {
  TextField,
  Paper,
  Typography,
  Button,
  Box,
  FormControlLabel,
  Switch,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  Card,
  CardContent,
  Grid,
  Divider,
  Chip,
  Avatar,
  IconButton,
  Collapse
} from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import axios from "axios";
import dayjs from "dayjs";
import { saveAs } from "file-saver";
import OrdersTable from "./OrdersTable";
import { notify } from '../utils/toast';

// Set dayjs locale configuration to use MM/DD/YYYY format
dayjs.locale({
  ...dayjs.Ls.en,
  formats: {
    ...dayjs.Ls.en.formats,
    L: "MM/DD/YYYY",
    LL: "MMMM D, YYYY",
  }
});

const AccountantReports = () => {
  // Add report mode state
  const [reportMode, setReportMode] = useState('orders');
  const [expandedCategories, setExpandedCategories] = useState({});
  
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [fromDate, setFromDate] = useState(dayjs().subtract(7, 'day'));
  const [toDate, setToDate] = useState(dayjs());
  const [useRange, setUseRange] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [ticketsReportData, setTicketsReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({ totalTickets: 0, totalRevenue: 0 });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const formatDisplayDate = (date) => date.format("MM/DD/YYYY");
  const formatApiDate = (date) => date.format("YYYY-MM-DD");

  const baseUrl = window.runtimeConfig?.apiBaseUrl;

  const handleModeChange = (event, newMode) => {
    if (newMode !== null) {
      setReportMode(newMode);
    }
  };

  const toggleCategoryExpansion = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const fetchOrdersReport = async (shouldFetch = true) => {
    if (!shouldFetch) return;
    
    if (!baseUrl) {
      setError("API configuration not available");
      notify.error("API configuration not available");
      return;
    }
    
    if (useRange && fromDate.isAfter(toDate)) {
      setError("Start date cannot be after end date");
      notify.warning("Start date cannot be after end date");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const params = useRange
        ? { startDate: formatApiDate(fromDate), endDate: formatApiDate(toDate) }
        : { date: formatApiDate(selectedDate) };
          
      const endpoint = useRange
        ? `${baseUrl}/api/orders/range-report`
        : `${baseUrl}/api/orders/day-report`;
          
      const { data } = await axios.get(endpoint, { params });
      
      // Check if the data includes summary from backend
      if (data && typeof data === 'object' && data.summary) {
        // Backend provides summary
        setReportData(Array.isArray(data.items) ? data.items : []);
        setSummary({
          totalTickets: data.summary.totalTickets || 0,
          totalRevenue: data.summary.totalRevenue || 0,
          totalDiscounts: data.summary.totalDiscounts || 0
        });
        notify.success("Orders report loaded successfully");
      } else {
        // Calculate summary on frontend
        const reportItems = Array.isArray(data) ? data : [];
        setReportData(reportItems);
        setSummary(calculateSummary(reportItems));
        notify.success("Orders report loaded successfully");
      }
    } catch (error) {
      console.error("Error fetching orders report:", error);
      const errorMessage = "Failed to fetch orders report. Please try again.";
      setError(errorMessage);
      notify.error(errorMessage);
      setReportData([]);
      setSummary({ totalTickets: 0, totalRevenue: 0, totalDiscounts: 0 });
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketsReport = async (shouldFetch = true) => {
    if (!shouldFetch || !baseUrl) {
      if (!baseUrl) {
        setError("API configuration not available");
        notify.error("API configuration not available");
      }
      return;
    }
    
    if (useRange && fromDate.isAfter(toDate)) {
      setError("Start date cannot be after end date");
      notify.warning("Start date cannot be after end date");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const params = useRange
        ? { startDate: formatApiDate(fromDate), endDate: formatApiDate(toDate) }
        : { date: formatApiDate(selectedDate) };
          
      const endpoint = useRange
        ? `${baseUrl}/api/tickets/tickets-report-range`
        : `${baseUrl}/api/tickets/tickets-report`;
          
      const { data } = await axios.get(endpoint, { params });
      
      setTicketsReportData(data);
      notify.success("Tickets report loaded successfully");
    } catch (error) {
      console.error("Error fetching tickets report:", error);
      const errorMessage = "Failed to fetch tickets report. Please try again.";
      setError(errorMessage);
      notify.error(errorMessage);
      setTicketsReportData(null);
    } finally {
      setLoading(false);
    }
  };

  // Modified useEffect to handle both report types
  useEffect(() => {
    const timer = setTimeout(() => {
      if (reportMode === 'orders') {
        fetchOrdersReport();
      } else {
        fetchTicketsReport();
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [selectedDate, fromDate, toDate, useRange, baseUrl, reportMode]);

  // Enhanced sidebar state management
  useEffect(() => {
    const handleSidebarChange = () => {
      // Check multiple possible storage keys and states
      const storedState = localStorage.getItem('sidebarOpen') || 
                         localStorage.getItem('sidebar-open') ||
                         localStorage.getItem('sidebarExpanded');
      
      // Handle different possible values
      const isOpen = storedState === 'true' || storedState === true || storedState === '1';
      setSidebarOpen(isOpen);
      
      console.log('Sidebar state changed:', isOpen); // Debug log
    };
    
    // Initial check
    handleSidebarChange();
    
    // Listen for storage changes (cross-tab)
    window.addEventListener('storage', handleSidebarChange);
    
    // Listen for custom events (same tab)
    window.addEventListener('sidebarToggle', handleSidebarChange);
    window.addEventListener('sidebar-toggle', handleSidebarChange);
    
    // Listen for resize events that might affect sidebar
    window.addEventListener('resize', handleSidebarChange);
    
    // Poll for changes every second as fallback (remove after debugging)
    const pollInterval = setInterval(() => {
      const currentState = localStorage.getItem('sidebarOpen') === 'true';
      if (currentState !== sidebarOpen) {
        setSidebarOpen(currentState);
        console.log('Sidebar state polled and updated:', currentState);
      }
    }, 1000);
    
    return () => {
      window.removeEventListener('storage', handleSidebarChange);
      window.removeEventListener('sidebarToggle', handleSidebarChange);
      window.removeEventListener('sidebar-toggle', handleSidebarChange);
      window.removeEventListener('resize', handleSidebarChange);
      clearInterval(pollInterval);
    };
  }, [sidebarOpen]);

  const exportOrdersCSV = () => {
    if (reportData.length === 0) return;

    const escapeCSV = (field) => {
      if (field === null || field === undefined) return '';
      const str = String(field);
      if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    let csvContent = "\uFEFF";
    csvContent += useRange
      ? `Orders Report from ${formatDisplayDate(fromDate)} to ${formatDisplayDate(toDate)}\r\n\r\n`
      : `Orders Report for ${formatDisplayDate(selectedDate)}\r\n\r\n`;

    csvContent += `SUMMARY REPORT\r\n`;
    csvContent += `Total Orders,${reportData.length}\r\n`;
    csvContent += `Total Revenue (EGP),${summary.totalRevenue.toFixed(2)}\r\n`;
    csvContent += `Total Discounts (EGP),${(summary.totalDiscounts || 0).toFixed(2)}\r\n`;
    csvContent += `Total Tickets,${summary.totalTickets}\r\n`;

    // Get total tickets by category
    const ticketsByCategory = {};
    reportData.forEach(order => {
      if (order.tickets && order.tickets.length > 0) {
        order.tickets.forEach(ticket => {
          const category = ticket.category || 'Unknown';
          const subcategory = ticket.subcategory || 'Standard';
          const key = `${category}-${subcategory}`;
          
          if (!ticketsByCategory[key]) {
            ticketsByCategory[key] = {
              quantity: 0,
              revenue: 0
            };
          }
          
          ticketsByCategory[key].quantity += (ticket.quantity || 1);
          ticketsByCategory[key].revenue += (ticket.quantity || 1) * parseFloat(ticket.sold_price || 0);
        });
      }
    });

    csvContent += `\r\nTICKET BREAKDOWN\r\n`;
    csvContent += `Category,Quantity,Revenue (EGP)\r\n`;
    Object.entries(ticketsByCategory).forEach(([category, data]) => {
      csvContent += `${escapeCSV(category)},${data.quantity},${data.revenue.toFixed(2)}\r\n`;
    });

    // Get total meals
    const mealsByType = {};
    reportData.forEach(order => {
      if (order.meals && order.meals.length > 0) {
        order.meals.forEach(meal => {
          const name = meal.name || 'Unknown';
          
          if (!mealsByType[name]) {
            mealsByType[name] = {
              quantity: 0,
              revenue: 0
            };
          }
          
          mealsByType[name].quantity += (meal.quantity || 1);
          mealsByType[name].revenue += (meal.quantity || 1) * parseFloat(meal.price_at_order || 0);
        });
      }
    });

    csvContent += `\r\nMEAL BREAKDOWN\r\n`;
    csvContent += `Meal Type,Quantity,Revenue (EGP)\r\n`;
    Object.entries(mealsByType).forEach(([mealName, data]) => {
      csvContent += `${escapeCSV(mealName)},${data.quantity},${data.revenue.toFixed(2)}\r\n`;
    });

    // Payment method breakdown
    const paymentsByMethod = {};
    reportData.forEach(order => {
      if (order.payments && order.payments.length > 0) {
        order.payments.forEach(payment => {
          const method = payment.method || 'Unknown';
          
          if (!paymentsByMethod[method]) {
            paymentsByMethod[method] = 0;
          }
          
          paymentsByMethod[method] += parseFloat(payment.amount || 0);
        });
      }
    });

    csvContent += `\r\nPAYMENT METHOD BREAKDOWN\r\n`;
    csvContent += `Payment Method,Total Amount (EGP)\r\n`;
    Object.entries(paymentsByMethod).forEach(([method, amount]) => {
      csvContent += `${escapeCSV(method)},${amount.toFixed(2)}\r\n`;
    });

    const filename = useRange
      ? `Report_from_${fromDate.format("YYYY-MM-DD")}_to_${toDate.format("YYYY-MM-DD")}.csv`
      : `Report_${selectedDate.format("YYYY-MM-DD")}.csv`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, filename);
    notify.success("Orders CSV exported successfully!");
  };

  const exportTicketsCSV = () => {
    if (!ticketsReportData || (!ticketsReportData.tickets.length && !ticketsReportData.meals.length)) {
      notify.warning("No tickets data to export");
      return;
    }

    const escapeCSV = (field) => {
      if (field === null || field === undefined) return '';
      const str = String(field);
      if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    let csvContent = "\uFEFF";
    csvContent += useRange
      ? `Tickets Report from ${formatDisplayDate(fromDate)} to ${formatDisplayDate(toDate)}\r\n\r\n`
      : `Tickets Report for ${formatDisplayDate(selectedDate)}\r\n\r\n`;

    // Tickets section - removed money columns
    csvContent += "TICKETS REPORT\r\n";
    csvContent += "Category,Subcategory,Quantity,First Sale,Last Sale\r\n";
    
    const ticketsByCategory = ticketsReportData.tickets.reduce((acc, ticket) => {
      if (!acc[ticket.category]) {
        acc[ticket.category] = [];
      }
      acc[ticket.category].push(ticket);
      return acc;
    }, {});

    Object.entries(ticketsByCategory).forEach(([category, tickets]) => {
      let categoryQuantity = 0;
      
      tickets.forEach(ticket => {
        const quantity = parseInt(ticket.quantity);
        const firstSale = ticket.first_sale ? new Date(ticket.first_sale).toLocaleString() : 'N/A';
        const lastSale = ticket.last_sale ? new Date(ticket.last_sale).toLocaleString() : 'N/A';
        
        csvContent += `${escapeCSV(category)},${escapeCSV(ticket.subcategory)},${quantity},${escapeCSV(firstSale)},${escapeCSV(lastSale)}\r\n`;
        
        categoryQuantity += quantity;
      });
      
      csvContent += `${escapeCSV(category)} SUBTOTAL,,${categoryQuantity},,\r\n`;
      csvContent += `\r\n`;
    });

    csvContent += `TICKETS SUMMARY\r\n`;
    csvContent += `Total Tickets Sold,${ticketsReportData.summary.tickets.totalQuantity}\r\n`;
    csvContent += `\r\n\r\n`;

    // Meals section - removed money columns
    if (ticketsReportData.meals.length > 0) {
      csvContent += "MEALS REPORT\r\n";
      csvContent += "Meal Name,Quantity,First Sale,Last Sale\r\n";
      
      ticketsReportData.meals.forEach(meal => {
        const quantity = parseInt(meal.total_quantity);
        const firstSale = meal.first_sale ? new Date(meal.first_sale).toLocaleString() : 'N/A';
        const lastSale = meal.last_sale ? new Date(meal.last_sale).toLocaleString() : 'N/A';
        
        csvContent += `${escapeCSV(meal.meal_name)},${quantity},${escapeCSV(firstSale)},${escapeCSV(lastSale)}\r\n`;
      });

      csvContent += `\r\nMEALS SUMMARY\r\n`;
      csvContent += `Total Meals Sold,${ticketsReportData.summary.meals.totalQuantity}\r\n`;
      csvContent += `\r\n`;
    }

    csvContent += `GRAND TOTAL SUMMARY\r\n`;
    csvContent += `Total Items Sold,${ticketsReportData.summary.tickets.totalQuantity + ticketsReportData.summary.meals.totalQuantity}\r\n`;

    const filename = useRange
      ? `Tickets_Report_${formatApiDate(fromDate)}_to_${formatApiDate(toDate)}.csv`
      : `Tickets_Report_${formatApiDate(selectedDate)}.csv`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, filename);
    notify.success("Tickets CSV exported successfully!");
  };

  const handleRefresh = () => {
    if (reportMode === 'orders') {
      fetchOrdersReport(true);
    } else {
      fetchTicketsReport(true);
    }
  };

  const handleFromDateChange = (newVal) => {
    if (newVal) {
      setFromDate(newVal);
      if (newVal.isAfter(toDate)) {
        setToDate(newVal);
      }
    }
  };
  
  const handleToDateChange = (newVal) => {
    if (newVal) {
      setToDate(newVal);
      if (fromDate.isAfter(newVal)) {
        setFromDate(newVal);
      }
    }
  };

  // Enhanced calculation of totals to properly handle discounts
  const calculateSummary = (reportItems) => {
    // Calculate totals excluding discount payments
    const totalRevenue = reportItems.reduce((sum, row) => 
      sum + (Number(row.total_amount) || 0), 0);
    
    const totalTickets = reportItems.reduce((sum, row) => 
      sum + ((row.tickets && row.tickets.length) || 0), 0);
    
    // Calculate total discounts applied (for reporting)
    const totalDiscounts = reportItems.reduce((sum, row) => {
      if (row.payments && Array.isArray(row.payments)) {
        const discounts = row.payments
          .filter(p => p.method === 'discount')
          .reduce((subSum, p) => subSum + Number(p.amount || 0), 0);
        return sum + discounts;
      }
      return sum;
    }, 0);
    
    // Return the complete summary object
    return {
      totalTickets,
      totalRevenue,
      totalDiscounts
    };
  };

  // Group tickets by category and subcategory for tickets report
  const groupTicketsByCategory = (tickets) => {
    return tickets.reduce((acc, ticket) => {
      if (!acc[ticket.category]) {
        acc[ticket.category] = {};
      }
      if (!acc[ticket.category][ticket.subcategory]) {
        acc[ticket.category][ticket.subcategory] = [];
      }
      acc[ticket.category][ticket.subcategory].push(ticket);
      return acc;
    }, {});
  };

  // Enhanced category colors
  const getCategoryColor = (category) => {
    const colors = {
      'اطفال': { primary: '#FF6B6B', secondary: '#FFE3E3', icon: '🧒' },
      'كبار': { primary: '#4ECDC4', secondary: '#E0F9F7', icon: '👤' },
      'جدود': { primary: '#45B7D1', secondary: '#E3F4FD', icon: '👴' },
      'default': { primary: '#6C5CE7', secondary: '#F0EFFF', icon: '🎫' }
    };
    return colors[category] || colors.default;
  };

  const EnhancedTicketCategoryCard = ({ category, subcategories }) => {
    const categoryTotal = Object.values(subcategories).flat().reduce((sum, ticket) => 
      sum + parseFloat(ticket.total_revenue), 0
    );
    const categoryQuantity = Object.values(subcategories).flat().reduce((sum, ticket) => 
      sum + parseInt(ticket.quantity), 0
    );

    const colorScheme = getCategoryColor(category);
    const isExpanded = expandedCategories[category];

    return (
      <Card sx={{ 
        mb: 2, 
        background: `linear-gradient(135deg, ${colorScheme.secondary} 0%, #ffffff 50%)`,
        border: `2px solid ${colorScheme.primary}`,
        borderRadius: 3,
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 8px 25px rgba(${colorScheme.primary.replace('#', '')}, 0.15)`
        }
      }}>
        <CardContent sx={{ p: 2 }}>
          {/* Header with expand/collapse */}
          <Box 
            display="flex" 
            justifyContent="space-between" 
            alignItems="center" 
            sx={{ cursor: 'pointer' }}
            onClick={() => toggleCategoryExpansion(category)}
          >
            <Box display="flex" alignItems="center" gap={1.5}>
              <Avatar sx={{ 
                bgcolor: colorScheme.primary, 
                width: 40, 
                height: 40,
                fontSize: '1.2rem'
              }}>
                {colorScheme.icon}
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ 
                  color: colorScheme.primary, 
                  fontWeight: 700,
                  fontSize: '1.1rem'
                }}>
                  {category}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {categoryQuantity} tickets sold
                </Typography>
              </Box>
            </Box>
            
            <Box display="flex" alignItems="center" gap={2}>
              <Box textAlign="right">
                <Typography variant="h5" sx={{ 
                  color: colorScheme.primary, 
                  fontWeight: 800,
                  lineHeight: 1
                }}>
                  EGP {categoryTotal.toFixed(0)}
                </Typography>
                <Chip 
                  label={`${categoryQuantity} tickets`}
                  size="small"
                  sx={{ 
                    bgcolor: colorScheme.primary + '20',
                    color: colorScheme.primary,
                    fontWeight: 600,
                    fontSize: '0.7rem'
                  }}
                />
              </Box>
              <IconButton size="small">
                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
          </Box>
          
          {/* Expandable content */}
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <Box mt={2}>
              <Grid container spacing={1.5}>
                {Object.entries(subcategories).map(([subcategory, tickets]) => {
                  const subTotal = tickets.reduce((sum, ticket) => sum + parseFloat(ticket.total_revenue), 0);
                  const subQuantity = tickets.reduce((sum, ticket) => sum + parseInt(ticket.quantity), 0);
                  
                  return (
                    <Grid item xs={12} sm={6} md={4} key={subcategory}>
                      <Paper sx={{ 
                        p: 1.5, 
                        bgcolor: 'rgba(255,255,255,0.8)', 
                        borderRadius: 2,
                        border: `1px solid ${colorScheme.primary}30`,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: 'rgba(255,255,255,0.95)',
                          transform: 'scale(1.02)'
                        }
                      }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <Typography variant="subtitle2" fontWeight="600" color={colorScheme.primary}>
                            {subcategory}
                          </Typography>
                          <Chip 
                            label={`${subQuantity}x`}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </Box>
                        
                        <Typography variant="h6" fontWeight="bold" color="text.primary">
                          EGP {subTotal.toFixed(0)}
                        </Typography>
                        
                        <Box mt={1}>
                          {tickets.map((ticket, index) => (
                            <Typography key={index} variant="caption" display="block" color="textSecondary">
                              {ticket.quantity}x @ EGP {parseFloat(ticket.unit_price).toFixed(0)}
                            </Typography>
                          ))}
                        </Box>
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          </Collapse>
        </CardContent>
      </Card>
    );
  };

  const EnhancedMealsCard = ({ meals }) => {
    const mealsTotal = meals.reduce((sum, meal) => sum + parseFloat(meal.total_revenue), 0);
    const mealsQuantity = meals.reduce((sum, meal) => sum + parseInt(meal.total_quantity), 0);
    
    // Check if meals section is expanded
    const isExpanded = expandedCategories['meals'];

    return (
      <Card sx={{ 
        mb: 2, 
        background: 'linear-gradient(135deg, #FFF3E0 0%, #ffffff 50%)',
        border: "2px solid #FF9800",
        borderRadius: 3,
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 25px rgba(255, 152, 0, 0.15)'
        }
      }}>
        <CardContent sx={{ p: 2 }}>
          {/* Header with expand/collapse */}
          <Box 
            display="flex" 
            justifyContent="space-between" 
            alignItems="center" 
            sx={{ cursor: 'pointer' }}
            onClick={() => toggleCategoryExpansion('meals')}
          >
            <Box display="flex" alignItems="center" gap={1.5}>
              <Avatar sx={{ 
                bgcolor: '#FF9800', 
                width: 40, 
                height: 40,
                fontSize: '1.2rem'
              }}>
                🍽️
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ 
                  color: "#FF9800", 
                  fontWeight: 700,
                  fontSize: '1.1rem'
                }}>
                  Meals & Beverages
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {mealsQuantity} items sold
                </Typography>
              </Box>
            </Box>
            
            <Box display="flex" alignItems="center" gap={2}>
              <Box textAlign="right">
                <Typography variant="h5" sx={{ 
                  color: "#FF9800", 
                  fontWeight: 800,
                  lineHeight: 1
                }}>
                  EGP {mealsTotal.toFixed(0)}
                </Typography>
                <Chip 
                  label={`${mealsQuantity} items`}
                  size="small"
                  sx={{ 
                    bgcolor: '#FF980020',
                    color: '#FF9800',
                    fontWeight: 600,
                    fontSize: '0.7rem'
                  }}
                />
              </Box>
              <IconButton size="small">
                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
          </Box>
          
          {/* Expandable content */}
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <Box mt={2}>
              <Grid container spacing={1.5}>
                {meals.map((meal, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Paper sx={{ 
                      p: 1.5, 
                      bgcolor: 'rgba(255,255,255,0.8)', 
                      borderRadius: 2,
                      border: '1px solid #FF980030',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.95)',
                        transform: 'scale(1.02)'
                      }
                    }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="subtitle2" fontWeight="600" color="#FF9800">
                          {meal.meal_name}
                        </Typography>
                        <Chip 
                          label={`${meal.total_quantity}x`}
                          size="small"
                          sx={{ bgcolor: '#FF9800', color: 'white' }}
                        />
                      </Box>
                      
                      <Typography variant="h6" fontWeight="bold" color="text.primary">
                        EGP {parseFloat(meal.total_revenue).toFixed(0)}
                      </Typography>
                      
                      <Typography variant="caption" color="textSecondary">
                        @ EGP {parseFloat(meal.unit_price).toFixed(0)} each
                      </Typography>
                      
                      {/* Additional meal details */}
                      <Box mt={1}>
                        <Typography variant="caption" display="block" color="textSecondary">
                          {meal.total_quantity}x @ EGP {parseFloat(meal.unit_price).toFixed(0)}
                        </Typography>
                        {meal.first_sale && (
                          <Typography variant="caption" display="block" color="textSecondary">
                            First Sale: {new Date(meal.first_sale).toLocaleDateString()}
                          </Typography>
                        )}
                        {meal.last_sale && (
                          <Typography variant="caption" display="block" color="textSecondary">
                            Last Sale: {new Date(meal.last_sale).toLocaleDateString()}
                          </Typography>
                        )}
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Collapse>
        </CardContent>
      </Card>
    );
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
        {/* Compact Header */}
        <Paper sx={{ 
          p: 1.5,
          m: 1,
          backgroundColor: "#F0F9FF", 
          borderRadius: 2,
          flexShrink: 0
        }}>
          {/* Report Mode Toggle */}
          <Box display="flex" justifyContent="center" alignItems="center" mb={2}>
            <ToggleButtonGroup
              value={reportMode}
              exclusive
              onChange={handleModeChange}
              size="small"
              sx={{ 
                '& .MuiToggleButton-root': {
                  px: 2,
                  py: 0.5,
                  border: '2px solid #00AEEF',
                  fontSize: '0.85rem',
                  '&.Mui-selected': {
                    backgroundColor: '#00AEEF',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: '#007EA7',
                    }
                  }
                }
              }}
            >
              <ToggleButton value="orders">📋 Orders</ToggleButton>
              <ToggleButton value="tickets">🎟️ Tickets</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Compact Controls */}
          <Box display="flex" justifyContent="center" alignItems="center" gap={2} flexWrap="wrap">
            <FormControlLabel
              control={
                <Switch 
                  checked={useRange} 
                  onChange={(e) => setUseRange(e.target.checked)}
                  size="small"
                />
              }
              label={
                <Typography variant="body2">
                  {useRange ? "Date Range" : "Single Date"}
                </Typography>
              }
            />

            {useRange ? (
              <>
                <DatePicker 
                  label="From" 
                  value={fromDate} 
                  onChange={handleFromDateChange}
                  slotProps={{ 
                    textField: { 
                      size: "small",
                      sx: { width: 140, backgroundColor: "#fff" }
                    } 
                  }}
                />
                <DatePicker 
                  label="To" 
                  value={toDate} 
                  onChange={handleToDateChange}
                  slotProps={{ 
                    textField: { 
                      size: "small",
                      sx: { width: 140, backgroundColor: "#fff" }
                    } 
                  }}
                />
              </>
            ) : (
              <DatePicker 
                label="Date" 
                value={selectedDate} 
                onChange={(newVal) => newVal && setSelectedDate(newVal)}
                slotProps={{ 
                  textField: { 
                    size: "small",
                    sx: { width: 160, backgroundColor: "#fff" }
                  } 
                }}
              />
            )}

            <Button 
              variant="contained" 
              onClick={handleRefresh}
              disabled={loading}
              size="small"
              startIcon={loading ? <CircularProgress size={16} /> : null}
            >
              {loading ? "Loading..." : "Refresh"}
            </Button>
          </Box>

          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 1, textAlign: "center" }}>
              {error}
            </Typography>
          )}
        </Paper>

        {/* Main Content - removed mb: 9 since bar is no longer fixed */}
        <Box sx={{ 
          flex: 1, 
          overflow: "hidden",
          mx: 1,
          display: "flex",
          flexDirection: "column"
        }}>
          <Paper sx={{ 
            flex: 1,
            display: "flex",
            flexDirection: "column",
            borderRadius: 2,
            overflow: "hidden"
          }}>
            {/* Content Area */}
            <Box sx={{ 
              flex: 1,
              overflow: "auto",
              p: reportMode === 'tickets' ? 2 : 0
            }}>
              {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                  <CircularProgress size={60} />
                </Box>
              ) : reportMode === 'orders' ? (
                reportData.length === 0 ? (
                  <Box display="flex" justifyContent="center" alignItems="center" height="100%" flexDirection="column">
                    <Typography variant="h6" color="textSecondary" mb={1}>📋</Typography>
                    <Typography variant="body1" color="textSecondary">
                      No orders data available for the selected period
                    </Typography>
                  </Box>
                ) : (
                  <OrdersTable data={reportData} />
                )
              ) : (
                !ticketsReportData || (!ticketsReportData.tickets.length && !ticketsReportData.meals.length) ? (
                  <Box display="flex" justifyContent="center" alignItems="center" height="100%" flexDirection="column">
                    <Typography variant="h6" color="textSecondary" mb={1}>🎟️</Typography>
                    <Typography variant="body1" color="textSecondary">
                      No tickets or meals data available for the selected period
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    {/* Tickets Section */}
                    {ticketsReportData.tickets.length > 0 && (
                      <Box mb={2}>
                        {Object.entries(groupTicketsByCategory(ticketsReportData.tickets)).map(([category, subcategories]) => (
                          <EnhancedTicketCategoryCard 
                            key={category} 
                            category={category} 
                            subcategories={subcategories} 
                          />
                        ))}
                      </Box>
                    )}

                    {/* Meals Section */}
                    {ticketsReportData.meals.length > 0 && (
                      <EnhancedMealsCard meals={ticketsReportData.meals} />
                    )}
                  </Box>
                )
              )}
            </Box>
          </Paper>

          {/* Bottom Summary Bar - Anchored at Bottom */}
          <Paper sx={{ 
            background: "linear-gradient(135deg, #E0F7FF 0%, #ffffff 100%)", 
            borderRadius: 2,
            p: 2,
            mt: 1, // Add margin top for spacing
            borderTop: "3px solid #00AEEF",
            boxShadow: "0 -4px 20px rgba(0, 174, 239, 0.15)",
            flexShrink: 0 // Prevent the bar from shrinking
          }}>
            {reportMode === 'orders' ? (
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={8}>
                  <Box display="flex" flexDirection="column" gap={1}>
                    {/* First Row - Main Stats */}
                    <Box display="flex" gap={4} justifyContent={{ xs: "center", md: "flex-start" }} flexWrap="wrap">
                      <Typography variant="body1" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                        <b>📋 Orders:</b> {reportData.length}
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                        <b>🎟️ Tickets:</b> {summary.totalTickets}
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700, color: "#00AEEF", fontSize: '1.1rem' }}>
                        <b>💰 Revenue:</b> EGP {summary.totalRevenue.toFixed(2)}
                      </Typography>
                    </Box>
                    
                    {/* Second Row - Discounts (if any) */}
                    {summary.totalDiscounts > 0 && (
                      <Box display="flex" justifyContent={{ xs: "center", md: "flex-start" }}>
                        <Typography variant="body1" sx={{ color: 'error.main', fontWeight: 700, fontSize: '1.1rem' }}>
                          <b>💸 Total Discounts Applied:</b> EGP {summary.totalDiscounts.toFixed(2)}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12} md={4} display="flex" justifyContent="center">
                  <Button
                    variant="contained"
                    disabled={reportData.length === 0 || loading}
                    onClick={exportOrdersCSV}
                    size="medium"
                    startIcon={<TrendingUpIcon />}
                    sx={{
                      background: "linear-gradient(45deg, #00AEEF 30%, #007EA7 90%)",
                      boxShadow: "0 3px 5px 2px rgba(0, 174, 239, .3)",
                      fontSize: '1rem',
                      px: 3,
                      py: 1,
                      '&:hover': {
                        background: "linear-gradient(45deg, #007EA7 30%, #005577 90%)",
                      }
                    }}
                  >
                    📊 Export CSV
                  </Button>
                </Grid>
              </Grid>
            ) : ticketsReportData ? (
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={8}>
                  <Box display="flex" gap={4} justifyContent={{ xs: "center", md: "flex-start" }} flexWrap="wrap">
                    <Typography variant="body1" sx={{ fontWeight: 700, color: "#00AEEF", fontSize: '1.1rem' }}>
                      <b>🎟️ Tickets:</b> {ticketsReportData.summary.tickets.totalQuantity}
                    </Typography>
                    {ticketsReportData.summary.meals.totalQuantity > 0 && (
                      <Typography variant="body1" sx={{ fontWeight: 700, color: "#FF9800", fontSize: '1.1rem' }}>
                      <b>🍽️ Meals:</b> {ticketsReportData.summary.meals.totalQuantity}
                    </Typography>
                    )}
                    <Typography variant="body1" sx={{ color: "#ff9800", fontWeight: 800, fontSize: '1.2rem' }}>
                      <b>📊 TOTAL ITEMS:</b> {ticketsReportData.summary.tickets.totalQuantity + ticketsReportData.summary.meals.totalQuantity}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4} display="flex" justifyContent="center">
                  <Button
                    variant="contained"
                    disabled={!ticketsReportData || loading}
                    onClick={exportTicketsCSV}
                    size="medium"
                    startIcon={<TrendingUpIcon />}
                    sx={{
                      background: "linear-gradient(45deg, #FF9800 30%, #FF5722 90%)",
                      boxShadow: "0 3px 5px 2px rgba(255, 152, 0, .3)",
                      fontSize: '1rem',
                      px: 3,
                      py: 1,
                      '&:hover': {
                        background: "linear-gradient(45deg, #FF5722 30%, #E64A19 90%)",
                      }
                    }}
                  >
                    📊 Export CSV
                  </Button>
                </Grid>
              </Grid>
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center">
                <Typography variant="body1" color="textSecondary" sx={{ fontSize: '1.1rem' }}>
                  No data available for summary
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default AccountantReports;