import React, { useState, useEffect } from "react";
import {
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Button,
} from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import axios from "axios";
import dayjs from "dayjs";
import { saveAs } from "file-saver";

const AccountantReports = () => {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [reportData, setReportData] = useState([]);

  // Fetch report data
  const fetchReport = async (date) => {
    console.log("Fetching report for date:", date);
    try {
      const { data } = await axios.get("http://localhost:3000/api/tickets/day-report", {
        params: { date },
      });
      setReportData(data);
    } catch (error) {
      console.error("Error fetching report:", error);
    }
  };

  useEffect(() => {
    fetchReport(selectedDate.format("YYYY-MM-DD"));
  }, [selectedDate]);

  // Group report data by category
  const groupedData = reportData.reduce((acc, row) => {
    if (!acc[row.category]) {
      acc[row.category] = [];
    }
    acc[row.category].push(row);
    return acc;
  }, {});

  // Calculate totals
  const totalRevenue = reportData.reduce((sum, row) => sum + Number(row.total_revenue || 0), 0);
  const totalTicketsSold = reportData.reduce((sum, row) => sum + Number(row.total_tickets || 0), 0);

  // Export CSV
  const exportCSV = () => {
    let csvContent = "Category,Subcategory,Tickets Sold,Total Revenue\n";
    reportData.forEach((row) => {
      csvContent += `${row.category},${row.subcategory},${row.total_tickets},${row.total_revenue}\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `Report_${selectedDate.format("YYYY-MM-DD")}.csv`);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Paper
        sx={{
          width: "80vw",
          height: "90vh",
          padding: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "start",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <Typography variant="h4" sx={{ marginBottom: 2 }}>Day Reports</Typography>

        {/* Date Picker */}
        <DatePicker
          label="Select Date"
          value={selectedDate}
          onChange={(newValue) => setSelectedDate(newValue)}
          renderInput={(params) => <TextField {...params} />}
          sx={{ marginBottom: 2 }}
        />

        {/* Table Container with vertical scrolling */}
        <TableContainer
          component={Paper}
          sx={{
            width: "100%",
            maxHeight: "65vh",
            overflowY: "auto",
            overflowX: "hidden",
            marginBottom: "60px",
          }}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell><b>Category</b></TableCell>
                <TableCell><b>Subcategory</b></TableCell>
                <TableCell><b>Tickets Sold</b></TableCell>
                <TableCell><b>Total Revenue</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.keys(groupedData).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">No Data Available</TableCell>
                </TableRow>
              ) : (
                Object.entries(groupedData).map(([category, subcategories], categoryIndex) => (
                  subcategories.map((row, subIndex) => (
                    <TableRow key={`${categoryIndex}-${subIndex}`}>
                      {subIndex === 0 ? (
                        <TableCell
                          rowSpan={subcategories.length}
                          sx={{
                            fontWeight: "bold",
                            fontSize: "1.2rem",
                            textAlign: "center",
                            verticalAlign: "middle",
                          }}
                        >
                          {category}
                        </TableCell>
                      ) : null}
                      <TableCell>{row.subcategory}</TableCell>
                      <TableCell>{Number(row.total_tickets || 0)}</TableCell>
                      <TableCell>${Number(row.total_revenue || 0).toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Fixed Summary Section */}
        <Paper
          sx={{
            width: "100%",
            maxWidth: "80vw",
            padding: 2,
            textAlign: "center",
            position: "fixed",
            bottom: 0,
            left: "50%",
            transform: "translateX(-50%)",
            background: "white",
            boxShadow: "0 -2px 5px rgba(0,0,0,0.1)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Typography variant="h6">Summary</Typography>
          <Typography variant="body1"><b>Total Tickets Sold:</b> {totalTicketsSold}</Typography>
          <Typography variant="body1"><b>Total Revenue:</b> ${totalRevenue.toFixed(2)}</Typography>
          <Button
            variant="contained"
            color="primary"
            sx={{ marginTop: 1 }}
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
