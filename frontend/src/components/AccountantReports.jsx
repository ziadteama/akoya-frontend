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

  const fetchReport = async (date) => {
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

  const groupedData = reportData.reduce((acc, row) => {
    if (!acc[row.category]) {
      acc[row.category] = [];
    }
    acc[row.category].push(row);
    return acc;
  }, {});

  const totalRevenue = reportData.reduce((sum, row) => sum + Number(row.total_revenue || 0), 0);
  const totalTicketsSold = reportData.reduce((sum, row) => sum + Number(row.total_tickets || 0), 0);

  const exportCSV = () => {
    let csvContent = "\uFEFFCategory,Subcategory,Tickets Sold,Total Revenue\n"; // UTF-8 BOM added
  
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
          maxHeight: "calc(100vh - 250px)", // Ensures the summary is always visible
          height: "100vh",
          padding: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "start",
          overflow: "hidden",
          marginBottom: 0,
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

        {/* Scrollable Table - max height so summary is always visible */}
        <div
          style={{
            width: "90vw",
            maxWidth: "1200px",
            flex: 1,
            overflowY: "auto",
            maxHeight: "calc(100vh - 250px)", // Ensures the summary is always visible
            borderRadius: "8px",
            border: "1px solid #ccc",
            background: "#fff",
          }}
        >
          <TableContainer>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  {["Category", "Subcategory", "Tickets Sold", "Total Revenue"].map((header) => (
                    <TableCell
                      key={header}
                      align="center"
                      sx={{ borderBottom: "2px solid #000", fontWeight: "bold" }}
                    >
                      {header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.keys(groupedData).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">No Data Available</TableCell>
                  </TableRow>
                ) : (
                  Object.entries(groupedData).map(([category, subcategories], categoryIndex) => (
                    <React.Fragment key={categoryIndex}>
                      {subcategories.map((row, subIndex) => (
                        <TableRow key={`${categoryIndex}-${subIndex}`} sx={{ borderBottom: "1px solid #ccc" }}>
                          {subIndex === 0 ? (
                            <TableCell
                              rowSpan={subcategories.length}
                              align="center"
                              sx={{
                                fontWeight: "bold",
                                fontSize: "1.2rem",
                                textAlign: "center",
                                verticalAlign: "middle",
                                backgroundColor: "#bbb",
                                color: "#000",
                                borderRight: "1px solid #999",
                              }}
                            >
                              {category}
                            </TableCell>
                          ) : null}
                          <TableCell align="center" sx={{ borderRight: "1px solid #999" }}>{row.subcategory}</TableCell>
                          <TableCell align="center" sx={{ borderRight: "1px solid #999" }}>{Number(row.total_tickets || 0)}</TableCell>
                          <TableCell align="center">${Number(row.total_revenue || 0).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </div>

        {/* Fixed Summary at the Bottom (Never Hidden) */}
        <Paper
          sx={{
            width: "100vw",
            padding: 2,
            textAlign: "center",
            background: "white",
            boxShadow: "0 -2px 5px rgba(0,0,0,0.1)",
            height: "100px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            border: "1px solid #ccc",
            bottom: 5,
            position: "absolute ",
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
