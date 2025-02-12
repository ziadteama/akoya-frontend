import React from "react";

const SelectedCategoryPanel = ({ category, subcategories, types, ticketCounts, onTicketCountsChange }) => {
  if (!category || subcategories.length === 0) return null;

  const increment = (subId) => {
    onTicketCountsChange({
      ...ticketCounts,
      [subId]: String(Number(ticketCounts[subId] || 0) + 1),
    });
  };

  const decrement = (subId) => {
    onTicketCountsChange({
      ...ticketCounts,
      [subId]: Number(ticketCounts[subId]) > 0 ? String(Number(ticketCounts[subId]) - 1) : "0",
    });
  };

  const handleInputChange = (subId, value) => {
    if (value === "") {
      onTicketCountsChange({ ...ticketCounts, [subId]: "" });
    } else {
      const newValue = parseInt(value, 10);
      if (!isNaN(newValue) && newValue >= 0) {
        onTicketCountsChange({ ...ticketCounts, [subId]: String(newValue) });
      }
    }
  };

  return (
    <div className="cashier-selected-category">
      <h3 className="cashier-category-name">{category}</h3>
      <div className="cashier-subcategories">
        {subcategories.map((sub) => {
          const ticketType = types.find((type) => type.id === sub.id);
          const price = ticketType ? Number(ticketType.price) : 0; // Ensure price is a number
          const count = Number(ticketCounts[sub.id] || 0);

          return (
            <div key={`sub-${sub.id}`} className="cashier-subcategory-item">
              <span className="subcategory-name">{sub.name}</span>
              <button className="cashier-btn" onClick={() => decrement(sub.id)}>-</button>
              <input
                type="text"
                className="cashier-ticket-count"
                value={ticketCounts[sub.id] || "0"}
                onChange={(e) => handleInputChange(sub.id, e.target.value)}
                onBlur={(e) => {
                  if (e.target.value === "") {
                    onTicketCountsChange({ ...ticketCounts, [sub.id]: "0" });
                  }
                }}
              />
              <button className="cashier-btn" onClick={() => increment(sub.id)}>+</button>
              {ticketType && (
                <span className="cashier-price"> ${count * price}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SelectedCategoryPanel;
