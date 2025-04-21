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

  // Define alternating colors
  const colors = ["#f8f9fa", "#e9ecef"];
  const subcategoryColors = new Map();
  let colorIndex = 0;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Paper
        sx={{
          maxHeight: "calc(100vh - 200px)",
          height: "100vh",
          padding: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          backgroundColor: "#f4f6f8",
          borderRadius: 2,
        }}
      >
        <Typography variant="h4" sx={{ marginBottom: 2, color: "#333" }}>
          Day Reports
        </Typography>

        <DatePicker
          label="Select Date"
          value={selectedDate}
          onChange={(newValue) => setSelectedDate(newValue)}
          renderInput={(params) => <TextField {...params} />}
          sx={{ marginBottom: 2, backgroundColor: "#fff", borderRadius: 1 }}
        />

        <div
          style={{
            width: "90vw",
            maxWidth: "1200px",
            flex: 1,
            overflowY: "auto",
            maxHeight: "calc(100vh - 250px)",
            borderRadius: "8px",
            background: "#fff",
            boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
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
                      sx={{ fontWeight: "bold", color: "#fff", backgroundColor: "#9C9EA1",fontSize: "1.4rem" }}
                    >
                      {header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.keys(groupedData).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" >
                      No Data Available
                    </TableCell>
                  </TableRow>
                ) : (
                  Object.entries(groupedData).map(([category, subcategories], categoryIndex) => (
                    <React.Fragment key={categoryIndex}>
                      {subcategories.map((row, subIndex) => {
                        // Assign a color per unique subcategory
                        if (!subcategoryColors.has(row.subcategory)) {
                          subcategoryColors.set(row.subcategory, colors[colorIndex % 2]);
                        }
                        const bgColor = subcategoryColors.get(row.subcategory);

                        return (
                          <TableRow
                            key={`${categoryIndex}-${subIndex}`}
                            sx={{ backgroundColor: bgColor }}
                          >
                            {subIndex === 0 ? (
                              <TableCell
                                rowSpan={subcategories.length}
                                align="center"
                                sx={{
                                  fontWeight: "bold",
                                  fontSize: "1.3rem",
                                  textAlign: "center",
                                  backgroundColor: "#BCBFC2",
                                  color: "#1B1C1C",
                                  borderRight: "1px solid #999",
                                }}
                              >
                                {category}
                              </TableCell>
                            ) : null}
                            <TableCell align="center" sx={{ borderRight: "1px solid #999" }}>
                              {row.subcategory}
                            </TableCell>
                            <TableCell align="center" sx={{ borderRight: "1px solid #999" }}>
                              {Number(row.total_tickets || 0)}
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: "bold", color: "#27ae60" }}>
                              ${Number(row.total_revenue || 0).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </div>

        <Paper
          sx={{
            width: "100vw",
            padding: 2,
            textAlign: "center",
            background: "#DADDE4",
            color: "#000",
            boxShadow: "0 -2px 5px rgba(0,0,0,0.1)",
            height: "100px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            bottom: 5,
            position: "absolute",
          }}
        >
          <Typography variant="body1">
            <b>Total Tickets Sold:</b> {totalTicketsSold}
          </Typography>
          <Typography variant="body1">
            <b>Total Revenue:</b> ${totalRevenue.toFixed(2)}
          </Typography>
          <Button variant="contained" sx={{ marginTop: 1, backgroundColor: "#e74c3c" }} onClick={exportCSV}>
            Export as CSV
          </Button>
        </Paper>
      </Paper>
    </LocalizationProvider>
  );
};

export default AccountantReports;
