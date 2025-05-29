import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Box,
  Typography,
  Button,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  IconButton,
} from "@mui/material";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import PrintIcon from '@mui/icons-material/Print';
import SettingsIcon from '@mui/icons-material/Settings';
import axios from "axios";
import config from "../config";
import { notify } from "../utils/toast";
import { useReactToPrint } from 'react-to-print';
import AkoyaLogo from '../assets/Akoya logo RGB-1.svg'; // Make sure this path is correct for your logo

const CheckoutPanel = ({ ticketCounts, types, onCheckout, onClear, mode = "new", ticketIds = [], ticketDetails = [] }) => {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [mealCounts, setMealCounts] = useState({});
  const [meals, setMeals] = useState([]);
  const [selectedMealId, setSelectedMealId] = useState("");
  const [customMealQty, setCustomMealQty] = useState(1);

  const [selectedMethods, setSelectedMethods] = useState([]);
  const [amounts, setAmounts] = useState({ 
    visa: 0, 
    cash: 0, 
    vodafone_cash: 0, 
    postponed: 0,
    discount: 0 
  });

  // Add receipt ref for printing
  const receiptRef = useRef();

  const getAmount = (method) => amounts[method] || 0;
  const setAmount = (method, value) =>
    setAmounts((prev) => ({ ...prev, [method]: Number(value) }));

  // Normalize data to prevent errors
  const normalizedTicketCounts = ticketCounts || {};
  const normalizedTypes = types || [];
  const normalizedTicketIds = Array.isArray(ticketIds) ? ticketIds : [];
  const normalizedTicketDetails = Array.isArray(ticketDetails) ? ticketDetails : [];

  // Fetch meals data
  useEffect(() => {
    const fetchMeals = async () => {
      try {
        const response = await axios.get(`${config.apiBaseUrl}/api/meals?archived=false`);
        console.log("Meals data fetched:", response.data.slice(0, 2));
        setMeals(response.data.map(meal => ({
          ...meal,
          price: Number(meal.price || 0)  // Ensure meal prices are numbers
        })));
      } catch (error) {
        console.error("Failed to fetch meals:", error);
        notify.error("Failed to load meals data");
      }
    };
    
    fetchMeals();
  }, []);

  // Add user info
  const [cashierName, setCashierName] = useState('');

  // Get cashier name on component mount
  useEffect(() => {
    const name = localStorage.getItem("userName") || "Unknown Cashier";
    setCashierName(name);
  }, []);

  // Determine selected tickets based on mode
  const selected = useMemo(() => {
    try {
      if (mode === "existing" && normalizedTicketIds.length > 0) {
        // For existing tickets, create a representation for each ticket 
        return normalizedTicketIds.map(id => {
          // Find the matching detail for this ticket ID
          const matchingDetail = normalizedTicketDetails.find(td => td && td.id === id) || {};
          
          return {
            id,
            category: matchingDetail.category || "Ticket",
            subcategory: matchingDetail.subcategory || `ID: ${id}`,
            price: Number(matchingDetail.price || 0)
          };
        });
      } else {
        // For new tickets, filter types with counts
        return normalizedTypes.filter(t => 
          t && typeof t === 'object' && t.id && 
          Number(normalizedTicketCounts[t.id] || 0) > 0
        );
      }
    } catch (error) {
      console.error("Error in selected calculation:", error);
      return [];
    }
  }, [mode, normalizedTicketIds, normalizedTicketDetails, normalizedTypes, normalizedTicketCounts]);

  // Calculate ticket total
  const ticketTotal = useMemo(() => {
    try {
      if (mode === "existing" && Array.isArray(selected)) {
        // For existing tickets, simply sum up the individual ticket prices
        return selected.reduce((sum, ticket) => {
          if (!ticket || typeof ticket !== 'object') return sum;
          const price = Number(ticket.price || 0);
          return sum + price;
        }, 0);
      } else if (Array.isArray(selected)) {
        // For new tickets, multiply each price by quantity
        return selected.reduce((sum, ticket) => {
          if (!ticket || typeof ticket !== 'object') return sum;
          const count = Number(normalizedTicketCounts[ticket.id] || 0);
          const price = Number(ticket.price || 0);
          return sum + (count * price);
        }, 0);
      }
      return 0;
    } catch (error) {
      console.error("Error calculating ticket total:", error);
      return 0;
    }
  }, [mode, selected, normalizedTicketCounts]);

  // Calculate meal total
  const mealTotal = useMemo(() => {
    try {
      return Object.entries(mealCounts).reduce((sum, [mealId, quantity]) => {
        const meal = meals.find(m => m.id === parseInt(mealId));
        if (!meal) return sum;
        
        const price = Number(meal.price || 0);
        const qty = Number(quantity || 0);
        
        return sum + (price * qty);
      }, 0);
    } catch (error) {
      console.error("Error calculating meal total:", error);
      return 0;
    }
  }, [mealCounts, meals]);

  // Get discount amount
  const discountAmount = Number(amounts.discount || 0);

  // Calculate final total
  const finalTotal = useMemo(() => {
    const subtotal = ticketTotal + mealTotal;
    const total = Math.max(0, subtotal - discountAmount);
    return total;
  }, [ticketTotal, mealTotal, discountAmount]);

  // Check if there are any items
  const hasItems = selected.length > 0 || Object.values(mealCounts).some(qty => qty > 0);

  // Set full amount if exactly one payment method is selected (excluding discount)
  useEffect(() => {
    const paymentMethods = selectedMethods.filter(m => m !== 'discount');
    
    if (paymentMethods.length === 1 && finalTotal > 0) {
      const method = paymentMethods[0];
      setAmounts(prev => ({
        ...prev,
        [method]: finalTotal
      }));
    }
  }, [selectedMethods, finalTotal]);

  // Reset payment amounts when multiple methods are selected
  useEffect(() => {
    const paymentMethods = selectedMethods.filter(m => m !== 'discount');
    
    if (paymentMethods.length > 1) {
      setAmounts(prev => {
        const updated = { ...prev };
        paymentMethods.forEach(method => {
          updated[method] = 0;
        });
        return updated;
      });
    }
  }, [selectedMethods]);

  // Calculate entered total and remaining amount
  const enteredTotal = useMemo(() => {
    const paymentTotal = selectedMethods
      .filter(method => method !== 'discount')
      .reduce((sum, method) => sum + getAmount(method), 0);
    
    return paymentTotal;
  }, [selectedMethods, amounts]);

  const remaining = finalTotal - enteredTotal;

  // Handle adding a meal
  const handleAddMeal = () => {
    if (!selectedMealId || customMealQty <= 0) return;
    
    const mealId = parseInt(selectedMealId);
    const meal = meals.find(m => m.id === mealId);
    
    if (meal) {
      setMealCounts(prev => ({
        ...prev,
        [mealId]: (prev[mealId] || 0) + Number(customMealQty)
      }));
    }
    
    setCustomMealQty(1);
    setSelectedMealId("");
  };

  // Handle removing a meal
  const handleRemoveMeal = (mealId) => {
    setMealCounts(prev => {
      const updated = { ...prev };
      delete updated[mealId];
      return updated;
    });
  };

  const handleSubmit = () => {
    setOpen(true);
  };

  // Update the useReactToPrint hook configuration
  const printRef = useReactToPrint({
    content: () => receiptRef.current,
    onAfterPrint: () => notify.success('Receipt printed successfully using browser'),
    onPrintError: (error) => {
      console.error("Print error:", error);
      notify.error('Failed to print receipt');
    },
    removeAfterPrint: false // Keep the print iframe in DOM
  });

  // Then modify the handlePrint function to avoid calling hooks inside it
  const handlePrint = () => {
    // Check if receipt template exists
    if (!receiptRef.current) {
      console.error("Receipt template not found");
      notify.error("Receipt template not found");
      return;
    }

    // Set printing options
    const options = {
      silent: true,
      printBackground: true,
      deviceName: selectedPrinter || undefined,
      pageSize: { width: 80000, height: -1 }, // 80mm width in microns
      margins: { marginType: 'none' },
      scaleFactor: 100,
    };
    
    if (window.electron) {
      try {
        // Make sure receipt content is rendered before printing
        const receiptContent = receiptRef.current.innerHTML;
        if (!receiptContent || receiptContent.trim() === '') {
          notify.error('Empty receipt content');
          return;
        }
        
        // Use Electron for silent printing
        window.electron.print(receiptContent, options)
          .then(() => {
            notify.success('Receipt printed successfully');
          })
          .catch(error => {
            console.error("Print error:", error);
            notify.error('Failed to print with Electron, trying browser print');
            
            // Fall back to browser printing if electron print fails
            setTimeout(() => printRef(), 100); // Add slight delay before browser print
          });
      } catch (error) {
        console.error("Error preparing print job:", error);
        notify.error('Error preparing print job');
        
        // Try browser print as last resort
        setTimeout(() => printRef(), 100);
      }
    } else {
      // Use react-to-print for browser fallback
      setTimeout(() => printRef(), 100); // Add slight delay
    }
  };

  // Handle checkout confirmation
  const handleConfirm = async () => {
    try {
      const user_id = parseInt(localStorage.getItem("userId"), 10);
      if (!user_id || isNaN(user_id)) {
        notify.error("Missing or invalid user ID");
        return;
      }

      // Structure payments data
      const payments = selectedMethods
        .filter(method => method !== 'discount' && getAmount(method) > 0)
        .map(method => ({
          method,
          amount: parseFloat(getAmount(method).toFixed(2))
        }));
      
      // Add discount as a separate payment with negative amount if present
      if (discountAmount > 0) {
        payments.push({
          method: "discount",
          amount: parseFloat(discountAmount.toFixed(2))
        });
      }

      // Create the appropriate payload based on mode
      let payload = {
        user_id,
        description: description.trim(),
        payments
      };
      
      if (mode === "existing") {
        // For existing tickets (AccountantScan)
        payload.ticket_ids = normalizedTicketIds;
      } else {
        // For new tickets (CashierSellingPanel)
        payload.tickets = selected.map((t) => ({
          ticket_type_id: parseInt(t.id, 10),
          quantity: parseInt(normalizedTicketCounts[t.id], 10)
        }));
      }

      // Add meals if present
      if (Object.keys(mealCounts).length > 0) {
        payload.meals = Object.entries(mealCounts).map(([meal_id, quantity]) => {
          const meal = meals.find((m) => m.id === parseInt(meal_id));
          return {
            meal_id: parseInt(meal_id),
            quantity: parseInt(quantity, 10),
            price_at_order: meal?.price || 0
          };
        });
      }

      console.log("Submitting payload:", payload);

      // Call the onCheckout callback with the payload data
      await onCheckout(payload);
      
      // Close dialog before printing
      setOpen(false);
      
      // Reset the component state
      setDescription("");
      setSelectedMethods([]);
      setAmounts({ visa: 0, cash: 0, vodafone_cash: 0, postponed: 0, discount: 0 });
      setMealCounts({});
      
      // Add a slight delay before printing to ensure the DOM is updated
      setTimeout(() => {
        // Print receipt
        handlePrint();
      }, 300);
    } catch (error) {
      console.error("Checkout error:", error);
      notify.error("Error processing checkout");
    }
  };

  // Add this function inside the component but outside of the return statement
  const renderPaymentField = (method) => {
    // Single payment method (excluding discount) shows the final total
    const isOnlyPaymentMethod = selectedMethods.filter(m => m !== 'discount').length === 1;
    // Get the current amount for this method
    const currentAmount = getAmount(method);
    // Format display value - show empty string instead of 0
    const displayValue = isOnlyPaymentMethod 
      ? finalTotal.toFixed(2) 
      : (currentAmount === 0 ? "" : currentAmount.toString());
    
    return (
      <TextField
        key={method}
        label={method.replace("_", " ").toUpperCase()}
        type="number"
        inputProps={{ step: "any", min: 0 }}
        value={displayValue}
        onChange={(e) => {
          // Parse the value, default to empty string if input is cleared
          const inputValue = e.target.value === '' ? '' : Number(e.target.value);
          setAmount(method, inputValue === '' ? 0 : inputValue);
        }}
        disabled={isOnlyPaymentMethod}
        fullWidth
        sx={{ flexBasis: "calc(50% - 8px)", flexGrow: 1, mb: 1 }}
      />
    );
  };

  // Printer settings state
  const [printers, setPrinters] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState('');
  const [isPrinterDialogOpen, setPrinterDialogOpen] = useState(false);

  // Get available printers when component mounts
  useEffect(() => {
    // Check if running in Electron
    if (window.electron) {
      // Get available printers from Electron
      window.electron.getPrinters().then(availablePrinters => {
        setPrinters(availablePrinters);
        
        // Load saved printer from localStorage
        const savedPrinter = localStorage.getItem('selectedPrinter');
        if (savedPrinter && availablePrinters.some(p => p.name === savedPrinter)) {
          setSelectedPrinter(savedPrinter);
        } else if (availablePrinters.length > 0) {
          // Default to first printer if no saved printer or saved printer not available
          setSelectedPrinter(availablePrinters[0].name);
          localStorage.setItem('selectedPrinter', availablePrinters[0].name);
        }
      }).catch(error => {
        console.error("Error getting printers:", error);
      });
    }
  }, []);

  // Printer settings dialog
  const PrinterSettingsDialog = () => (
    <Dialog open={isPrinterDialogOpen} onClose={() => setPrinterDialogOpen(false)}>
      <DialogTitle>Receipt Printer Settings</DialogTitle>
      <DialogContent>
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel>Select Printer</InputLabel>
          <Select
            value={selectedPrinter}
            label="Select Printer"
            onChange={(e) => {
              const selected = e.target.value;
              setSelectedPrinter(selected);
              localStorage.setItem('selectedPrinter', selected);
            }}
          >
            {printers.map(printer => (
              <MenuItem key={printer.name} value={printer.name}>
                {printer.name} {printer.isDefault ? '(Default)' : ''}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Receipt will print automatically after checkout.
          Your printer selection will be remembered for future sessions.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setPrinterDialogOpen(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <>
      <Box mt={2} p={3} border="1px solid #00AEEF" borderRadius={2} bgcolor="#E0F7FF">
        <Typography variant="h6" sx={{ color: "#00AEEF", mb: 2 }}>🧾 Order Summary</Typography>

        {/* Tickets section */}
        {selected.length > 0 && (
          <>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>Tickets:</Typography>
            {selected.map((t) => (
              <Typography key={t.id} variant="body2" sx={{ mb: 0.5 }}>
                {t.category} - {t.subcategory} {mode === "new" ? `× ${normalizedTicketCounts[t.id]}` : ""} = EGP{" "}
                {mode === "new" 
                  ? (normalizedTicketCounts[t.id] * t.price).toFixed(2)
                  : t.price.toFixed(2)
                }
              </Typography>
            ))}
            <Divider sx={{ my: 1.5 }} />
          </>
        )}

        {/* Meals section */}
        <Box mt={2}>
          <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>Add Meals:</Typography>
          <FormControl fullWidth size="small" sx={{ mb: 1 }}>
            <InputLabel>Select Meal</InputLabel>
            <Select
              value={selectedMealId}
              label="Select Meal"
              onChange={(e) => setSelectedMealId(e.target.value)}
            >
              {meals.map((m) => (
                <MenuItem key={m.id} value={m.id}>
                  {m.name} — EGP {m.price.toFixed(2)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box display="flex" alignItems="center" mt={1} gap={2}>
            <TextField
              type="number"
              label="Quantity"
              size="small"
              inputProps={{ min: 1 }}
              value={customMealQty}
              onChange={(e) => setCustomMealQty(Math.max(1, parseInt(e.target.value) || 1))}
              sx={{ width: "30%" }}
            />
            <Button variant="outlined" onClick={handleAddMeal} sx={{ flexGrow: 1 }}>
              Add Meal
            </Button>
          </Box>

          <Box mt={2}>
            {Object.keys(mealCounts).length > 0 && (
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>Selected Meals:</Typography>
            )}
            {Object.entries(mealCounts).map(([id, qty]) => {
              const meal = meals.find((m) => m.id === parseInt(id));
              if (!meal) return null;
              
              return (
                <Box key={id} display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography variant="body2">
                    {meal.name} × {qty} = EGP {(meal.price * qty).toFixed(2)}
                  </Typography>
                  <IconButton 
                    onClick={() => handleRemoveMeal(id)} 
                    color="error" 
                    size="small"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              );
            })}
          </Box>
        </Box>

        {!hasItems && (
          <Typography sx={{ color: "gray", mt: 2, fontStyle: "italic" }}>
            No tickets or meals selected yet.
          </Typography>
        )}

        <Divider sx={{ my: 2 }} />
        
        {/* Totals section */}
        <Box sx={{ mb: 2 }}>
          {ticketTotal > 0 && (
            <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Tickets:</span>
              <span>EGP {ticketTotal.toFixed(2)}</span>
            </Typography>
          )}
          
          {mealTotal > 0 && (
            <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Meals:</span>
              <span>EGP {mealTotal.toFixed(2)}</span>
            </Typography>
          )}
          
          {discountAmount > 0 && (
            <Typography variant="body2" color="error" sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Discount:</span>
              <span>-EGP {discountAmount.toFixed(2)}</span>
            </Typography>
          )}
          
          <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <span>Final Total:</span>
            <span>EGP {finalTotal.toFixed(2)}</span>
          </Typography>
        </Box>

        <Box mt={2} display="flex" gap={2}>
          <Button
            variant="contained"
            fullWidth
            onClick={handleSubmit}
            disabled={!hasItems}
            sx={{ bgcolor: "#00AEEF", "&:hover": { bgcolor: "#0097d6" } }}
          >
            Checkout
          </Button>
          <Button 
            variant="outlined" 
            fullWidth 
            color="error" 
            onClick={onClear}
            sx={{ borderColor: "#f44336", color: "#f44336" }}
          >
            Clear
          </Button>
        </Box>

        {/* Add printer settings button */}
        {window.electron && (
          <Box mt={1} display="flex" justifyContent="flex-end">
            <Button
              startIcon={<SettingsIcon />}
              size="small"
              onClick={() => setPrinterDialogOpen(true)}
              sx={{ fontSize: "0.75rem" }}
            >
              Printer Settings
            </Button>
          </Box>
        )}
      </Box>

      {/* Receipt Template (hidden until printing) */}
      <Box
        ref={receiptRef}
        sx={{
          display: 'none', // Hidden from view
          width: '80mm', // Width of thermal receipt paper
          padding: '5mm',
          fontFamily: 'monospace',
          fontSize: '10pt',
          '@media print': {
            display: 'block',
            margin: 0,
            padding: '5mm',
          }
        }}
      >
        {/* Receipt Header */}
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          {/* Add a fallback for the logo */}
          {AkoyaLogo ? (
            <Box
              component="img"
              src={AkoyaLogo}
              alt="Akoya Water Park"
              sx={{ 
                height: '20mm', 
                maxWidth: '100%', 
                objectFit: 'contain',
                mb: 1
              }}
              onError={(e) => {
                console.error("Logo failed to load");
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '14pt', mb: 1 }}>
              AKOYA WATER PARK
            </Typography>
          )}
          <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '12pt' }}>
            Akoya Water Park
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '8pt' }}>
            {new Date().toLocaleString()}
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '8pt' }}>
            Cashier: {cashierName}
          </Typography>
        </Box>
        
        <Divider sx={{ borderStyle: 'dashed', my: 1 }} />
        
        {/* Receipt Content */}
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
          ORDER ITEMS
        </Typography>
        
        {/* Print Tickets */}
        {selected.map((t) => (
          <Box key={`receipt-ticket-${t.id}`} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2" sx={{ fontSize: '9pt' }}>
              {t.category} - {t.subcategory} {mode === "new" ? `× ${normalizedTicketCounts[t.id]}` : ""}
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '9pt' }}>
              EGP {mode === "new" 
                ? (normalizedTicketCounts[t.id] * t.price).toFixed(2)
                : t.price.toFixed(2)
              }
            </Typography>
          </Box>
        ))}
        
        {/* Print Meals */}
        {Object.entries(mealCounts).map(([id, qty]) => {
          const meal = meals.find((m) => m.id === parseInt(id));
          if (!meal) return null;
          
          return (
            <Box key={`receipt-meal-${id}`} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" sx={{ fontSize: '9pt' }}>
                {meal.name} × {qty}
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '9pt' }}>
                EGP {(meal.price * qty).toFixed(2)}
              </Typography>
            </Box>
          );
        })}
        
        <Divider sx={{ borderStyle: 'dashed', my: 1 }} />
        
        {/* Totals */}
        <Box sx={{ mb: 1 }}>
          {ticketTotal > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ fontSize: '9pt' }}>Tickets:</Typography>
              <Typography variant="body2" sx={{ fontSize: '9pt' }}>EGP {ticketTotal.toFixed(2)}</Typography>
            </Box>
          )}
          
          {mealTotal > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ fontSize: '9pt' }}>Meals:</Typography>
              <Typography variant="body2" sx={{ fontSize: '9pt' }}>EGP {mealTotal.toFixed(2)}</Typography>
            </Box>
          )}
          
          {discountAmount > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ fontSize: '9pt' }}>Discount:</Typography>
              <Typography variant="body2" sx={{ fontSize: '9pt' }}>-EGP {discountAmount.toFixed(2)}</Typography>
            </Box>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, fontWeight: 'bold' }}>
            <Typography variant="subtitle2" sx={{ fontSize: '10pt' }}>TOTAL:</Typography>
            <Typography variant="subtitle2" sx={{ fontSize: '10pt' }}>EGP {finalTotal.toFixed(2)}</Typography>
          </Box>
        </Box>
        
        {/* Payment Details */}
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
          PAYMENT DETAILS
        </Typography>
        
        {selectedMethods
          .filter(method => method !== 'discount' && getAmount(method) > 0)
          .map((method) => (
            <Box key={`receipt-payment-${method}`} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" sx={{ fontSize: '9pt' }}>
                {method.replace("_", " ").toUpperCase()}:
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '9pt' }}>
                EGP {getAmount(method).toFixed(2)}
              </Typography>
            </Box>
          ))}
        
        <Divider sx={{ borderStyle: 'dashed', my: 1 }} />
        
        {/* Footer */}
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography variant="body2" sx={{ fontSize: '9pt', fontStyle: 'italic' }}>
            Thank you for visiting Akoya Water Park!
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '8pt' }}>
            www.akoyawaterpark.com
          </Typography>
        </Box>
      </Box>

      {/* Checkout Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md">
        <DialogTitle sx={{ bgcolor: "#E0F7FF", color: "#00AEEF" }}>
          Confirm Checkout
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            label="Add Description"
            fullWidth
            margin="normal"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            minRows={3}
          />
          
          <Typography variant="subtitle1" sx={{ mt: 3, fontWeight: "bold", color: "#00AEEF" }}>
            💳 Select Payment Method(s)
          </Typography>

          <ToggleButtonGroup
            value={selectedMethods}
            onChange={(_, newMethods) => setSelectedMethods(newMethods)}
            aria-label="payment methods"
            color="primary"
            sx={{ mt: 1, display: "flex", flexWrap: "wrap" }}
          >
            {["visa", "cash", "vodafone_cash", "postponed", "discount"].map((method) => (
              <ToggleButton 
                key={method} 
                value={method} 
                aria-label={method}
                sx={{ flex: "1 0 auto", minWidth: "100px" }}
              >
                {method.replace("_", " ").toUpperCase()}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          
          {/* Discount field if selected */}
          {selectedMethods.includes('discount') && (
            <TextField
              label="Discount Amount"
              type="number"
              inputProps={{ step: "any", min: 0 }}
              value={getAmount('discount')}
              onChange={(e) => setAmount('discount', e.target.value)}
              fullWidth
              sx={{ mt: 2, mb: 1 }}
              helperText="Enter the discount amount to be applied"
            />
          )}
          
          {/* Payment fields */}
          <Box display="flex" gap={2} mt={2} flexWrap="wrap">
            {selectedMethods
              .filter(method => method !== 'discount')
              .map((method) => renderPaymentField(method))}
          </Box>

          <Typography 
            sx={{ mt: 2 }} 
            color={Math.abs(remaining) < 0.01 ? "green" : "red"}
            variant="subtitle1"
            fontWeight="bold"
          >
            {remaining > 0.01 ? 'Remaining:' : remaining < -0.01 ? 'Overpaid:' : 'Payment Complete:'} EGP {Math.abs(remaining).toFixed(2)}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            onClick={handleConfirm}
            variant="contained"
            disabled={!hasItems || (remaining > 0.01)}
            sx={{ bgcolor: "#00AEEF" }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Printer Settings Dialog */}
      <PrinterSettingsDialog />
    </>
  );
};

export default CheckoutPanel;
