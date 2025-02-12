import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/SignIn";
import AdminDashboard from "./pages/AdminDashboard";
import CashierDashboard from "./pages/CashierDashboard";
import AccountantDashboard from "./pages/AccountantDashboard";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/cashier" element={<CashierDashboard />} />
        <Route path="/accountant" element={<AccountantDashboard />} />
        {/* Redirect unknown routes to login */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
