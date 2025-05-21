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
import TicketsTable from "./TicketsTable";
import OrdersTable from "./OrdersTable";

const AccountantReports = () => {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [fromDate, setFromDate] = useState(dayjs().subtract(7, 'day'));
  const [toDate, setToDate] = useState(dayjs());
  const [useRange, setUseRange] = useState(false);
  const [useOrders, setUseOrders] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReport = async () => {
    if (useRange && fromDate.isAfter(toDate)) {
      setError("Start date cannot be after end date");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const params = useOrders
        ? useRange
          ? { startDate: fromDate.format("YYYY-MM-DD"), endDate: toDate.format("YYYY-MM-DD") }
          : { date: selectedDate.format("YYYY-MM-DD") }
        : useRange
          ? { startDate: fromDate.format("YYYY-MM-DD"), endDate: toDate.format("YYYY-MM-DD") }
          : { date: selectedDate.format("YYYY-MM-DD") };
          
      const endpoint = useOrders
        ? useRange
          ? "http://localhost:3000/api/orders/range-report"
          : "http://localhost:3000/api/orders/day-report"
        : useRange
          ? "http://localhost:3000/api/tickets/between-dates-report"
          : "http://localhost:3000/api/tickets/day-report";
          
      const { data } = await axios.get(endpoint, { params });
      setReportData(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching report:", error);
      setError("Failed to fetch report data. Please try again.");
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedDate, fromDate, toDate, useRange, useOrders]);

  const totalRevenue = reportData.reduce((sum, row) => {
    if (useOrders) {
      return sum + (Number(row.total_amount) || 0);
    }
    return sum + (Number(row.total_revenue) || 0);
  }, 0);

  const totalTicketsSold = useOrders
    ? reportData.reduce((sum, row) => sum + ((row.tickets && row.tickets.length) || 0), 0)
    : reportData.reduce((sum, row) => sum + (Number(row.total_tickets) || 0), 0);

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
      ? `Report from ${fromDate.format("YYYY-MM-DD")} to ${toDate.format("YYYY-MM-DD")}\r\n\r\n`
      : `Report for ${selectedDate.format("YYYY-MM-DD")}\r\n\r\n`;

    if (useOrders) {
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
      csvContent += `Total Revenue,${reportData.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0).toFixed(2)}\r\n`;
      
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
      csvContent += `Category,Quantity,Revenue\r\n`;
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
      csvContent += `Meal Type,Quantity,Revenue\r\n`;
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
      csvContent += `Payment Method,Total Amount\r\n`;
      Object.entries(paymentsByMethod).forEach(([method, amount]) => {
        csvContent += `${escapeCSV(method)},${amount.toFixed(2)}\r\n`;
      });
      
    } else {
      // For tickets mode, use a similar format to orders for consistency
      csvContent += "Category,Subcategory,Tickets Sold,Total Revenue (EGP),Details\r\n";
      
      reportData.forEach(row => {
        const category = row.category || 'Unknown';
        const subcategory = row.subcategory || 'Standard';
        const ticketCount = row.total_tickets || 0;
        const revenue = parseFloat(row.total_revenue || 0).toFixed(2);
        const details = `${ticketCount} tickets sold at average price ${(revenue / (ticketCount || 1)).toFixed(2)}`;
        
        csvContent += `${escapeCSV(category)},${escapeCSV(subcategory)},${ticketCount},${revenue},${escapeCSV(details)}\r\n`;
      });
      
      // Add summary section similar to orders report
      csvContent += `\r\n\r\nSUMMARY REPORT\r\n`;
      csvContent += `Total Categories,${reportData.length}\r\n`;
      csvContent += `Total Tickets Sold,${reportData.reduce((sum, row) => sum + (Number(row.total_tickets) || 0), 0)}\r\n`;
      csvContent += `Total Revenue,${reportData.reduce((sum, row) => sum + parseFloat(row.total_revenue || 0), 0).toFixed(2)}\r\n`;
      
      // Breakdown by category
      csvContent += `\r\nCATEGORY BREAKDOWN\r\n`;
      csvContent += `Category,Tickets Sold,Revenue,Percentage of Total\r\n`;
      
      const categoryTotals = {};
      const totalRevenueAll = reportData.reduce((sum, row) => sum + parseFloat(row.total_revenue || 0), 0);
      
      reportData.forEach(row => {
        const category = row.category || 'Unknown';
        
        if (!categoryTotals[category]) {
          categoryTotals[category] = {
            tickets: 0,
            revenue: 0
          };
        }
        
        categoryTotals[category].tickets += (Number(row.total_tickets) || 0);
        categoryTotals[category].revenue += parseFloat(row.total_revenue || 0);
      });
      
      Object.entries(categoryTotals).forEach(([category, data]) => {
        const percentage = ((data.revenue / totalRevenueAll) * 100).toFixed(2);
        csvContent += `${escapeCSV(category)},${data.tickets},${data.revenue.toFixed(2)},${percentage}%\r\n`;
      });
      
      // Breakdown by subcategory within each category
      csvContent += `\r\nSUBCATEGORY BREAKDOWN\r\n`;
      csvContent += `Category,Subcategory,Tickets Sold,Revenue\r\n`;
      
      reportData.forEach(row => {
        const category = row.category || 'Unknown';
        const subcategory = row.subcategory || 'Standard';
        const tickets = Number(row.total_tickets) || 0;
        const revenue = parseFloat(row.total_revenue || 0).toFixed(2);
        
        csvContent += `${escapeCSV(category)},${escapeCSV(subcategory)},${tickets},${revenue}\r\n`;
      });
    }

    const filename = useRange
      ? `Report_from_${fromDate.format("YYYY-MM-DD")}_to_${toDate.format("YYYY-MM-DD")}.csv`
      : `Report_${selectedDate.format("YYYY-MM-DD")}.csv`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, filename);
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
          Reports
        </Typography>

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
          <FormControlLabel
            control={
              <Switch 
                checked={useOrders} 
                onChange={(e) => setUseOrders(e.target.checked)}
                color="primary"
              />
            }
            label={useOrders ? "Orders Mode" : "Tickets Mode"}
          />
        </Box>

        {useRange ? (
          <Box display="flex" gap={2} mb={3}>
            <DatePicker 
              label="From" 
              value={fromDate} 
              onChange={handleFromDateChange}
              slotProps={{ textField: { sx: { backgroundColor: "#fff" } } }}
            />
            <DatePicker 
              label="To" 
              value={toDate} 
              onChange={handleToDateChange}
              slotProps={{ textField: { sx: { backgroundColor: "#fff" } } }} 
            />
          </Box>
        ) : (
          <DatePicker 
            label="Select Date" 
            value={selectedDate} 
            onChange={(newVal) => newVal && setSelectedDate(newVal)} 
            sx={{ mb: 3 }}
            slotProps={{ textField: { sx: { backgroundColor: "#fff" } } }}
          />
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
            useOrders ? <OrdersTable data={reportData} /> : <TicketsTable data={reportData} />
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
            <b>Total Tickets Sold:</b> {totalTicketsSold}
          </Typography>
          <Typography variant="body1">
            <b>Total Revenue:</b> ${totalRevenue.toFixed(2)}
          </Typography>
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