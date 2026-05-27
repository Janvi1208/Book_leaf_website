import axios from "axios";

const api = axios.create({
  baseURL:
    process.env.REACT_APP_API_URL ||
    "https://bookleaf-backend1.onrender.com/api",
  timeout: 30000,
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("bookleaf_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle auth errors globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("bookleaf_token");
      localStorage.removeItem("bookleaf_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  },
);

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email, password) => api.post("/auth/login", { email, password }),
  register: (name, email, password) =>
    api.post("/auth/register", { name, email, password }),
  me: () => api.get("/auth/me"),
};

// ─── Books ───────────────────────────────────────────────────────────────────
export const booksApi = {
  myBooks: () => api.get("/books/my"),
  allBooks: () => api.get("/books"),
};

// ─── Tickets ─────────────────────────────────────────────────────────────────
export const ticketsApi = {
  create: (data) => api.post("/tickets", data),
  myTickets: () => api.get("/tickets/my"),
  getTicket: (id) => api.get(`/tickets/${id}`),
  all: (params) => api.get("/tickets", { params }),
  update: (id, data) => api.patch(`/tickets/${id}`, data),
  sendMessage: (id, data) => api.post(`/tickets/${id}/messages`, data),
  getDraft: (id) => api.get(`/tickets/${id}/draft`),
  getStats: () => api.get("/tickets/stats"),
};

export default api;
