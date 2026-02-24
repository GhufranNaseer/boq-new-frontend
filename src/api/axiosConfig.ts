import axios from "axios";

// Backend base URL
const BASE_URL = "http://localhost:3001"; // backend NestJS port

const axiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor (JWT token attach karne ke liye)
axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem("token"); // JWT token
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor (401 handle karne ke liye)
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
