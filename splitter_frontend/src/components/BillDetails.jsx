import React, { useState, useEffect } from "react";
import {
  Store,
  Calendar,
  Clock,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Plus,
  Trash2,
  Edit3,
} from "lucide-react";
import { ocrService } from "../services/api";

const BillDetails = ({ billData, receiptId, onNext, onBack }) => {
  const [editableBillData, setEditableBillData] = useState(billData);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Calculate subtotal and total based on current items
  const calculateSubtotal = () => {
    if (!editableBillData.items) return 0;
    return editableBillData.items.reduce(
      (sum, item) => sum + (item.price || 0),
      0
    );
  };

  const calculateTotal = () => {
    return calculateSubtotal() + (editableBillData.taxTotal || 0);
  };

  // Log calculations when component mounts or data changes
  useEffect(() => {
    console.log("BillDetails - Initial calculations:", {
      items: editableBillData.items || [],
      subtotal: calculateSubtotal(),
      tax: editableBillData.taxTotal || 0,
      total: calculateTotal(),
      storedSubtotal: editableBillData.subTotal || 0,
      storedTotal: editableBillData.total || 0,
    });
  }, [editableBillData]);

  const updateItem = (index, field, value) => {
    const newBillData = { ...editableBillData };
    if (!newBillData.items) newBillData.items = [];
    newBillData.items[index] = { ...newBillData.items[index], [field]: value };

    // Recalculate totals based on updated items
    const subtotal = newBillData.items.reduce(
      (sum, item) => sum + (item.price || 0),
      0
    );
    newBillData.subTotal = subtotal;
    newBillData.total = subtotal + (newBillData.taxTotal || 0);

    console.log(`Updated item ${index} ${field}:`, newBillData.items[index]);
    console.log("All items after update:", newBillData.items);
    setEditableBillData(newBillData);
  };

  const addItem = () => {
    const newBillData = { ...editableBillData };
    if (!newBillData.items) newBillData.items = [];
    newBillData.items.push({
      description: "New Item",
      price: 0,
    });

    // Recalculate totals
    const subtotal = newBillData.items.reduce(
      (sum, item) => sum + (item.price || 0),
      0
    );
    newBillData.subTotal = subtotal;
    newBillData.total = subtotal + (newBillData.taxTotal || 0);

    console.log("Added new item. All items:", newBillData.items);
    setEditableBillData(newBillData);
  };

  const removeItem = (index) => {
    const newBillData = { ...editableBillData };
    if (newBillData.items && newBillData.items.length > index) {
      console.log(`Removing item ${index}:`, newBillData.items[index]);
      newBillData.items.splice(index, 1);

      // Recalculate totals
      const subtotal = newBillData.items.reduce(
        (sum, item) => sum + (item.price || 0),
        0
      );
      newBillData.subTotal = subtotal;
      newBillData.total = subtotal + (newBillData.taxTotal || 0);

      console.log("All items after removal:", newBillData.items);
      setEditableBillData(newBillData);
    }
  };

  const handleNext = () => {
    // Pass the updated bill data to the next step
    onNext(editableBillData);
  };

  const saveChangesToBackend = async () => {
    setIsSaving(true);
    try {
      console.log("Updating receipt in backend:", editableBillData);
      console.log("Receipt ID:", receiptId);
      console.log("Items being sent:", editableBillData.items);

      // Log each item to see if they have IDs
      editableBillData.items?.forEach((item, index) => {
        console.log(`Item ${index}:`, item);
      });

      // Update the existing receipt in the backend
      await ocrService.updateReceipt(receiptId, editableBillData);

      console.log("Successfully updated receipt in backend");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating receipt in backend:", error);
      // Continue with local changes even if backend save fails
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return "N/A";
    try {
      const [hours, minutes] = timeString.split(":");
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return timeString;
    }
  };

  return (
    <div className="bill-details">
      <div className="bill-header">
        <h2>Bill Details</h2>
        <p>Review the extracted information from your receipt</p>
      </div>

      <div className="bill-info">
        <div className="store-info">
          <div className="info-item">
            <Store size={20} />
            <div>
              <h3>{billData.storeName || "Store Name"}</h3>
              <p>{billData.storeAddress || "Store Address"}</p>
            </div>
          </div>

          <div className="date-time">
            <div className="info-item">
              <Calendar size={20} />
              <span>{formatDate(billData.date)}</span>
            </div>
            <div className="info-item">
              <Clock size={20} />
              <span>{formatTime(billData.time)}</span>
            </div>
          </div>
        </div>

        <div className="items-section">
          <div className="items-header">
            <h3>Items</h3>
            <div className="items-actions">
              <button
                className={`btn-toggle-edit ${isEditing ? "active" : ""}`}
                onClick={() => {
                  if (isEditing) {
                    saveChangesToBackend();
                  } else {
                    setIsEditing(true);
                  }
                }}
                disabled={isSaving}
              >
                <Edit3 size={16} />
                {isSaving
                  ? "Saving..."
                  : isEditing
                  ? "Done Editing"
                  : "Edit Items"}
              </button>
              {isEditing && (
                <button className="btn-add-item" onClick={addItem}>
                  <Plus size={16} />
                  Add Item
                </button>
              )}
            </div>
          </div>

          <div className="items-list">
            {editableBillData.items && editableBillData.items.length > 0 ? (
              editableBillData.items.map((item, index) => (
                <div
                  key={index}
                  className={`item ${isEditing ? "editing" : ""}`}
                >
                  {isEditing ? (
                    <div className="editable-item">
                      <input
                        type="text"
                        value={item.description || ""}
                        onChange={(e) =>
                          updateItem(index, "description", e.target.value)
                        }
                        className="item-description-input"
                        placeholder="Item description"
                      />
                      <div className="price-input-container">
                        <span className="currency-symbol">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.price || 0}
                          onChange={(e) =>
                            updateItem(
                              index,
                              "price",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="item-price-input"
                          placeholder="0.00"
                        />
                      </div>
                      <button
                        className="btn-remove-item"
                        onClick={() => removeItem(index)}
                        title="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="item-description">
                        {item.description || `Item ${index + 1}`}
                      </div>
                      <div className="item-price">
                        {formatCurrency(item.price || 0)}
                      </div>
                    </>
                  )}
                </div>
              ))
            ) : (
              <p className="no-items">No items found</p>
            )}
          </div>
        </div>

        <div className="totals-section">
          <div className="total-item">
            <span>Subtotal:</span>
            <span>{formatCurrency(calculateSubtotal())}</span>
          </div>
          <div className="total-item">
            <span>Tax:</span>
            <span>{formatCurrency(editableBillData.taxTotal || 0)}</span>
          </div>
          <div className="total-item total-final">
            <span>Total:</span>
            <span>{formatCurrency(calculateTotal())}</span>
          </div>
        </div>
      </div>

      <div className="bill-actions">
        <button className="btn-secondary" onClick={onBack}>
          <ArrowLeft size={20} />
          Back to Upload
        </button>
        <button className="btn-primary" onClick={handleNext}>
          Continue to Users
          <ArrowRight size={20} />
        </button>
      </div>

      <div className="bill-note">
        <CheckCircle size={20} />
        <p>Receipt ID: {receiptId}</p>
      </div>
    </div>
  );
};

export default BillDetails;
