// API Client for Metro Rail Smart Card Management System
// Direct communication with backend Express server

// Helper to convert parameters object into URL query string using built-in URLSearchParams
function buildQueryString(params) {
  if (!params) return "";
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && String(val).trim() !== "") {
      query.append(key, String(val).trim());
    }
  });
  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

// Base helper function to send HTTP requests to backend
async function request(path, options = {}) {
  const url = `${APP_CONFIG.API_BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  const body = await response.json();
  if (!response.ok || body.success === false) {
    throw new Error(body.message || "Request failed");
  }
  return body;
}

// ---------------- PASSENGERS API ----------------
const getPassengers = (params) => request(`/passengers${buildQueryString(params)}`);
const createPassenger = (data) => request("/passengers", { method: "POST", body: JSON.stringify(data) });
const updatePassenger = (id, data) => request(`/passengers/${id}`, { method: "PUT", body: JSON.stringify(data) });
const deletePassenger = (id) => request(`/passengers/${id}`, { method: "DELETE" });

// ---------------- SMART CARDS API ----------------
const getCards = (params) => request(`/cards${buildQueryString(params)}`);
const createCard = (data) => request("/cards", { method: "POST", body: JSON.stringify(data) });
const updateCard = (id, data) => request(`/cards/${id}`, { method: "PUT", body: JSON.stringify(data) });
const deleteCard = (id) => request(`/cards/${id}`, { method: "DELETE" });

// ---------------- STATIONS API ----------------
const getStations = (params) => request(`/stations${buildQueryString(params)}`);
const createStation = (data) => request("/stations", { method: "POST", body: JSON.stringify(data) });
const updateStation = (id, data) => request(`/stations/${id}`, { method: "PUT", body: JSON.stringify(data) });
const deleteStation = (id) => request(`/stations/${id}`, { method: "DELETE" });

// ---------------- TRANSACTIONS API ----------------
const getTransactions = (params) => request(`/transactions${buildQueryString(params)}`);
const createTransaction = (data) => request("/transactions", { method: "POST", body: JSON.stringify(data) });
const updateTransaction = (id, data) => request(`/transactions/${id}`, { method: "PUT", body: JSON.stringify(data) });
const deleteTransaction = (id) => request(`/transactions/${id}`, { method: "DELETE" });
