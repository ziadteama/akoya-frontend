import { useState, useEffect } from "react";
import axios from "axios";
import CategoryPanel from "../components/CategoryPanel";
import SelectedCategoryPanel from "../components/SelectedCategoryPanel";

const CashierDashboard = () => {
  const [types, setTypes] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [ticketCounts, setTicketCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get("http://localhost:3000/api/tickets/ticket-types")
      .then((response) => {
        setTypes(response.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching types:", err);
        setError("Failed to load types");
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="cashier-loading">Loading types...</p>;
  if (error) return <p className="cashier-error">{error}</p>;

  const uniqueCategories = [...new Set(types.map((type) => type.category))];

  const handleSelectCategory = (category) => {
    if (!selectedCategories.some((c) => c.name === category)) {
      const subcategories = types
        .filter((type) => type.category === category)
        .map((type) => ({
          id: type.id,
          name: type.subcategory,
          price: type.price,
        }))
        .sort((a, b) => {
          const order = ["child", "adult", "grand"];
          return order.indexOf(a.name) - order.indexOf(b.name);
        });
  
      setSelectedCategories([...selectedCategories, { name: category, subcategories }]);
      setTicketCounts((prevCounts) => ({
        ...prevCounts,
        [category]: subcategories.reduce((acc, sub) => ({ ...acc, [sub.id]: "0" }), {}),
      }));
    }
  };

  const removeCategory = (category) => {
    setSelectedCategories(selectedCategories.filter((c) => c.name !== category));
    setTicketCounts((prev) => {
      const updatedCounts = { ...prev };
      delete updatedCounts[category];
      return updatedCounts;
    });
  };

  const updateTicketCounts = (category, newCounts) => {
    setTicketCounts((prev) => ({ ...prev, [category]: newCounts }));
  };

  const resetOrder = () => {
    setSelectedCategories([]);
    setTicketCounts({});
  };

  const handleCheckout = async () => {
    let order = [];
    Object.entries(ticketCounts).forEach(([category, counts]) => {
      Object.entries(counts).forEach(([subId, quantity]) => {
        const ticketType = types.find((type) => type.id.toString() === subId);
        if (ticketType && Number(quantity) > 0) {
          order.push({ ticket_type_id: ticketType.id, quantity: Number(quantity) });
        }
      });
    });
    
    if (order.length === 0) {
      alert("Please select at least one ticket");
      return;
    }
    
    console.log("Submitting order:", order);
    
    try {
      const { data } = await axios.post("http://localhost:3000/api/tickets/sell", { tickets: order });
      alert("Tickets sold successfully!");
      console.log("Sold Tickets:", data.soldTickets);
      resetOrder();
    } catch (error) {
      console.error("Checkout error:", error);
      alert(error.response?.data?.message || "Error processing your request");
    }
  };
  
  return (
    <div className="cashier-dashboard-container">
      <CategoryPanel types={uniqueCategories.map((category) => ({ category }))} onSelectCategory={handleSelectCategory} />
      <div className="cashier-main-content">
        <h2 className="cashier-dashboard-title">Cashier Dashboard</h2>
        {selectedCategories.length > 0 ? (
          selectedCategories.map(({ name, subcategories }) => (
            <SelectedCategoryPanel key={name} category={name} subcategories={subcategories} types={types} ticketCounts={ticketCounts[name] || {}} onTicketCountsChange={(newCounts) => updateTicketCounts(name, newCounts)} onRemoveCategory={removeCategory} />
          ))
        ) : (
          <p className="cashier-select-message">Select a category to add tickets.</p>
        )}
        <button className="cashier-reset-btn" onClick={resetOrder}>Reset Order</button>
        <div className="cashier-total">
          <h3>Total: ${Object.values(ticketCounts).reduce((total, categoryCounts) => {
            return total + Object.entries(categoryCounts).reduce((subTotal, [subId, quantity]) => {
              const ticketType = types.find((type) => type.id.toString() === subId);
              return subTotal + (ticketType ? Number(quantity) * Number(ticketType.price) : 0);
            }, 0);
          }, 0)}</h3>
          <button className="cashier-checkout-btn" onClick={handleCheckout}>Checkout</button>
        </div>
      </div>
    </div>
  );
};

export default CashierDashboard;
