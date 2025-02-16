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
import AccountantReports from "./components/AccountantReports";
import AccountantScan from "./components/AccountantScan";
import AccountantCategories from "./components/AccountantCategories";
import AccountantGenerate from "./components/AccountantGenerate";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/cashier" element={<CashierDashboard />} />

        {/* Accountant Dashboard with Nested Routes */}
        <Route path="/accountant" element={<AccountantDashboard />}>
          <Route path="accountant-reports" element={<AccountantReports />} />
          <Route path="accountant-scan" element={<AccountantScan />} />
          <Route path="accountant-categories" element={<AccountantCategories />} />
          <Route path="accountant-generate" element={<AccountantGenerate />} />
        </Route>

        {/* Redirect unknown routes to login */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
