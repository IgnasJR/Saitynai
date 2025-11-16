import { useState } from "react";
import crypto from "../Utils/crypto";
import Spinner from "../Components/LoadingSpinner";
import User from "../Models/User";
import { setStorageItem } from "../Utils/localStorage";

function Login({ setUser }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    if (e.target.name === "username") {
      setUsername(e.target.value);
    } else if (e.target.name === "password") {
      setPassword(e.target.value);
    }
  };

  const handleLoginClick = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    console.log("Starting login...");

    try {
      const hashedPassword = await crypto.hashPassword(username, password);
      console.log("Hashed password:", hashedPassword);

      const response = await fetch(`/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password: hashedPassword }),
      });

      console.log("Response:", response);
      const data = await response.json();
      console.log("Data:", data);

      if (data.token) {
        const user = new User(data.id, username, data.token);
        setUser(user);
        setStorageItem("user", user);
      }

      setIsLoading(false);
    } catch (err) {
      console.error("Login error:", err);
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      {isLoading && <Spinner />}
      <h2>Login</h2>
      <form onSubmit={handleLoginClick} className="login-form">
        <input
          type="text"
          name="username"
          value={username}
          onChange={handleInputChange}
        />
        <input
          type="password"
          name="password"
          value={password}
          onChange={handleInputChange}
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default Login;
