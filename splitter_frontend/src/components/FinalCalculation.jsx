import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  DollarSign,
  Users,
  RotateCcw,
  Download,
  ArrowLeft,
} from "lucide-react";
import { splitService } from "../services/api";

const FinalCalculation = ({
  calculation,
  users,
  receiptId,
  onReset,
  onBack,
}) => {
  const [backendUsers, setBackendUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Fetch users from backend to get proper names
  useEffect(() => {
    const fetchUsers = async () => {
      if (!receiptId) return;

      setIsLoadingUsers(true);
      try {
        console.log(
          "FinalCalculation: Fetching users for receiptId:",
          receiptId
        );
        const fetchedUsers = await splitService.getUsersInSplit(receiptId);
        console.log(
          "FinalCalculation: Fetched users from backend:",
          fetchedUsers
        );

        if (fetchedUsers && fetchedUsers.length > 0) {
          setBackendUsers(fetchedUsers);
          console.log(
            "FinalCalculation: Using backend users with IDs:",
            fetchedUsers.map((u) => ({ id: u.userId, name: u.name }))
          );
        }
      } catch (err) {
        console.warn(
          "FinalCalculation: Failed to fetch users from backend:",
          err
        );
        // Use local users as fallback
        setBackendUsers(users);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [receiptId, users]);
  const parseCalculation = (calculationString) => {
    const lines = calculationString.split("\n");
    const userCosts = [];
    let subtotal = 0;
    let tax = 0;
    let grandTotal = 0;

    lines.forEach((line) => {
      // Handle both old format (with UserId) and new format (with Name only)
      if (line.includes("Total Cost:")) {
        let userId = null;
        let userName = null;
        let cost = null;

        // Try to parse old format with UserId
        const userIdMatch = line.match(/UserId: (\d+)/);
        if (userIdMatch) {
          userId = parseInt(userIdMatch[1]);
          // First try to find in backend users, then fallback to local users
          const backendUser = backendUsers.find((u) => u.userId === userId);
          const localUser = users.find((u) => u.userId === userId);
          const user = backendUser || localUser;
          if (user) {
            userName = user.name;
          }
        }

        // Try to parse new format with Name
        const nameMatch = line.match(/Name: ([^,]+)/);
        if (nameMatch) {
          userName = nameMatch[1].trim();
          // Find user by name to get userId for internal tracking
          const backendUser = backendUsers.find((u) => u.name === userName);
          const localUser = users.find((u) => u.name === userName);
          const user = backendUser || localUser;
          if (user) {
            userId = user.userId;
          }
        }

        // Get cost
        const costMatch = line.match(/Total Cost: ([\d.]+)/);
        if (costMatch) {
          cost = parseFloat(costMatch[1]);
        }

        if (userName && cost !== null) {
          userCosts.push({
            userId: userId || userName, // Use userId if available, otherwise use name as fallback
            name: userName,
            cost: cost || 0, // Default to 0 if cost is not provided
          });
        }
      }

      // Parse subtotal, tax, and grand total
      if (line.includes("Subtotal:")) {
        const subtotalMatch = line.match(/Subtotal: ([\d.]+)/);
        if (subtotalMatch) {
          subtotal = parseFloat(subtotalMatch[1]);
        }
      }

      if (line.includes("Tax:")) {
        const taxMatch = line.match(/Tax: ([\d.]+)/);
        if (taxMatch) {
          tax = parseFloat(taxMatch[1]);
        }
      }

      if (line.includes("Grand Total:")) {
        const grandTotalMatch = line.match(/Grand Total: ([\d.]+)/);
        if (grandTotalMatch) {
          grandTotal = parseFloat(grandTotalMatch[1]);
        }
      }
    });

    return { userCosts, subtotal, tax, grandTotal };
  };

  const parsedData = parseCalculation(calculation);
  const userCosts = parsedData.userCosts;
  const totalAmount =
    parsedData.grandTotal ||
    userCosts.reduce((sum, user) => sum + user.cost, 0);

  // Debug logging
  console.log("FinalCalculation - Parsed data:", parsedData);
  console.log("FinalCalculation - User costs:", userCosts);
  console.log("FinalCalculation - Total amount:", totalAmount);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const downloadSummary = () => {
    const summary = `
Bill Split Summary
=================

${userCosts
  .map((user) => `${user.name}: ${formatCurrency(user.cost)}`)
  .join("\n")}

${
  parsedData.subtotal > 0
    ? `Subtotal: ${formatCurrency(parsedData.subtotal)}`
    : ""
}
${parsedData.tax > 0 ? `Tax: ${formatCurrency(parsedData.tax)}` : ""}
Total Amount: ${formatCurrency(totalAmount)}

Generated on: ${new Date().toLocaleString()}
    `;

    const blob = new Blob([summary], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bill-split-summary.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="final-calculation">
      <div className="calculation-header">
        <div className="success-icon">
          <CheckCircle size={48} />
        </div>
        <h2>Bill Split Complete!</h2>
        <p>Here's how much each person owes</p>
        {isLoadingUsers && (
          <div className="loading-indicator">
            <div className="spinner-small"></div>
            <span>Loading user information...</span>
          </div>
        )}
      </div>

      <div className="calculation-results">
        <div className="results-summary">
          <div className="summary-item">
            <Users size={20} />
            <span>{userCosts.length} People</span>
          </div>
          <div className="summary-item">
            <DollarSign size={20} />
            <span>{formatCurrency(totalAmount)} Total</span>
          </div>
        </div>

        <div className="user-costs">
          <h3>Amount Owed by Each Person</h3>
          <div className="costs-list">
            {userCosts.map((user, index) => (
              <div key={user.userId} className="cost-item">
                <div className="user-info">
                  <div className="user-avatar">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="user-name">{user.name}</span>
                </div>
                <div className="cost-amount">{formatCurrency(user.cost)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="total-section">
          {parsedData.subtotal > 0 && (
            <div className="total-line">
              <span>Subtotal</span>
              <span>{formatCurrency(parsedData.subtotal)}</span>
            </div>
          )}
          {parsedData.tax > 0 && (
            <div className="total-line">
              <span>Tax</span>
              <span>{formatCurrency(parsedData.tax)}</span>
            </div>
          )}
          <div className="total-line grand-total">
            <span>Total Amount</span>
            <span>{formatCurrency(totalAmount)}</span>
          </div>
        </div>
      </div>

      <div className="calculation-actions">
        <button className="btn-secondary" onClick={onBack}>
          <ArrowLeft size={20} />
          Back to Split Items
        </button>
        <button className="btn-secondary" onClick={downloadSummary}>
          <Download size={20} />
          Download Summary
        </button>
        <button className="btn-primary" onClick={onReset}>
          <RotateCcw size={20} />
          Split Another Bill
        </button>
      </div>

      <div className="calculation-tips">
        <h4>Receipt Information:</h4>
        <p>Receipt ID: {receiptId}</p>

        <h4>Next Steps:</h4>
        <ul>
          <li>Share the amounts with your friends</li>
          <li>Use payment apps like Venmo, PayPal, or Zelle</li>
          <li>Download the summary for your records</li>
          <li>Keep track of who has paid</li>
        </ul>
      </div>
    </div>
  );
};

export default FinalCalculation;
