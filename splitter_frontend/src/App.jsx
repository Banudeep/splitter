import React, { useState } from "react";
import { Upload, FileText, Users, Calculator, CheckCircle } from "lucide-react";
import BillUpload from "./components/BillUpload";
import BillDetails from "./components/BillDetails";
import UserManagement from "./components/UserManagement";
import BillSplitting from "./components/BillSplitting";
import FinalCalculation from "./components/FinalCalculation";
import "./App.css";

function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [billData, setBillData] = useState(null);
  const [receiptId, setReceiptId] = useState(null);
  const [users, setUsers] = useState([]);
  const [splits, setSplits] = useState([]);
  const [finalCalculation, setFinalCalculation] = useState(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);

  const steps = [
    { id: 1, title: "Upload Bill", icon: Upload },
    { id: 2, title: "Review Bill", icon: FileText },
    { id: 3, title: "Add Users", icon: Users },
    { id: 4, title: "Split Items", icon: Calculator },
    { id: 5, title: "Final Calculation", icon: CheckCircle },
  ];

  const handleBillUploaded = (data, id, imageUrl) => {
    console.log("App received bill data and receiptId:", data, id);
    setBillData(data);
    setReceiptId(id);
    setUploadedImage(imageUrl);
    setCurrentStep(2);
  };

  const handleUsersAdded = (userList) => {
    console.log("App received users:", userList);
    setUsers(userList);
    setCurrentStep(4);
  };

  const handleSplitsCreated = (splitData) => {
    setSplits(splitData);
    setCurrentStep(5);
  };

  const handleFinalCalculation = (calculation) => {
    setFinalCalculation(calculation);
  };

  const resetApp = () => {
    setCurrentStep(1);
    setBillData(null);
    setReceiptId(null);
    setUsers([]);
    setSplits([]);
    setFinalCalculation(null);
    setUploadedImage(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Bill Splitter</h1>
        <p>Split your bills easily with friends</p>
        {isOfflineMode && (
          <div className="offline-indicator">
            <span>⚠️ Running in offline mode - using local calculations</span>
          </div>
        )}
      </header>

      <div className="step-indicator">
        {steps.map((step) => {
          const Icon = step.icon;
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;
          const hasData =
            (step.id === 1 && uploadedImage) ||
            (step.id === 2 && billData) ||
            (step.id === 3 && users.length > 0) ||
            (step.id === 4 && splits.length > 0) ||
            (step.id === 5 && finalCalculation);
          const isClickable = isCompleted || hasData;

          return (
            <div
              key={step.id}
              className={`step ${isActive ? "active" : ""} ${
                isCompleted ? "completed" : ""
              } ${hasData && !isCompleted ? "has-data" : ""} ${
                isClickable ? "clickable" : ""
              }`}
              onClick={() => {
                if (isClickable) {
                  setCurrentStep(step.id);
                }
              }}
            >
              <div className="step-icon">
                <Icon size={20} />
              </div>
              <span className="step-title">{step.title}</span>
            </div>
          );
        })}
      </div>

      <main className="app-main">
        {currentStep === 1 && (
          <BillUpload
            onBillUploaded={handleBillUploaded}
            uploadedImage={uploadedImage}
            billData={billData}
            receiptId={receiptId}
          />
        )}

        {currentStep === 2 && billData && (
          <BillDetails
            billData={billData}
            receiptId={receiptId}
            onNext={(updatedBillData) => {
              setBillData(updatedBillData);
              setCurrentStep(3);
            }}
            onBack={() => setCurrentStep(1)}
          />
        )}

        {currentStep === 3 && (
          <UserManagement
            receiptId={receiptId}
            onUsersAdded={handleUsersAdded}
            onBack={() => setCurrentStep(2)}
          />
        )}

        {currentStep === 4 && billData && users.length > 0 && (
          <BillSplitting
            billData={billData}
            receiptId={receiptId}
            users={users}
            onSplitsCreated={handleSplitsCreated}
            onFinalCalculation={handleFinalCalculation}
            onBack={() => setCurrentStep(3)}
          />
        )}

        {currentStep === 5 && finalCalculation && (
          <FinalCalculation
            calculation={finalCalculation}
            users={users}
            receiptId={receiptId}
            onReset={resetApp}
            onBack={() => setCurrentStep(4)}
          />
        )}
      </main>
    </div>
  );
}

export default App;
