import React, { useState, useEffect } from "react";
import {
  TextField,
  Paper,
  Typography,
  Button,
  Box,
  FormControlLabel,
  Switch,
  CircularProgress
} from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
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
    L: "MM/DD/YYYY", // Default format
    LL: "MMMM D, YYYY", // Long format
  }
});

const AccountantReports = () => {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [fromDate, setFromDate] = useState(dayjs().subtract(7, 'day'));
  const [toDate, setToDate] = useState(dayjs());
  const [useRange, setUseRange] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({ totalTickets: 0, totalRevenue: 0 });
  
  // Use MM/DD/YYYY for display but keep YYYY-MM-DD for API
  const formatDisplayDate = (date) => date.format("MM/DD/YYYY");
  const formatApiDate = (date) => date.format("YYYY-MM-DD");

  const baseUrl = window.runtimeConfig?.apiBaseUrl;

  const fetchReport = async (shouldFetch = true) => {
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
        notify.success("Report data loaded successfully");
      } else {
        // Calculate summary on frontend
        const reportItems = Array.isArray(data) ? data : [];
        setReportData(reportItems);
        setSummary(calculateSummary(reportItems));
        notify.success("Report data loaded successfully");
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      const errorMessage = "Failed to fetch report data. Please try again.";
      setError(errorMessage);
      notify.error(errorMessage);
      setReportData([]);
      setSummary({ totalTickets: 0, totalRevenue: 0, totalDiscounts: 0 });
    } finally {
      setLoading(false);
    }
  };

  // Use effect with debounce for date changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReport();
    }, 500); // Wait 500ms after last change before fetching
    
    return () => clearTimeout(timer);
  }, [selectedDate, fromDate, toDate, useRange, baseUrl]);

  const exportCSV = () => {
    if (reportData.length === 0) return;

    // Helper function to escape CSV fields properly
    const escapeCSV = (field) => {
      if (field === null || field === undefined) return '';
      const str = String(field);
      // If the field contains quotes, commas, or newlines, wrap in quotes and escape internal quotes
      if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    let csvContent = "\uFEFF"; // BOM for Excel UTF-8
    csvContent += useRange
      ? `Report from ${formatDisplayDate(fromDate)} to ${formatDisplayDate(toDate)}\r\n\r\n`
      : `Report for ${formatDisplayDate(selectedDate)}\r\n\r\n`;

    // Create a CSV for orders
    csvContent += "Order ID,Order Date,User,Total Amount (EGP),Ticket Details,Meal Details,Payment Methods\r\n";
    
    reportData.forEach(order => {
      // Basic order info
      const orderId = order.order_id || 'N/A';
      const orderDate = order.created_at ? new Date(order.created_at).toLocaleString() : 'N/A';
      const userName = order.user_name || 'N/A';
      const totalAmount = parseFloat(order.total_amount || 0).toFixed(2);
      
      // Process tickets into a single detailed string
      let ticketDetails = '';
      if (order.tickets && order.tickets.length > 0) {
        const ticketInfoArray = order.tickets.map(t => {
          const category = t.category || 'Unknown';
          const subcategory = t.subcategory || 'Standard';
          const price = parseFloat(t.sold_price || 0).toFixed(2);
          const qty = t.quantity || 1;
          const subtotal = (qty * parseFloat(t.sold_price || 0)).toFixed(2);
          
          return `${qty}x ${category}-${subcategory} @${price} = ${subtotal}`;
        });
        
        ticketDetails = ticketInfoArray.join(' | ');
      } else {
        ticketDetails = 'No tickets';
      }
      
      // Process meals into a single detailed string
      let mealDetails = '';
      if (order.meals && order.meals.length > 0) {
        const mealInfoArray = order.meals.map(m => {
          const name = m.name || 'Unknown';
          const price = parseFloat(m.price_at_order || 0).toFixed(2);
          const qty = m.quantity || 1;
          const subtotal = (qty * parseFloat(m.price_at_order || 0)).toFixed(2);
          
          return `${qty}x ${name} @${price} = ${subtotal}`;
        });
        
        mealDetails = mealInfoArray.join(' | ');
      } else {
        mealDetails = 'No meals';
      }
      
      // Process payment methods
      const paymentMethods = order.payments && order.payments.length > 0 
        ? order.payments.map(p => `${p.method || 'Unknown'}: ${parseFloat(p.amount || 0).toFixed(2)}`).join(' | ')
        : 'No payments';
      
      // Combine all fields into a CSV row with proper escaping
      csvContent += `${escapeCSV(orderId)},${escapeCSV(orderDate)},${escapeCSV(userName)},${escapeCSV(totalAmount)},${escapeCSV(ticketDetails)},${escapeCSV(mealDetails)},${escapeCSV(paymentMethods)}\r\n`;
    });
    
    // Add a summary section at the end
    csvContent += `\r\n\r\nSUMMARY REPORT\r\n`;
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
      ? `Report_from_${formatApiDate(fromDate)}_to_${formatApiDate(toDate)}.csv`
      : `Report_${formatApiDate(selectedDate)}.csv`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, filename);
  };

  const handleRefresh = () => {
    fetchReport(true);
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

  // Modify the calculation of totals to properly handle discounts
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

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Paper sx={{ 
        maxHeight: "calc(100vh - 120px)", 
        height: "100%", 
        p: 3, 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        backgroundColor: "#F0F9FF", 
        borderRadius: 2 
      }}>
        <Typography variant="h4" sx={{ mb: 3, color: "#007EA7", fontWeight: 600 }}>
          Orders Report
        </Typography>

        {/* Date picker section */}
        <Box display="flex" gap={4} mb={2}>
          <FormControlLabel
            control={
              <Switch 
                checked={useRange} 
                onChange={(e) => setUseRange(e.target.checked)}
                color="primary"
              />
            }
            label={useRange ? "Using Date Range" : "Using Single Date"}
          />
        </Box>

        {useRange ? (
          <Box display="flex" gap={2} mb={3}>
            <DatePicker 
              label="From" 
              value={fromDate} 
              onChange={handleFromDateChange}
              inputFormat="MM/DD/YYYY"
              slotProps={{ 
                textField: { 
                  sx: { backgroundColor: "#fff" },
                  placeholder: "MM/DD/YYYY"
                } 
              }}
            />
            <DatePicker 
              label="To" 
              value={toDate} 
              onChange={handleToDateChange}
              inputFormat="MM/DD/YYYY"
              slotProps={{ 
                textField: { 
                  sx: { backgroundColor: "#fff" },
                  placeholder: "MM/DD/YYYY"
                } 
              }}
            />
            <Button 
              variant="contained" 
              onClick={handleRefresh}
              disabled={loading}
              sx={{ ml: 1 }}
            >
              Refresh
            </Button>
          </Box>
        ) : (
          <Box display="flex" alignItems="center" mb={3} gap={2}>
            <DatePicker 
              label="Select Date" 
              value={selectedDate} 
              onChange={(newVal) => newVal && setSelectedDate(newVal)}
              inputFormat="MM/DD/YYYY"
              slotProps={{ 
                textField: { 
                  sx: { backgroundColor: "#fff" },
                  placeholder: "MM/DD/YYYY"
                } 
              }}
            />
            <Button 
              variant="contained" 
              onClick={handleRefresh}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>
        )}

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <Box sx={{ 
          width: "100%", 
          maxWidth: "1200px", 
          flex: 1, 
          overflowY: "auto", 
          maxHeight: "calc(100vh - 300px)", 
          borderRadius: "8px", 
          background: "#fff", 
          boxShadow: "0 2px 8px rgba(0, 174, 239, 0.2)",
          display: "flex",
          justifyContent: "center",
          alignItems: loading ? "center" : "flex-start"
        }}>
          {loading ? (
            <CircularProgress />
          ) : reportData.length === 0 ? (
            <Typography variant="body1" sx={{ p: 4, textAlign: "center", color: "#666" }}>
              No data available for the selected period
            </Typography>
          ) : (
            <OrdersTable data={reportData} />
          )}
        </Box>

        <Paper sx={{ 
          width: "100%", 
          mt: 3, 
          background: "#E0F7FF", 
          color: "#007EA7", 
          borderRadius: 2, 
          p: 2, 
          textAlign: "center", 
          boxShadow: "0 -2px 5px rgba(0,0,0,0.05)" 
        }}>
          <Typography variant="body1">
            <b>Total Orders:</b> {reportData.length}
          </Typography>
          <Typography variant="body1">
            <b>Total Tickets Sold:</b> {summary.totalTickets}
          </Typography>
          <Typography variant="body1">
            <b>Total Revenue:</b> EGP {summary.totalRevenue.toFixed(2)}
          </Typography>
          {summary.totalDiscounts > 0 && (
            <Typography variant="body1" sx={{ color: 'error.main' }}>
              <b>Total Discounts Applied:</b> EGP {summary.totalDiscounts.toFixed(2)}
            </Typography>
          )}
          <Button
            variant="contained"
            disabled={reportData.length === 0 || loading}
            sx={{ 
              mt: 2, 
              backgroundColor: reportData.length === 0 || loading ? '#ccc' : '#00AEEF', 
              color: reportData.length === 0 || loading ? '#666' : '#fff', 
              '&:hover': reportData.length === 0 || loading ? {} : { backgroundColor: '#00C2CB' }
            }}
            onClick={exportCSV}
          >
            {loading ? "Loading..." : "Export as CSV"}
          </Button>
        </Paper>
      </Paper>
    </LocalizationProvider>
  );
};

export default AccountantReports;