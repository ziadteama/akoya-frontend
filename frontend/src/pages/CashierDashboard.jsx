import { useState, useEffect } from "react";
import axios from "axios";
import CategoryPanel from "../components/CategoryPanel";
import SelectedCategoryPanel from "../components/SelectedCategoryPanel";

const CashierDashboard = () => {
  const [types, setTypes] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get("http://localhost:3000/api/tickets/ticket-types")
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

  // Get unique categories
  const uniqueCategories = [...new Set(types.map((type) => type.category))];

  // Add category without removing previous ones
  const handleSelectCategory = (category) => {
    if (!selectedCategories.some((c) => c.name === category)) {
      const subcategories = [
        ...new Set(types.filter((type) => type.category === category).map((type) => type.subcategory))
      ];
      setSelectedCategories([...selectedCategories, { name: category, subcategories }]);
    }
  };

  return (
    <div className="cashier-dashboard-container">
      <CategoryPanel 
        types={uniqueCategories.map(category => ({ category }))} 
        onSelectCategory={handleSelectCategory} 
      />
      
      <div className="cashier-main-content">
        <h2 className="cashier-dashboard-title">Cashier Dashboard</h2>
        
        {selectedCategories.length > 0 ? (
          selectedCategories.map(({ name, subcategories }) => (
            <SelectedCategoryPanel 
              key={name} 
              category={name} 
              subcategories={subcategories} 
            />
          ))
        ) : (
          <p className="cashier-select-message">Select a category to add tickets.</p>
        )}
      </div>
    </div>
  );
};

export default CashierDashboard;
