import React, { useState, useEffect } from "react";
import {
  Upload,
  FileImage,
  AlertCircle,
  Camera,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { ocrService } from "../services/api";

const BillUpload = ({
  onBillUploaded,
  uploadedImage: propUploadedImage,
  billData: propBillData,
  receiptId: propReceiptId,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(propUploadedImage);
  const [billData, setBillData] = useState(propBillData);
  const [receiptId, setReceiptId] = useState(propReceiptId);

  // Sync with props when they change
  useEffect(() => {
    setUploadedImage(propUploadedImage);
    setBillData(propBillData);
    setReceiptId(propReceiptId);
  }, [propUploadedImage, propBillData, propReceiptId]);

  const handleFileUpload = async (file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (PNG, JPG, JPEG)");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      // Extract text from image using OCR
      const extractedData = await ocrService.extractTextFromImage(file);
      console.log("OCR Response:", extractedData);

      // Handle the response - it might be a string or already an object
      let billData;
      if (typeof extractedData === "string") {
        try {
          billData = JSON.parse(extractedData);
        } catch (parseError) {
          console.error("JSON Parse Error:", parseError);
          console.error("Raw data:", extractedData);
          throw new Error("Invalid JSON response from OCR service");
        }
      } else if (typeof extractedData === "object" && extractedData !== null) {
        billData = extractedData;
      } else {
        throw new Error("Unexpected response format from OCR service");
      }

      console.log("Parsed Bill Data:", billData);

      // Validate bill data structure
      if (!billData || typeof billData !== "object") {
        throw new Error("Invalid bill data structure");
      }

      // Save to database and get the actual receiptId
      let receiptId = null;
      try {
        const saveResponse = await ocrService.addReceiptToDatabase(billData);
        console.log("Save Response:", saveResponse);

        // Extract receiptId from backend response
        if (saveResponse && saveResponse.id) {
          receiptId = saveResponse.id;
          console.log("Received receiptId from backend:", receiptId);
        } else if (saveResponse && saveResponse.receiptId) {
          receiptId = saveResponse.receiptId;
          console.log("Received receiptId from backend:", receiptId);
        } else {
          console.warn("No receiptId found in backend response:", saveResponse);
        }
      } catch (saveError) {
        console.warn(
          "Failed to save to database, continuing with local data:",
          saveError
        );
        // Continue with local data even if backend save fails
      }

      // Use backend receiptId if available, otherwise generate temporary ID
      const finalReceiptId = receiptId || Date.now();
      console.log("Using receiptId:", finalReceiptId);

      // Store the image, bill data, and receipt ID for display
      setUploadedImage(URL.createObjectURL(file));
      setBillData(billData);
      setReceiptId(finalReceiptId);
    } catch (err) {
      console.error("Error processing bill:", err);
      if (err.message.includes("JSON")) {
        setError("Invalid response from OCR service. Please try again.");
      } else if (
        err.message.includes("network") ||
        err.message.includes("fetch")
      ) {
        setError("Network error. Please check your connection and try again.");
      } else {
        setError(`Failed to process the bill image: ${err.message}`);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    handleFileUpload(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    handleFileUpload(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleProceed = () => {
    if (billData && receiptId) {
      onBillUploaded(billData, receiptId, uploadedImage);
    }
  };

  return (
    <div className="bill-upload">
      <div className="upload-header">
        <h2>Upload Bill Image</h2>
        <p>Take a photo or upload an image of your receipt</p>
      </div>

      {uploadedImage ? (
        <div className="upload-success">
          <div className="success-icon">
            <CheckCircle size={48} />
          </div>
          <h3>Bill Image Uploaded Successfully!</h3>
          <div className="uploaded-image-container">
            <img
              src={uploadedImage}
              alt="Uploaded bill"
              className="uploaded-image"
            />
          </div>
          <div className="upload-actions">
            <button
              className="btn-secondary"
              onClick={() => {
                setUploadedImage(null);
                setBillData(null);
                setReceiptId(null);
                setError("");
              }}
            >
              Upload Different Image
            </button>
            <button className="btn-primary" onClick={handleProceed}>
              Continue to Bill Details
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      ) : (
        <>
          <div
            className={`upload-area ${dragActive ? "drag-active" : ""} ${
              isUploading ? "uploading" : ""
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {isUploading ? (
              <div className="upload-loading">
                <div className="spinner"></div>
                <p>Processing your bill...</p>
              </div>
            ) : (
              <>
                <div className="upload-icon">
                  <FileImage size={48} />
                </div>
                <h3>Drop your bill image here</h3>
                <p>or</p>
                <label htmlFor="file-upload" className="upload-button">
                  <Upload size={20} />
                  Choose File
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
                <p className="upload-hint">
                  Supported formats: PNG, JPG, JPEG (max 10MB)
                </p>
              </>
            )}
          </div>

          {error && (
            <div className="error-message">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          <div className="upload-tips">
            <h4>Tips for better results:</h4>
            <ul>
              <li>Ensure good lighting</li>
              <li>Keep the receipt flat</li>
              <li>Make sure all text is visible</li>
              <li>Avoid shadows and glare</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default BillUpload;
