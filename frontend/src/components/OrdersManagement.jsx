import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Card,
  CardContent,
  Tabs,
  Tab
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import axios from 'axios';

// Icons
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import SaveIcon from '@mui/icons-material/Save';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PaymentIcon from '@mui/icons-material/Payment';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LocalActivityIcon from '@mui/icons-material/LocalActivity';
import DateRangeIcon from '@mui/icons-material/DateRange';
import RefreshIcon from '@mui/icons-material/Refresh';
import PrintIcon from '@mui/icons-material/Print';
import PersonIcon from '@mui/icons-material/Person';

const OrdersManagement = () => {
  // State variables
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('week');
  const [fromDate, setFromDate] = useState(dayjs().subtract(7, 'day'));
  const [toDate, setToDate] = useState(dayjs());
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Edit Dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editableOrder, setEditableOrder] = useState(null);
  
  // Filter menu
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    paymentMethods: [],
    orderTotal: { min: '', max: '' }
  });
  
  // Ticket and meal modification
  const [availableTicketTypes, setAvailableTicketTypes] = useState([]);
  const [availableMeals, setAvailableMeals] = useState([]);
  
  // Notification
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Tab state for edit dialog
  const [editTab, setEditTab] = useState(0);

  // Fetch orders on component mount and when date range changes
  useEffect(() => {
    fetchOrders();
  }, [fromDate, toDate]);
  
  // Fetch ticket types and meals for order editing
  useEffect(() => {
    fetchTicketTypes();
    fetchMeals();
  }, []);
  
  // Fetch orders from API
  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setError('Authentication required. Please log in again.');
        setLoading(false);
        return;
      }
      
      const params = {
        startDate: fromDate.format('YYYY-MM-DD'),
        endDate: toDate.format('YYYY-MM-DD')
      };
      
      const response = await axios.get('http://localhost:3000/api/orders/range-report', { 
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Orders fetched:', response.data);
      
      if (Array.isArray(response.data)) {
        setOrders(response.data);
      } else {
        setError('Unexpected data format received');
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to fetch orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch ticket types for adding tickets to order
  const fetchTicketTypes = async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) return;
      
      const response = await axios.get('http://localhost:3000/api/tickets/ticket-types', {
        params: { archived: false },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setAvailableTicketTypes(response.data);
    } catch (error) {
      console.error('Error fetching ticket types:', error);
    }
  };
  
  // Fetch meals for adding to order
  const fetchMeals = async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) return;
      
      const response = await axios.get('http://localhost:3000/api/meals', {
        params: { archived: false },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setAvailableMeals(response.data);
    } catch (error) {
      console.error('Error fetching meals:', error);
    }
  };

  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle search
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  // Handle date range filtering
  const handleDateRangeChange = (range) => {
    setDateRange(range);
    
    const today = dayjs();
    
    switch (range) {
      case 'today':
        setFromDate(today.startOf('day'));
        setToDate(today);
        break;
      case 'yesterday':
        const yesterday = today.subtract(1, 'day');
        setFromDate(yesterday.startOf('day'));
        setToDate(yesterday.endOf('day'));
        break;
      case 'week':
        setFromDate(today.subtract(7, 'day'));
        setToDate(today);
        break;
      case 'month':
        setFromDate(today.subtract(30, 'day'));
        setToDate(today);
        break;
      case 'quarter':
        setFromDate(today.subtract(90, 'day'));
        setToDate(today);
        break;
      default:
        setFromDate(today.subtract(7, 'day'));
        setToDate(today);
    }
  };

  // Handle from date change
  const handleFromDateChange = (newValue) => {
    if (newValue) {
      setFromDate(newValue);
      // Ensure fromDate is not after toDate
      if (newValue.isAfter(toDate)) {
        setToDate(newValue);
      }
    }
  };
  
  // Handle to date change
  const handleToDateChange = (newValue) => {
    if (newValue) {
      setToDate(newValue);
      // Ensure toDate is not before fromDate
      if (fromDate.isAfter(newValue)) {
        setFromDate(newValue);
      }
    }
  };

  // Open edit dialog
  const handleOpenEditDialog = (order) => {
    setSelectedOrder(order);
    setEditableOrder({
      ...order,
      tickets: order.tickets || [],
      meals: order.meals || [],
      payments: order.payments || [],
      addedTickets: [],
      removedTickets: [],
      addedMeals: [],
      removedMeals: []
    });
    setEditDialogOpen(true);
  };
  
  // Close edit dialog
  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedOrder(null);
    setEditableOrder(null);
    setEditTab(0);
  };

  // Handle adding a ticket to the order
  const handleAddTicket = (ticketType) => {
    if (!editableOrder) return;
    
    console.log('Adding ticket:', ticketType); // Debug log
    
    // Check if this ticket type is already in the order
    const existingTicketIndex = editableOrder.tickets.findIndex(
      t => t.ticket_type_id === ticketType.id || t.ticket_type_id === ticketType.ticket_type_id
    );
    
    if (existingTicketIndex >= 0) {
      // Increment quantity of existing ticket
      const updatedTickets = [...editableOrder.tickets];
      updatedTickets[existingTicketIndex] = {
        ...updatedTickets[existingTicketIndex],
        quantity: (updatedTickets[existingTicketIndex].quantity || 1) + 1
      };
      
      setEditableOrder({
        ...editableOrder,
        tickets: updatedTickets
      });
    } else {
      // Add new ticket type
      const newTicket = {
        ticket_type_id: ticketType.id || ticketType.ticket_type_id,
        category: ticketType.category,
        subcategory: ticketType.subcategory,
        sold_price: ticketType.price,
        quantity: 1
      };
      
      console.log('New ticket being added:', newTicket); // Debug log
      
      setEditableOrder(prevState => ({
        ...prevState,
        tickets: [...(prevState.tickets || []), newTicket]
      }));
    }
    
    // Add to addedTickets for tracking changes
    const newAddedTicket = {
      ticket_type_id: ticketType.id || ticketType.ticket_type_id,
      quantity: 1
    };
    
    setEditableOrder(prevState => ({
      ...prevState,
      addedTickets: [...(prevState.addedTickets || []), newAddedTicket]
    }));
    
    // Recalculate total after a short delay to ensure state is updated
    setTimeout(() => recalculateOrderTotal(), 50);
  };
  
  // Handle removing a ticket from the order
  const handleRemoveTicket = (ticketTypeId) => {
    if (!editableOrder) return;
    
    // Find the ticket in the order
    const ticketIndex = editableOrder.tickets.findIndex(t => t.ticket_type_id === ticketTypeId);
    
    if (ticketIndex >= 0) {
      const updatedTickets = [...editableOrder.tickets];
      
      if (updatedTickets[ticketIndex].quantity > 1) {
        // Decrement quantity
        updatedTickets[ticketIndex] = {
          ...updatedTickets[ticketIndex],
          quantity: updatedTickets[ticketIndex].quantity - 1
        };
      } else {
        // Remove the ticket type completely
        updatedTickets.splice(ticketIndex, 1);
      }
      
      setEditableOrder({
        ...editableOrder,
        tickets: updatedTickets
      });
      
      // Add to removedTickets for tracking changes
      setEditableOrder(prevState => ({
        ...prevState,
        removedTickets: [...(prevState.removedTickets || []), { ticket_type_id: ticketTypeId, quantity: 1 }]
      }));
      
      recalculateOrderTotal();
    }
  };
  
  // Handle adding a meal to the order
  const handleAddMeal = (meal) => {
    if (!editableOrder) return;
    
    console.log('Adding meal:', meal); // Debug log
    
    // Check if this meal is already in the order
    const existingMealIndex = editableOrder.meals.findIndex(
      m => m.meal_id === meal.id || m.meal_id === meal.meal_id
    );
    
    if (existingMealIndex >= 0) {
      // Increment quantity of existing meal
      const updatedMeals = [...editableOrder.meals];
      updatedMeals[existingMealIndex] = {
        ...updatedMeals[existingMealIndex],
        quantity: (updatedMeals[existingMealIndex].quantity || 1) + 1
      };
      
      setEditableOrder({
        ...editableOrder,
        meals: updatedMeals
      });
    } else {
      // Add new meal
      const newMeal = {
        meal_id: meal.id || meal.meal_id,
        name: meal.name,
        quantity: 1,
        price_at_order: meal.price
      };
      
      console.log('New meal being added:', newMeal); // Debug log
      
      setEditableOrder(prevState => ({
        ...prevState,
        meals: [...(prevState.meals || []), newMeal]
      }));
    }
    
    // Add to addedMeals for tracking changes
    const newAddedMeal = {
      meal_id: meal.id || meal.meal_id,
      quantity: 1,
      price: meal.price
    };
    
    setEditableOrder(prevState => ({
      ...prevState,
      addedMeals: [...(prevState.addedMeals || []), newAddedMeal]
    }));
    
    // Recalculate total after a short delay to ensure state is updated
    setTimeout(() => recalculateOrderTotal(), 50);
  };
  
  // Handle removing a meal from the order
  const handleRemoveMeal = (mealId) => {
    if (!editableOrder) return;
    
    // Find the meal in the order
    const mealIndex = editableOrder.meals.findIndex(m => m.meal_id === mealId);
    
    if (mealIndex >= 0) {
      const updatedMeals = [...editableOrder.meals];
      
      if (updatedMeals[mealIndex].quantity > 1) {
        // Decrement quantity
        updatedMeals[mealIndex] = {
          ...updatedMeals[mealIndex],
          quantity: updatedMeals[mealIndex].quantity - 1
        };
      } else {
        // Remove the meal completely
        updatedMeals.splice(mealIndex, 1);
      }
      
      setEditableOrder({
        ...editableOrder,
        meals: updatedMeals
      });
      
      // Add to removedMeals for tracking changes
      setEditableOrder(prevState => ({
        ...prevState,
        removedMeals: [...(prevState.removedMeals || []), { meal_id: mealId, quantity: 1 }]
      }));
      
      recalculateOrderTotal();
    }
  };

  // Handle payment method change
  const handlePaymentMethodChange = (index, method) => {
    if (!editableOrder) return;
    
    const updatedPayments = [...editableOrder.payments];
    updatedPayments[index] = { ...updatedPayments[index], method };
    
    setEditableOrder({
      ...editableOrder,
      payments: updatedPayments
    });
  };
  
  // Handle payment amount change
  const handlePaymentAmountChange = (index, amount) => {
    if (!editableOrder) return;
    
    const updatedPayments = [...editableOrder.payments];
    updatedPayments[index] = { ...updatedPayments[index], amount: parseFloat(amount) || 0 };
    
    setEditableOrder({
      ...editableOrder,
      payments: updatedPayments
    });
    
    // Validate total payments match order total
    validatePaymentTotal();
  };
  
  // Add a new payment method
  const handleAddPayment = () => {
    if (!editableOrder) return;
    
    setEditableOrder({
      ...editableOrder,
      payments: [...(editableOrder.payments || []), { method: 'cash', amount: 0 }]
    });
  };
  
  // Remove a payment method
  const handleRemovePayment = (index) => {
    if (!editableOrder) return;
    
    const updatedPayments = [...editableOrder.payments];
    updatedPayments.splice(index, 1);
    
    setEditableOrder({
      ...editableOrder,
      payments: updatedPayments
    });
    
    // Validate total payments match order total
    validatePaymentTotal();
  };

  // Recalculate order total based on tickets and meals
  const recalculateOrderTotal = () => {
    if (!editableOrder) return;
    
    console.log('Recalculating with tickets:', editableOrder.tickets);
    console.log('Recalculating with meals:', editableOrder.meals);
    
    // Calculate ticket total
    const ticketTotal = (editableOrder.tickets || []).reduce((sum, ticket) => {
      const price = parseFloat(ticket.sold_price) || 0;
      const quantity = ticket.quantity || 1;
      return sum + (price * quantity);
    }, 0);
    
    // Calculate meal total
    const mealTotal = (editableOrder.meals || []).reduce((sum, meal) => {
      const price = parseFloat(meal.price_at_order) || 0;
      const quantity = meal.quantity || 1;
      return sum + (price * quantity);
    }, 0);
    
    // Update order total
    const totalAmount = ticketTotal + mealTotal;
    console.log(`New total: ${totalAmount} (Tickets: ${ticketTotal}, Meals: ${mealTotal})`);
    
    setEditableOrder(prevState => ({
      ...prevState,
      total_amount: totalAmount.toFixed(2)
    }));
    
    // Update payment amounts to match new total if there's only one payment method
    if (editableOrder.payments && editableOrder.payments.length === 1) {
      const updatedPayments = [...editableOrder.payments];
      updatedPayments[0] = {
        ...updatedPayments[0],
        amount: totalAmount
      };
      
      setEditableOrder(prevState => ({
        ...prevState,
        payments: updatedPayments
      }));
    }
  };
  
  // Validate payment totals match order total
  const validatePaymentTotal = () => {
    if (!editableOrder || !editableOrder.payments) return true;
    
    const orderTotal = parseFloat(editableOrder.total_amount);
    const paymentTotal = editableOrder.payments.reduce((sum, payment) => {
      return sum + parseFloat(payment.amount || 0);
    }, 0);
    
    return Math.abs(orderTotal - paymentTotal) < 0.01; // Allow small rounding differences
  };

  // Save order changes
  const saveOrderChanges = async () => {
    try {
      if (!editableOrder || !selectedOrder) return;
      
      // Validate payment total matches order total
      if (!validatePaymentTotal()) {
        setNotification({
          open: true,
          message: 'Payment total must match order total',
          severity: 'error'
        });
        return;
      }
      
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setNotification({
          open: true,
          message: 'Authentication required. Please log in again.',
          severity: 'error'
        });
        setLoading(false);
        return;
      }
      
      // Create the update payload
      const updatePayload = {
        order_id: selectedOrder.order_id,
        addedTickets: editableOrder.addedTickets,
        removedTickets: editableOrder.removedTickets,
        addedMeals: editableOrder.addedMeals,
        removedMeals: editableOrder.removedMeals,
        payments: editableOrder.payments
      };
      
      // Send the update request
      await axios.put(
        'http://localhost:3000/api/orders/update',
        updatePayload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Close dialog and show success message
      handleCloseEditDialog();
      setNotification({
        open: true,
        message: 'Order updated successfully',
        severity: 'success'
      });
      
      // Refresh orders list
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      setNotification({
        open: true,
        message: error.response?.data?.message || 'Failed to update order',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Apply filters to orders
  const applyFilters = () => {
    // Implementation depends on your filtering requirements
    // This is a placeholder for the filtering logic
    console.log('Applying filters:', filterOptions);
    setFilterMenuOpen(false);
  };

  // Filter orders based on search term and other filters
  const filteredOrders = orders.filter(order => {
    // Filter by search term
    const searchMatch = 
      order.order_id?.toString().includes(searchTerm) ||
      order.user_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Add more filter conditions as needed
    return searchMatch;
  });

  // Notification handler
  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };
  
  // Format currency for display
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Handle tab change in edit dialog
  const handleEditTabChange = (event, newValue) => {
    setEditTab(newValue);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        {/* Header and Controls */}
        <Box sx={{ 
          mb: 3, 
          display: 'flex', 
          justifyContent: 'space-between',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 2
        }}>
          {/* Search bar */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              placeholder="Search orders..."
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={handleSearchChange}
              sx={{ width: { xs: '100%', md: 300 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* Date range selector */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <DatePicker
                label="From Date"
                value={fromDate}
                onChange={handleFromDateChange}
                slotProps={{ textField: { size: 'small' } }}
                sx={{ width: 150 }}
              />
              <Typography sx={{ mx: 1 }}>-</Typography>
              <DatePicker
                label="To Date"
                value={toDate}
                onChange={handleToDateChange}
                slotProps={{ textField: { size: 'small' } }}
                sx={{ width: 150 }}
              />
            </Box>
            
            <Button
              variant="outlined"
              onClick={fetchOrders}
              startIcon={<RefreshIcon />}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {/* Quick date range buttons */}
        <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
          <Button 
            variant={dateRange === 'today' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => handleDateRangeChange('today')}
          >
            Today
          </Button>
          <Button 
            variant={dateRange === 'yesterday' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => handleDateRangeChange('yesterday')}
          >
            Yesterday
          </Button>
          <Button 
            variant={dateRange === 'week' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => handleDateRangeChange('week')}
          >
            Last 7 Days
          </Button>
          <Button 
            variant={dateRange === 'month' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => handleDateRangeChange('month')}
          >
            Last 30 Days
          </Button>
          <Button 
            variant={dateRange === 'quarter' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => handleDateRangeChange('quarter')}
          >
            Last 90 Days
          </Button>
        </Box>

        {/* Orders Table */}
        <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 2 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="error">{error}</Typography>
              <Button
                variant="outlined"
                onClick={fetchOrders}
                sx={{ mt: 2 }}
              >
                Retry
              </Button>
            </Box>
          ) : filteredOrders.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography>No orders found for the selected period</Typography>
            </Box>
          ) : (
            <>
              <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Order ID</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Date & Time</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Cashier</TableCell> {/* Changed from Customer to Cashier */}
                      <TableCell sx={{ fontWeight: 'bold' }}>Items</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Payment</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="right">Total</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredOrders
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((order) => {
                        const orderDate = new Date(order.created_at);
                        
                        // Calculate item counts
                        const ticketCount = order.tickets ? 
                          order.tickets.reduce((sum, ticket) => sum + (ticket.quantity || 0), 0) : 0;
                        
                        const mealCount = order.meals ? 
                          order.meals.reduce((sum, meal) => sum + (meal.quantity || 0), 0) : 0;
                          
                        return (
                          <TableRow 
                            hover
                            key={order.order_id}
                            sx={{ '&:hover': { cursor: 'pointer' } }}
                          >
                            <TableCell>#{order.order_id}</TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {orderDate.toLocaleDateString()}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {orderDate.toLocaleTimeString()}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <PersonIcon fontSize="small" color="action" />
                                <Typography>{order.user_name || 'Unknown'}</Typography> {/* Changed text from Anonymous to Unknown */}
                              </Box>
                            </TableCell>
                            <TableCell>
                              {ticketCount > 0 && (
                                <Chip 
                                  icon={<LocalActivityIcon fontSize="small" />}
                                  label={`${ticketCount} ticket${ticketCount !== 1 ? 's' : ''}`}
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                  sx={{ mr: 1, mb: 0.5 }}
                                />
                              )}
                              {mealCount > 0 && (
                                <Chip 
                                  icon={<RestaurantIcon fontSize="small" />}
                                  label={`${mealCount} meal${mealCount !== 1 ? 's' : ''}`}
                                  size="small"
                                  color="secondary"
                                  variant="outlined"
                                  sx={{ mb: 0.5 }}
                                />
                              )}
                            </TableCell>
                            <TableCell>
                              {order.payments && order.payments.map((payment, index) => (
                                <Chip 
                                  key={index}
                                  label={`${payment.method}: ${formatCurrency(payment.amount)}`}
                                  size="small"
                                  color={
                                    payment.method === 'cash' ? 'success' :
                                    payment.method === 'card' ? 'primary' :
                                    payment.method === 'transfer' ? 'info' :
                                    payment.method === 'discount' ? 'error' :  // Keep discount red
                                    'default'  // Make postponed use default color
                                  }
                                  sx={{ mr: 0.5, mb: 0.5 }}
                                />
                              ))}
                            </TableCell>
                            <TableCell align="right">
                              <Typography fontWeight="bold">
                                {formatCurrency(order.total_amount)}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                color="primary"
                                onClick={() => handleOpenEditDialog(order)}
                              >
                                <EditIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[10, 25, 50]}
                component="div"
                count={filteredOrders.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          )}
        </Paper>

        {/* Edit Order Dialog */}
        <Dialog 
          open={editDialogOpen} 
          onClose={handleCloseEditDialog}
          fullWidth
          maxWidth="md"
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Edit Order #{selectedOrder?.order_id}</Typography>
              <Chip 
                label={formatCurrency(editableOrder?.total_amount || 0)}
                color="primary"
                size="medium"
              />
            </Box>
          </DialogTitle>
          
          <Box sx={{ px: 3, pb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {selectedOrder ? `Created on ${new Date(selectedOrder.created_at).toLocaleString()} by ${selectedOrder.user_name}` : ''}
            </Typography>
          </Box>

          <Tabs value={editTab} onChange={handleEditTabChange} sx={{ px: 3, borderBottom: 1, borderColor: 'divider' }}>
            <Tab icon={<LocalActivityIcon />} iconPosition="start" label="Tickets" />
            <Tab icon={<RestaurantIcon />} iconPosition="start" label="Meals" />
            <Tab icon={<PaymentIcon />} iconPosition="start" label="Payment" />
          </Tabs>
          
          <DialogContent dividers>
            {editableOrder && (
              <>
                {/* Tickets Tab */}
                {editTab === 0 && (
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" gutterBottom>Current Tickets</Typography>
                      
                      {(!editableOrder.tickets || editableOrder.tickets.length === 0) ? (
                        <Typography color="text.secondary">No tickets in this order</Typography>
                      ) : (
                        <List>
                          {editableOrder.tickets.map((ticket, index) => (
                            <ListItem key={index} divider={index < (editableOrder.tickets.length - 1)}>
                              <ListItemText 
                                primary={`${ticket.category} - ${ticket.subcategory}`}
                                secondary={`${ticket.quantity} x ${formatCurrency(ticket.sold_price)}`}
                              />
                              <ListItemSecondaryAction>
                                <IconButton 
                                  edge="end" 
                                  color="error"
                                  onClick={() => handleRemoveTicket(ticket.ticket_type_id)}
                                >
                                  <RemoveIcon />
                                </IconButton>
                              </ListItemSecondaryAction>
                            </ListItem>
                          ))}
                        </List>
                      )}
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" gutterBottom>Add Tickets</Typography>
                      
                      {(!availableTicketTypes || availableTicketTypes.length === 0) ? (
                        <Typography color="text.secondary">No ticket types available</Typography>
                      ) : (
                        <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                          {availableTicketTypes.map((ticketType) => (
                            <ListItem key={ticketType.id} divider>
                              <ListItemText 
                                primary={`${ticketType.category} - ${ticketType.subcategory}`}
                                secondary={formatCurrency(ticketType.price)}
                              />
                              <ListItemSecondaryAction>
                                <IconButton 
                                  edge="end" 
                                  color="primary"
                                  onClick={() => handleAddTicket(ticketType)}
                                >
                                  <AddIcon />
                                </IconButton>
                              </ListItemSecondaryAction>
                            </ListItem>
                          ))}
                        </List>
                      )}
                    </Grid>
                  </Grid>
                )}
                
                {/* Meals Tab */}
                {editTab === 1 && (
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" gutterBottom>Current Meals</Typography>
                      
                      {(!editableOrder.meals || editableOrder.meals.length === 0) ? (
                        <Typography color="text.secondary">No meals in this order</Typography>
                      ) : (
                        <List>
                          {editableOrder.meals.map((meal, index) => (
                            <ListItem key={index} divider={index < (editableOrder.meals.length - 1)}>
                              <ListItemText 
                                primary={meal.name}
                                secondary={`${meal.quantity} x ${formatCurrency(meal.price_at_order)}`}
                              />
                              <ListItemSecondaryAction>
                                <IconButton 
                                  edge="end" 
                                  color="error"
                                  onClick={() => handleRemoveMeal(meal.meal_id)}
                                >
                                  <RemoveIcon />
                                </IconButton>
                              </ListItemSecondaryAction>
                            </ListItem>
                          ))}
                        </List>
                      )}
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" gutterBottom>Add Meals</Typography>
                      
                      {(!availableMeals || availableMeals.length === 0) ? (
                        <Typography color="text.secondary">No meals available</Typography>
                      ) : (
                        <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                          {availableMeals.map((meal) => (
                            <ListItem key={meal.id} divider>
                              <ListItemText 
                                primary={meal.name}
                                secondary={formatCurrency(meal.price)}
                              />
                              <ListItemSecondaryAction>
                                <IconButton 
                                  edge="end" 
                                  color="primary"
                                  onClick={() => handleAddMeal(meal)}
                                >
                                  <AddIcon />
                                </IconButton>
                              </ListItemSecondaryAction>
                            </ListItem>
                          ))}
                        </List>
                      )}
                    </Grid>
                  </Grid>
                )}
                
                {/* Payments Tab */}
                {editTab === 2 && (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6">Payment Methods</Typography>
                      <Typography>
                        Order Total: <strong>{formatCurrency(editableOrder.total_amount)}</strong>
                      </Typography>
                    </Box>
                    
                    {(!editableOrder.payments || editableOrder.payments.length === 0) ? (
                      <Typography color="text.secondary">No payment methods defined</Typography>
                    ) : (
                      <Grid container spacing={2}>
                        {editableOrder.payments.map((payment, index) => (
                          <Grid item xs={12} key={index}>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                              <FormControl sx={{ width: '50%' }}>
                                <InputLabel>Payment Method</InputLabel>
                                <Select
                                  value={payment.method}
                                  onChange={(e) => handlePaymentMethodChange(index, e.target.value)}
                                  label="Payment Method"
                                  size="small"
                                >
                                  <MenuItem value="cash">Cash</MenuItem>
                                  <MenuItem value="card">Credit Card</MenuItem>
                                  <MenuItem value="transfer">Bank Transfer</MenuItem>
                                  <MenuItem value="discount" sx={{ color: 'error.main' }}>Discount</MenuItem>
                                  <MenuItem value="postponed">Postponed</MenuItem>
                                </Select>
                              </FormControl>
                              
                              <TextField
                                label="Amount"
                                type="number"
                                value={payment.amount}
                                onChange={(e) => handlePaymentAmountChange(index, e.target.value)}
                                InputProps={{
                                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                }}
                                size="small"
                                sx={{ width: '40%' }}
                              />
                              
                              <IconButton
                                color="error"
                                onClick={() => handleRemovePayment(index)}
                                disabled={editableOrder.payments.length <= 1}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    )}
                    
                    {/* Add payment button */}
                    <Button
                      startIcon={<AddIcon />}
                      onClick={handleAddPayment}
                      sx={{ mt: 2 }}
                    >
                      Add Payment Method
                    </Button>
                    
                    {/* Payment validation message */}
                    {!validatePaymentTotal() && (
                      <Box sx={{ mt: 2, p: 1, bgcolor: '#fff4e5', borderRadius: 1 }}>
                        <Typography color="error">
                          Payment total must match order total of {formatCurrency(editableOrder.total_amount)}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}
              </>
            )}
          </DialogContent>
          
          <DialogActions>
            <Button onClick={handleCloseEditDialog}>Cancel</Button>
            <Button 
              onClick={saveOrderChanges} 
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={!validatePaymentTotal()}
            >
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>

        {/* Notification */}
        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert
            onClose={handleCloseNotification}
            severity={notification.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default OrdersManagement;