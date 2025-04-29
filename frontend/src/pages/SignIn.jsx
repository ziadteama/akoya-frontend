import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    if (userRole) {
      redirectToDashboard(userRole);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await axios.post(
        "http://localhost:3000/api/tickets/login",
        {
          username,
          password,
        }
      );

      console.log("✅ API Response:", response.data);

      if (response.data && response.data.role) {
        localStorage.setItem("userRole", response.data.role);
        localStorage.setItem("userName", response.data.name);
        localStorage.setItem("userId", response.data.user_id);
        redirectToDashboard(response.data.role);
      } else {
        setError(response.data.message || "Invalid credentials");
      }
    } catch (error) {
      console.error("❌ API Error:", error.response?.data || error.message);
      setError(
        error.response?.data?.message || "Login failed. Please try again."
      );
    }
  };

  const redirectToDashboard = (role) => {
    switch (role) {
      case "admin":
        navigate("/admin");
        break;
      case "cashier":
        navigate("/cashier");
        break;
      case "accountant":
        navigate("/accountant");
        break;
      default:
        setError("Unauthorized role");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Akoya Water Park</h2>
        {error && <p>{error}</p>}
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
