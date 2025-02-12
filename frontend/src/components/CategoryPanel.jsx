import React from "react";

const CategoryPanel = ({ types, onSelectCategory }) => {
  // Extract unique categories
  const uniqueCategories = [...new Set(types.map((type) => type.category))];

  return (
    <div className="cashier-category-panel">
      <h3 className="cashier-category-title">Categories</h3>
      <ul className="cashier-category-list">
        {uniqueCategories.map((category, index) => (
          <li 
            key={index} 
            className="cashier-category-item" 
            onClick={() => onSelectCategory(category)}
          >
            {category}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CategoryPanel;
