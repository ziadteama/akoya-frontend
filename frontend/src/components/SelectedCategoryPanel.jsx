import React, { useState } from "react";

const SelectedCategoryPanel = ({ category, subcategories }) => {
  const [ticketCounts, setTicketCounts] = useState(
    subcategories.reduce((acc, sub) => ({ ...acc, [sub]: "0" }), {})
  );

  const increment = (sub) => {
    setTicketCounts((prev) => ({ ...prev, [sub]: String(Number(prev[sub]) + 1) }));
  };

  const decrement = (sub) => {
    setTicketCounts((prev) => ({
      ...prev,
      [sub]: prev[sub] > "0" ? String(Number(prev[sub]) - 1) : "0",
    }));
  };

  const handleInputChange = (sub, value) => {
    // Allow empty input for overwriting
    if (value === "") {
      setTicketCounts((prev) => ({ ...prev, [sub]: "" }));
    } else {
      const newValue = parseInt(value, 10);
      if (!isNaN(newValue) && newValue >= 0) {
        setTicketCounts((prev) => ({ ...prev, [sub]: String(newValue) }));
      }
    }
  };

  return (
    <div className="cashier-selected-category">
      <h3 className="cashier-category-name">{category}</h3>
      <div className="cashier-subcategories">
        {subcategories.map((sub) => (
          <div key={sub} className="cashier-subcategory-item">
            <span className="subcategory-name">{sub}</span>
            <button className="cashier-btn" onClick={() => decrement(sub)}>-</button>
            <input
              type="text"
              className="cashier-ticket-count"
              value={ticketCounts[sub]}
              onChange={(e) => handleInputChange(sub, e.target.value)}
              onBlur={(e) => {
                if (e.target.value === "") {
                  setTicketCounts((prev) => ({ ...prev, [sub]: "0" }));
                }
              }}
            />
            <button className="cashier-btn" onClick={() => increment(sub)}>+</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SelectedCategoryPanel;
