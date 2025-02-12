import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
  
    try {
      const response = await axios.post("http://localhost:3000/api/tickets/login", {
        username,
        password,
      });
  
      console.log("✅ API Response:", response.data); // Debugging
  
      if (response.data && response.data.role) {
        localStorage.setItem("userRole", response.data.role);
        redirectToDashboard(response.data.role);
      } else {
        setError(response.data.message || "Invalid credentials");
      }
    } catch (error) {
      console.error("❌ API Error:", error.response?.data || error.message);
  
      setError(error.response?.data?.message || "Login failed. Please try again.");
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
    <div>
      <h2>Login</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
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
  );
};

export default Login;
