import React from "react";
import "./Modal.css";

export default function Modal({ message, onClose }) {
  if (!message) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <p>{message}</p>
        <button onClick={onClose}>OK</button>
      </div>
    </div>
  );
}