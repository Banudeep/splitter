import axios from "axios";

const API_BASE_URL = "http://localhost:8080";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log(
      `Making ${config.method.toUpperCase()} request to:`,
      config.url
    );
    console.log("Request data:", config.data);
    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    console.log(`Response from ${response.config.url}:`, response.status);
    return response;
  },
  (error) => {
    console.error(
      `Error from ${error.config?.url}:`,
      error.response?.status,
      error.response?.data
    );
    return Promise.reject(error);
  }
);

// OCR Service
export const ocrService = {
  extractTextFromImage: async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/ocr/extract", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  addReceiptToDatabase: async (billsData) => {
    const response = await api.post("/ocr/receipt", billsData);
    return response.data;
  },

  getReceiptFromDatabase: async (id) => {
    const response = await api.get(`/ocr/receipt?id=${id}`);
    return response.data;
  },

  updateReceipt: async (receiptId, billsData) => {
    const response = await api.post(
      `/ocr/update_receipt?receiptId=${receiptId}`,
      billsData
    );
    return response.data;
  },
};

// Split Service
export const splitService = {
  addUsersToSplit: async (users) => {
    const response = await api.post("/math/users", users);
    return response.data;
  },

  getUsersInSplit: async (receiptId) => {
    const response = await api.get(`/math/users?receiptId=${receiptId}`);
    return response.data;
  },

  removeUserFromSplit: async (receiptId, userId) => {
    const response = await api.delete(
      `/math/users?receiptId=${receiptId}&userId=${userId}`
    );
    return response.data;
  },

  shareBill: async (receiptId, splits) => {
    const response = await api.post(
      `/math/share?receiptId=${receiptId}`,
      splits
    );
    return response.data;
  },

  getShareByReceiptId: async (receiptId) => {
    const response = await api.get(`/math/split?receiptId=${receiptId}`);
    return response.data;
  },

  getBillShare: async (receiptId) => {
    const response = await api.get(`/math/share?receiptId=${receiptId}`);
    return response.data;
  },
};

export default api;
