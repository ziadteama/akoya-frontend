import React, { useState, useEffect } from "react";
import {
  TextField,
  Paper,
  Typography,
  Button,
  Box,
  FormControlLabel,
  Switch
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
  const [fromDate, setFromDate] = useState(dayjs());
  const [toDate, setToDate] = useState(dayjs());
  const [useRange, setUseRange] = useState(false);
  const [useOrders, setUseOrders] = useState(false);
  const [reportData, setReportData] = useState([]);

  const fetchReport = async () => {
    if (useRange && fromDate.isAfter(toDate)) return;
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
      setReportData(data);
    } catch (error) {
      console.error("Error fetching report:", error);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedDate, fromDate, toDate, useRange, useOrders]);

  const totalRevenue = reportData.reduce((sum, row) => {
    if (useOrders) return sum + Number(row.total_amount || 0);
    return sum + Number(row.total_revenue || 0);
  }, 0);

  const totalTicketsSold = useOrders
    ? reportData.reduce((sum, row) => sum + (row.tickets?.length || 0), 0)
    : reportData.reduce((sum, row) => sum + Number(row.total_tickets || 0), 0);

  const exportCSV = () => {
    if (reportData.length === 0) return;
    let csvContent = "﻿";
    csvContent += useRange
      ? `From: ${fromDate.format("YYYY-MM-DD")}\nTo: ${toDate.format("YYYY-MM-DD")}\n`
      : `Date: ${selectedDate.format("YYYY-MM-DD")}\n`;

    if (useOrders) {
      csvContent += "Order ID,User,Created At,Tickets,Meals,Total\n";
      reportData.forEach(order => {
        const ticketList = order.tickets?.map((t, i) => `${t.subcategory}-${t.category} (${t.sold_price} EGP)` + (i < order.tickets.length - 1 ? '; ' : '')).join('') || "";
        const mealList = order.meals?.map((m, i) => `${m.quantity}x ${m.name} (${m.price_at_order} EGP)` + (i < order.meals.length - 1 ? '; ' : '')).join('') || "";
        csvContent += `${order.order_id},${order.user_name},${order.created_at},"${ticketList}","${mealList}",${order.total_amount}\n`;
      });
    } else {
      csvContent += "Category,Subcategory,Tickets Sold,Total Revenue\n";
      reportData.forEach(row => {
        csvContent += `${row.category},${row.subcategory},${row.total_tickets},${row.total_revenue}\n`;
      });
    }

    const filename = useRange
      ? `Report_from_${fromDate.format("YYYY-MM-DD")}_to_${toDate.format("YYYY-MM-DD")}.csv`
      : `Report_${selectedDate.format("YYYY-MM-DD")}.csv`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, filename);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Paper sx={{ maxHeight: "calc(100vh - 120px)", height: "100%", p: 3, display: "flex", flexDirection: "column", alignItems: "center", backgroundColor: "#F0F9FF", borderRadius: 2 }}>
        <Typography variant="h4" sx={{ mb: 3, color: "#007EA7", fontWeight: 600 }}>
          Reports
        </Typography>

        <Box display="flex" gap={4} mb={2}>
          <FormControlLabel
            control={<Switch checked={useRange} onChange={(e) => setUseRange(e.target.checked)} />}
            label={useRange ? "Using Date Range" : "Using Single Date"}
          />
          <FormControlLabel
            control={<Switch checked={useOrders} onChange={(e) => setUseOrders(e.target.checked)} />}
            label={useOrders ? "Orders Mode" : "Tickets Mode"}
          />
        </Box>

        {useRange ? (
          <Box display="flex" gap={2} mb={3}>
            <DatePicker label="From" value={fromDate} onChange={(newVal) => { if (newVal.isAfter(toDate)) setToDate(newVal); setFromDate(newVal); fetchReport(); }} />
            <DatePicker label="To" value={toDate} onChange={(newVal) => { if (fromDate.isAfter(newVal)) setFromDate(newVal); setToDate(newVal); fetchReport(); }} />
          </Box>
        ) : (
          <DatePicker label="Select Date" value={selectedDate} onChange={(newVal) => setSelectedDate(newVal)} sx={{ mb: 3, backgroundColor: "#fff", borderRadius: 1 }} />
        )}

        <Box sx={{ width: "100%", maxWidth: "1200px", flex: 1, overflowY: "auto", maxHeight: "calc(100vh - 300px)", borderRadius: "8px", background: "#fff", boxShadow: "0 2px 8px rgba(0, 174, 239, 0.2)" }}>
          {useOrders ? <OrdersTable data={reportData} /> : <TicketsTable data={reportData} />}
        </Box>

        <Paper sx={{ width: "100%", mt: 3, background: "#E0F7FF", color: "#007EA7", borderRadius: 2, p: 2, textAlign: "center", boxShadow: "0 -2px 5px rgba(0,0,0,0.05)" }}>
          <Typography variant="body1">
            <b>Total Tickets Sold:</b> {totalTicketsSold}
          </Typography>
          <Typography variant="body1">
            <b>Total Revenue:</b> ${totalRevenue.toFixed(2)}
          </Typography>
          <Button
            variant="contained"
            disabled={reportData.length === 0}
            sx={{ mt: 2, backgroundColor: reportData.length === 0 ? '#ccc' : '#00AEEF', color: reportData.length === 0 ? '#666' : '#fff', '&:hover': reportData.length === 0 ? {} : { backgroundColor: '#00C2CB' }, cursor: reportData.length === 0 ? 'not-allowed' : 'pointer' }}
            onClick={exportCSV}
          >
            Export as CSV
          </Button>
        </Paper>
      </Paper>
    </LocalizationProvider>
  );
};

export default AccountantReports;
