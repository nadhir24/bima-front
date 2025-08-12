import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Enable sending cookies
  timeout: 15000, // 15 seconds timeout
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage if it exists
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("user");
      if (user) {
        try {
          const userData = JSON.parse(user);
          if (userData.token) {
            config.headers["Authorization"] = `Bearer ${userData.token}`;
          }
        } catch (error) {
          // Silent fail
        }
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle specific error status codes
    if (error.response) {
      const status = error.response.status;

      if (status === 401) {
        // Handle unauthorized access
        if (typeof window !== "undefined") {
          localStorage.removeItem("user");
        }
      }
    }

    return Promise.reject(error);
  }
);

// API service methods
const api = {
  // Auth endpoints
  auth: {
    login: (data: { email: string; password: string }) =>
      apiClient.post("/auth/login", data),
    signup: (data: {
      fullName: string;
      email: string;
      phoneNumber: string;
      password: string;
    }) => apiClient.post("/auth/signup", data),
    syncCart: (data: { userId: number; guestId: string }) =>
      apiClient.post("/cart/sync", data),
  },

  // Catalog endpoints
  catalog: {
    getAll: () => apiClient.get("/catalog/"),
    getBySlug: (categorySlug: string, productSlug: string) =>
      apiClient.get(`/catalog/${categorySlug}/${productSlug}`),
  },

  // Cart endpoints
  cart: {
    getGuestSession: () => apiClient.get("/cart/guest-session"),
    getByUser: (userId: number) =>
      apiClient.get(`/cart/findMany?userId=${userId}`),
    getByGuest: (guestId: string) =>
      apiClient.get(`/cart/findMany?guestId=${guestId}`),
    getTotal: (params: string) => apiClient.get(`/cart/total?${params}`),
    addItem: (data: any) => apiClient.post("/cart/add", data),
    updateItem: (id: number, data: any) => apiClient.patch(`/cart/${id}`, data),
    deleteItem: (id: number) => apiClient.delete(`/cart/${id}`),
  },

  // Payment endpoints
  payment: {
    createTransaction: (data: any) =>
      apiClient.post("/payment/snap/create-transaction", data),
    getOrderDetail: (orderId: string) =>
      apiClient.get(`/payment/snap/order-detail?orderId=${orderId}`),
    getGuestOrder: (orderId: string, email: string) =>
      apiClient.get(
        `/payment/snap/guest-order?orderId=${orderId}&email=${email}`
      ),
  },

  // User endpoints
  users: {
    getById: (userId: number) => apiClient.get(`/users/${userId}`),
  },
};

export default api;
