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
  Box,
  FormControlLabel,
  Switch
} from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import axios from "axios";
import dayjs from "dayjs";
import { saveAs } from "file-saver";

const AccountantReports = () => {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [fromDate, setFromDate] = useState(dayjs());
  const [toDate, setToDate] = useState(dayjs());
  const [useRange, setUseRange] = useState(false);
  const [reportData, setReportData] = useState([]);

  const fetchReport = async () => {
    try {
      const params = useRange
        ? { startDate: fromDate.format("YYYY-MM-DD"), endDate: toDate.format("YYYY-MM-DD") }
        : { date: selectedDate.format("YYYY-MM-DD") };

      const endpoint = useRange
        ? "http://localhost:3000/api/tickets/between-dates-report"
        : "http://localhost:3000/api/tickets/day-report";

      const { data } = await axios.get(endpoint, { params });
      console.log("Report Data:", data);
      setReportData(data);
    } catch (error) {
      console.error("Error fetching report:", error);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedDate, fromDate, toDate, useRange]);

  const groupedData = reportData.reduce((acc, row) => {
  const key = row.category || "Uncategorized";
  if (!acc[key]) acc[key] = [];
  acc[key].push(row);
  return acc;
}, {});

  const totalRevenue = reportData.reduce((sum, row) => sum + Number(row.total_revenue || 0), 0);
  const totalTicketsSold = reportData.reduce((sum, row) => sum + Number(row.total_tickets || 0), 0);

  const exportCSV = () => {
    let csvContent = "\uFEFFCategory,Subcategory,Tickets Sold,Total Revenue\n";
    reportData.forEach((row) => {
      csvContent += `${row.category},${row.subcategory},${row.total_tickets},${row.total_revenue}\n`;
    });
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const filename = useRange
      ? `Report_${fromDate.format("YYYY-MM-DD")}_to_${toDate.format("YYYY-MM-DD")}.csv`
      : `Report_${selectedDate.format("YYYY-MM-DD")}.csv`;
    saveAs(blob, filename);
  };

  const zebraColors = ["#E4F8FC", "#D1F2F5"];

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Paper
        sx={{
          maxHeight: "calc(100vh - 120px)",
          height: "100%",
          p: 3,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          backgroundColor: "#F0F9FF",
          borderRadius: 2,
        }}
      >
        <Typography variant="h4" sx={{ mb: 3, color: "#007EA7", fontWeight: 600 }}>
          Day Reports
        </Typography>

        <FormControlLabel
          control={<Switch checked={useRange} onChange={(e) => setUseRange(e.target.checked)} />}
          label={useRange ? "Using Date Range" : "Using Single Date"}
          sx={{ mb: 2 }}
        />

        {useRange ? (
          <Box display="flex" gap={2} mb={3}>
            <DatePicker label="From" value={fromDate} onChange={(newVal) => { setFromDate(newVal); fetchReport(); }} />
            <DatePicker label="To" value={toDate} onChange={(newVal) => { setToDate(newVal); fetchReport(); }} />
          </Box>
        ) : (
          <DatePicker
            label="Select Date"
            value={selectedDate}
            onChange={(newVal) => setSelectedDate(newVal)}
            sx={{ mb: 3, backgroundColor: "#fff", borderRadius: 1 }}
          />
        )}

        <div
          style={{
            width: "100%",
            maxWidth: "1200px",
            flex: 1,
            overflowY: "auto",
            maxHeight: "calc(100vh - 300px)",
            borderRadius: "8px",
            background: "#fff",
            boxShadow: "0 2px 8px rgba(0, 174, 239, 0.2)",
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
                      sx={{ fontWeight: "bold", color: "#fff", backgroundColor: "#00AEEF", fontSize: "1.2rem" }}
                    >
                      {header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.keys(groupedData).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No Data Available
                    </TableCell>
                  </TableRow>
                ) : (
                  Object.entries(groupedData).map(([category, subcategories], categoryIndex) => (
                    <React.Fragment key={categoryIndex}>
                      {subcategories.map((row, subIndex) => {
                        const bgColor = zebraColors[categoryIndex % 2];
                        return (
                          <TableRow
                            key={`${category}-${subIndex}-${row.subcategory}`}
                            sx={{ backgroundColor: bgColor }}
                          >
                            {subIndex === 0 ? (
                              <TableCell
                                rowSpan={subcategories.length}
                                align="center"
                                sx={{
                                  fontWeight: "bold",
                                  fontSize: "1.1rem",
                                  backgroundColor: "#00C2CB",
                                  color: "#fff",
                                  borderRight: "1px solid #ccc",
                                }}
                              >
                                {category}
                              </TableCell>
                            ) : null}
                            <TableCell align="center">{row.subcategory}</TableCell>
                            <TableCell align="center">{Number(row.total_tickets || 0)}</TableCell>
                            <TableCell align="center" sx={{ fontWeight: "bold", color: "#00A651" }}>
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
            width: "100%",
            mt: 3,
            background: "#E0F7FF",
            color: "#007EA7",
            borderRadius: 2,
            p: 2,
            textAlign: "center",
            boxShadow: "0 -2px 5px rgba(0,0,0,0.05)",
          }}
        >
          <Typography variant="body1">
            <b>Total Tickets Sold:</b> {totalTicketsSold}
          </Typography>
          <Typography variant="body1">
            <b>Total Revenue:</b> ${totalRevenue.toFixed(2)}
          </Typography>
          <Button
            variant="contained"
            sx={{ mt: 2, backgroundColor: "#00AEEF", "&:hover": { backgroundColor: "#00C2CB" } }}
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
