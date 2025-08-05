import axios from "axios";

const API = axios.create({
  baseURL: "/api/admin",
});

// Attach admin token to every request if available
API.interceptors.request.use(
  (config) => {
    const admin = localStorage.getItem("admin");
    if (admin) {
      const { token } = JSON.parse(admin);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth
export const adminLogin = (email, password) => API.post("/auth/login", { email, password });

// Users
export const fetchUsers = () => API.get("/users");
export const createUser = (data) => API.post("/users", data);
export const updateUser = (id, data) => API.put(`/users/${id}`, data);
export const deleteUser = (id) => API.delete(`/users/${id}`);

// Clients
export const fetchClients = () => API.get("/clients");
export const createClient = (data) => API.post("/clients", data);
export const updateClient = (id, data) => API.put(`/clients/${id}`, data);
export const deleteClient = (id) => API.delete(`/clients/${id}`);

// Avatars
export const fetchAvatars = () => API.get("/avatars");
export const createAvatar = (data) => API.post("/avatars", data);
export const updateAvatar = (id, data) => API.put(`/avatars/${id}`, data);
export const deleteAvatar = (id) => API.delete(`/avatars/${id}`);

export default API; 