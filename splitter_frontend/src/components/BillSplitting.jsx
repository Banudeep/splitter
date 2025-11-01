import React, { useState, useEffect } from "react";
import { Calculator, ArrowLeft, ArrowRight, Equal } from "lucide-react";
import { splitService } from "../services/api";

const BillSplitting = ({
  billData,
  receiptId,
  users,
  onSplitsCreated,
  onFinalCalculation,
  onBack,
}) => {
  const [splits, setSplits] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const initializeSplits = async () => {
      if (billData.items && users.length > 0) {
        console.log("Initializing splits with users:", users);

        try {
          // Try to fetch existing shares from backend
          console.log("Fetching existing shares for receiptId:", receiptId);
          const existingShares = await splitService.getBillShare(receiptId);
          console.log("Existing shares from backend:", existingShares);

          if (existingShares && existingShares.length > 0) {
            // Use existing shares from backend
            console.log("Using existing shares from backend");
            console.log("Backend data structure:", existingShares);

            // The backend returns individual share records, we need to group them by item
            // and merge with the bill items to get the proper structure
            const processedShares = billData.items.map((billItem, index) => {
              // Find all shares for this item
              const itemShares = existingShares.filter(
                (share) =>
                  share.itemId === billItem.id ||
                  share.itemId === index + 1 ||
                  share.itemName === billItem.description
              );

              // Create shares array for this item
              const sharesForItem = users.map((user) => {
                const existingShare = itemShares.find(
                  (share) => share.userId === user.userId
                );
                return {
                  userId: user.userId,
                  share: existingShare ? existingShare.share || 0 : 0,
                  cost: existingShare ? existingShare.cost || 0 : 0,
                };
              });

              return {
                itemId: billItem.id || index + 1,
                itemName: billItem.description || `Item ${index + 1}`,
                price: billItem.price || 0,
                shares: sharesForItem,
              };
            });

            console.log("Processed shares:", processedShares);
            setSplits(processedShares);
          } else {
            // Initialize with zeros if no existing shares
            console.log("No existing shares found, initializing with zeros");
            const initialSplits = billData.items.map((item, index) => ({
              itemId: item.id || index + 1,
              itemName: item.description || `Item ${index + 1}`,
              price: item.price || 0,
              shares: users.map((user) => ({
                userId: user.userId,
                share: 0,
                cost: 0,
              })),
            }));
            console.log("Initial splits created:", initialSplits);
            setSplits(initialSplits);
          }
        } catch (error) {
          console.warn(
            "Failed to fetch existing shares, initializing with zeros:",
            error
          );
          // Fallback to initialization with zeros
          const initialSplits = billData.items.map((item, index) => ({
            itemId: item.id || index + 1,
            itemName: item.description || `Item ${index + 1}`,
            price: item.price || 0,
            shares: users.map((user) => ({
              userId: user.userId,
              share: 0,
              cost: 0,
            })),
          }));
          console.log("Fallback initial splits created:", initialSplits);
          setSplits(initialSplits);
        }
      }
    };

    initializeSplits();
  }, [billData.items, users, receiptId]);

  const updateShare = (itemIndex, userId, value) => {
    const newSplits = [...splits];
    const item = newSplits[itemIndex];
    const shareIndex = item.shares.findIndex(
      (share) => share.userId === userId
    );

    if (shareIndex !== -1) {
      item.shares[shareIndex].share = Math.max(0, parseFloat(value) || 0);

      // Recalculate costs for this item
      const totalShares = item.shares.reduce(
        (sum, share) => sum + share.share,
        0
      );
      if (totalShares > 0) {
        item.shares.forEach((share) => {
          share.cost = (share.share / totalShares) * item.price;
        });
      } else {
        item.shares.forEach((share) => {
          share.cost = 0;
        });
      }

      setSplits(newSplits);
    }
  };

  const calculateTotalShares = (itemIndex) => {
    return splits[itemIndex].shares.reduce(
      (sum, share) => sum + share.share,
      0
    );
  };

  const calculateUserTotal = (userId) => {
    const subtotal = splits.reduce((total, item) => {
      const userShare = item.shares.find((share) => share.userId === userId);
      return total + (userShare ? userShare.cost : 0);
    }, 0);

    // Calculate user's proportional share of tax
    const totalSubtotal =
      billData.subTotal ||
      splits.reduce((total, item) => total + item.price, 0);
    const taxTotal = billData.taxTotal || 0;
    const taxShare =
      totalSubtotal > 0 ? (subtotal / totalSubtotal) * taxTotal : 0;

    return subtotal + taxShare;
  };

  const calculateGrandTotal = () => {
    const subtotal =
      billData.subTotal ||
      splits.reduce((total, item) => total + item.price, 0);
    const taxTotal = billData.taxTotal || 0;
    return subtotal + taxTotal;
  };

  const equalSplitAllItems = () => {
    if (users.length === 0) {
      setError("No users available for equal splitting");
      return;
    }

    const equalShare = 1 / users.length; // Each user gets 1/n of each item
    const newSplits = splits.map((item) => {
      const updatedShares = item.shares.map((share) => ({
        ...share,
        share: equalShare,
        cost: equalShare * item.price,
      }));

      return {
        ...item,
        shares: updatedShares,
      };
    });

    setSplits(newSplits);
    setError(""); // Clear any existing errors
  };

  const equalSplitSingleItem = (itemIndex) => {
    if (users.length === 0) {
      setError("No users available for equal splitting");
      return;
    }

    const equalShare = 1 / users.length; // Each user gets 1/n of this item
    const newSplits = [...splits];
    const item = newSplits[itemIndex];

    // Update shares for this specific item
    item.shares = item.shares.map((share) => ({
      ...share,
      share: equalShare,
      cost: equalShare * item.price,
    }));

    setSplits(newSplits);
    setError(""); // Clear any existing errors
  };

  const validateSplits = () => {
    for (let i = 0; i < splits.length; i++) {
      const totalShares = calculateTotalShares(i);
      if (totalShares === 0) {
        setError(`Please assign shares for "${splits[i].itemName}"`);
        return false;
      }
    }
    return true;
  };

  const validateSplitsData = (splitsData) => {
    return splitsData.map((item) => ({
      itemId:
        item.itemId ||
        `item_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      itemName: item.itemName || "Unknown Item",
      price: parseFloat(item.price) || 0,
      shares: item.shares.map((share) => {
        return {
          userId: share.userId,
          share: parseFloat(share.share) || 0,
        };
      }),
    }));
  };

  const saveSplits = async () => {
    if (!validateSplits()) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Prepare and validate splits data for API
      const rawSplitsData = splits.map((item) => ({
        itemId: item.itemId,
        itemName: item.itemName,
        price: item.price,
        shares: item.shares.map((share) => ({
          userId: share.userId,
          share: share.share,
        })),
      }));

      const splitsData = validateSplitsData(rawSplitsData);

      console.log("Sending splits data to backend:", splitsData);
      console.log("Receipt ID (from backend):", receiptId);
      console.log("Users:", users);
      console.log("Expected splits format:", {
        itemId: "item_123",
        itemName: "Example Item",
        price: 9.99,
        shares: [
          { userId: "user_123", share: 0.5 },
          { userId: "user_456", share: 0.5 },
        ],
      });

      await splitService.shareBill(receiptId, splitsData);

      // Get final calculation
      const finalCalculation = await splitService.getShareByReceiptId(
        receiptId
      );

      onSplitsCreated(splitsData);
      onFinalCalculation(finalCalculation);
    } catch (err) {
      console.error("Error saving splits:", err);

      // Handle different types of errors
      if (err.response?.status === 500) {
        setError(
          "Backend service temporarily unavailable. Using local calculations..."
        );
        // Generate local calculation as fallback
        const localCalculation = generateLocalCalculation();
        onSplitsCreated(splits);
        onFinalCalculation(localCalculation);
      } else if (err.response?.status === 400) {
        // Handle 400 Bad Request - likely user ID issues
        const errorMessage = err.response?.data || err.message;
        const errorString =
          typeof errorMessage === "string"
            ? errorMessage
            : String(errorMessage || "");

        if (
          errorString.includes("UserId") &&
          errorString.includes("does not exist")
        ) {
          setError(
            "User data synchronization issue. Using local calculations..."
          );
        } else {
          setError("Invalid request data. Using local calculations...");
        }
        const localCalculation = generateLocalCalculation();
        onSplitsCreated(splits);
        onFinalCalculation(localCalculation);
      } else if (err.response?.status === 404) {
        setError("Service endpoint not found. Using local calculations...");
        const localCalculation = generateLocalCalculation();
        onSplitsCreated(splits);
        onFinalCalculation(localCalculation);
      } else if (err.code === "ERR_NETWORK") {
        setError("Network error. Using local calculations...");
        const localCalculation = generateLocalCalculation();
        onSplitsCreated(splits);
        onFinalCalculation(localCalculation);
      } else {
        setError("Failed to save splits. Using local calculations...");
        const localCalculation = generateLocalCalculation();
        onSplitsCreated(splits);
        onFinalCalculation(localCalculation);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const generateLocalCalculation = () => {
    // Generate a local calculation string similar to backend format
    const userTotals = users
      .map((user) => {
        const totalCost = calculateUserTotal(user.userId);
        return `UserId: ${user.userId}, Name: ${
          user.name
        }, Total Cost: ${totalCost.toFixed(2)}`;
      })
      .join("\n");

    const subtotal =
      billData.subTotal ||
      splits.reduce((total, item) => total + item.price, 0);
    const taxTotal = billData.taxTotal || 0;
    const grandTotal = subtotal + taxTotal;

    return `Local Calculation:\n${userTotals}\nSubtotal: ${subtotal.toFixed(
      2
    )}\nTax: ${taxTotal.toFixed(2)}\nTotal Amount: ${grandTotal.toFixed(2)}`;
  };

  return (
    <div className="bill-splitting">
      <div className="splitting-header">
        <h2>Split Bill Items</h2>
        <p>Assign shares for each item to calculate individual costs</p>
      </div>

      {error && (
        <div className="error-message">
          <span>{error}</span>
        </div>
      )}

      <div className="splits-container">
        {splits.map((item, itemIndex) => (
          <div key={item.itemId} className="split-item">
            <div className="item-header">
              <h3>{item.itemName}</h3>
              <span className="item-price">
                ${(item.price || 0).toFixed(2)}
              </span>
            </div>

            <div className="shares-grid">
              {item.shares.map((share) => {
                const user = users.find((u) => u.userId === share.userId);
                console.log("Looking for user with userId:", share.userId);
                console.log("Available users:", users);
                console.log("Found user:", user);

                if (!user) {
                  console.error("User not found for userId:", share.userId);
                }

                return (
                  <div key={share.userId} className="share-input">
                    <label>
                      {user
                        ? `${user.name} (ID: ${user.userId})`
                        : `User ${share.userId}`}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={share.share}
                      onChange={(e) =>
                        updateShare(itemIndex, share.userId, e.target.value)
                      }
                      onFocus={(e) => e.target.select()}
                      placeholder="0"
                    />
                    <span className="cost">
                      ${(share.cost || 0).toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="item-total">
              <span>Total Shares: {calculateTotalShares(itemIndex)}</span>
              {calculateTotalShares(itemIndex) === 0 && (
                <span className="warning">⚠️ No shares assigned</span>
              )}
              <button
                className="btn-equal-split"
                onClick={() => equalSplitSingleItem(itemIndex)}
                title="Split this item equally among all users"
              >
                <Equal size={16} />
                Equal Split
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="summary-section">
        <h3>Summary</h3>
        <div className="user-totals">
          {users.map((user) => (
            <div key={user.userId} className="user-total">
              <span>
                {user.name} (ID: {user.userId})
              </span>
              <span>${calculateUserTotal(user.userId).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="tax-breakdown">
          <div className="subtotal-line">
            <span>Subtotal</span>
            <span>
              $
              {(
                billData.subTotal ||
                splits.reduce((total, item) => total + item.price, 0)
              ).toFixed(2)}
            </span>
          </div>
          <div className="tax-line">
            <span>Tax</span>
            <span>${(billData.taxTotal || 0).toFixed(2)}</span>
          </div>
        </div>
        <div className="grand-total">
          <span>Grand Total</span>
          <span>${calculateGrandTotal().toFixed(2)}</span>
        </div>
      </div>

      <div className="splitting-actions">
        <button className="btn-secondary" onClick={onBack}>
          <ArrowLeft size={20} />
          Back to Users
        </button>
        <button
          className="btn-primary"
          onClick={saveSplits}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <div className="spinner-small"></div>
              Calculating...
            </>
          ) : (
            <>
              Calculate Final Amounts
              <ArrowRight size={20} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default BillSplitting;
