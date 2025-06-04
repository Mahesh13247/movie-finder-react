import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import './PinLock.css';

const PinLock = ({ children, sectionName = "Protected Section" }) => {
  const [pin, setPin] = useState(() => localStorage.getItem(`${sectionName}Pin`) || "");
  const [pinInput, setPinInput] = useState("");
  const [pinSet, setPinSet] = useState(() => !!localStorage.getItem(`${sectionName}Pin`));
  const [pinUnlocked, setPinUnlocked] = useState(() => localStorage.getItem(`${sectionName}PinUnlocked`) === "1");
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);

  const clearPinInput = () => {
    setTimeout(() => {
      setPinInput("");
    }, 500); // Clear after 500ms to show success message
  };

  const handlePinSet = () => {
    if (pinInput.length === 4) {
      localStorage.setItem(`${sectionName}Pin`, pinInput);
      setPin(pinInput);
      setPinSet(true);
      setPinUnlocked(true);
      localStorage.setItem(`${sectionName}PinUnlocked`, "1");
      toast.success("PIN set successfully!");
      clearPinInput();
    } else {
      toast.error("PIN must be 4 digits");
      setPinInput(""); // Clear immediately on error
    }
  };

  const handlePinUnlock = () => {
    if (pinInput === pin) {
      setPinUnlocked(true);
      localStorage.setItem(`${sectionName}PinUnlocked`, "1");
      toast.success("Access granted!");
      clearPinInput();
    } else {
      toast.error("Incorrect PIN");
      setPinInput(""); // Clear immediately on error
    }
  };

  const handlePinLock = () => {
    setPinUnlocked(false);
    localStorage.setItem(`${sectionName}PinUnlocked`, "0");
    toast.info("Section locked");
  };

  const handleResetRequest = () => {
    setShowResetConfirmation(true);
    setPinInput(""); // Clear input when entering reset mode
  };

  const handleResetConfirm = () => {
    if (pinInput === pin) {
      localStorage.removeItem(`${sectionName}Pin`);
      localStorage.removeItem(`${sectionName}PinUnlocked`);
      setPin("");
      setPinSet(false);
      setPinUnlocked(false);
      setShowResetConfirmation(false);
      toast.info("PIN reset. Please set a new PIN.");
      clearPinInput();
    } else {
      toast.error("Incorrect PIN. Cannot reset.");
      setPinInput(""); // Clear immediately on error
    }
  };

  const handleResetCancel = () => {
    setShowResetConfirmation(false);
    setPinInput(""); // Clear input when canceling reset
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (!pinSet) {
        handlePinSet();
      } else if (showResetConfirmation) {
        handleResetConfirm();
      } else {
        handlePinUnlock();
      }
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 4) {
      setPinInput(value);
    }
  };

  if (!pinUnlocked) {
    return (
      <div className="pin-lock-container">
        <h2>🔒 {sectionName} Locked</h2>
        <div className="pin-input-container">
          {pinSet ? (
            <>
              <input
                type="password"
                maxLength={4}
                value={pinInput}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder={showResetConfirmation ? "Enter current PIN to reset" : "Enter 4-digit PIN"}
                className="pin-input"
                autoComplete="off"
              />
              {showResetConfirmation ? (
                <div className="reset-confirmation-buttons">
                  <button onClick={handleResetConfirm} className="pin-button confirm">
                    Confirm Reset
                  </button>
                  <button onClick={handleResetCancel} className="pin-button cancel">
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="pin-buttons">
                  <button onClick={handlePinUnlock} className="pin-button unlock">
                    Unlock
                  </button>
                  <button onClick={handleResetRequest} className="pin-button reset">
                    Reset PIN
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <input
                type="password"
                maxLength={4}
                value={pinInput}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Set 4-digit PIN"
                className="pin-input"
                autoComplete="off"
              />
              <button onClick={handlePinSet} className="pin-button set">
                Set PIN
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="protected-content">
      <div className="lock-control">
        <button onClick={handlePinLock} className="lock-button">
          🔒 Lock Section
        </button>
      </div>
      {children}
    </div>
  );
};

export default PinLock; 