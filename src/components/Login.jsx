import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Image from "../assets/image.png";
import  Modal from "./Modal";
import "./Login.css";

export default function Auth() {
  const [isFlipped, setIsFlipped] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [modalMsg, setModalMsg] = useState("");
  const navigate = useNavigate();

  const BASE_URL =
  process.env.REACT_APP_BASE_URL || "http://localhost:5000";

  // 🔐 LOGIN
  const login = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setModalMsg("Please enter both email and password!");
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
       // 🔍 debug

      if (!res.ok) {
        setModalMsg(data.msg || "Login failed");
        return;
      }

      // ✅ Save token
      localStorage.setItem("token", data.token);

      // Save user info
      localStorage.setItem("user", data.user.name);

      navigate("/chat");

    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  // 📝 SIGNUP
  const signup = async (e) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      setModalMsg("Please fill in all fields!");
      return;
    }

    if (password !== confirmPassword) {
      setModalMsg("Passwords do not match!");
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.msg || "Signup failed");
        return;
      }

      alert("Account created successfully!");

      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setIsFlipped(false);

    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  return (
    <div className="auth-container">
      <div className={`card ${isFlipped ? "flipped" : ""}`}>
        
        {/* Login */}
        <div className="card-face front">
          <h2>
            Login <img src={Image} alt="Chat Bot" className="auth-image" />
          </h2>

          <form>
            <div className="input-group">
              <label>Email</label>
              <input type="email" placeholder="Please Enter Email" onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div className="input-group">
              <label>Password</label>
              <input type="password" placeholder="Please Enter Password" onChange={(e) => setPassword(e.target.value)} />
            </div>

            <button className="btn" onClick={login}>Login</button>
          </form>

          <p className="switch-text">
            Don’t have an account?{" "}
            <span onClick={() => setIsFlipped(true)}>Sign up</span>
          </p>
        </div>

        {/* Signup */}
        <div className="card-face back">
          <h2>
            Sign Up <img src={Image} alt="Chat Bot" className="auth-image" />
          </h2>

          <form>
            <div className="input-group">
              <label>Name</label>
              <input type="text" placeholder="Please Enter Name" onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="input-group">
              <label>Email</label>
              <input type="email" placeholder="Please Enter Email" onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div className="input-group">
              <label>Password</label>
              <input type="password" placeholder="Please Enter Password" onChange={(e) => setPassword(e.target.value)} />
            </div>

            <div className="input-group">
              <label>Confirm Password</label>
              <input type="password" placeholder="Please Confirm Password" onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>

            <button className="btn" onClick={signup}>Create Account</button>
          </form>

          <p className="switch-text">
            Already have an account?{" "}
            <span onClick={() => setIsFlipped(false)}>Login</span>
          </p>
        </div>
      </div>
      <Modal message={modalMsg} onClose={() => setModalMsg("")} />
    </div>
  );
}