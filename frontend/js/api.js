// API Client for Metro Rail Smart Card Management System
// Direct communication with backend Express server

// Helper to convert an object into URL query string for SQL search parameters
function buildQueryString(params) {
  if (!params) return "";
  const parts = [];
  for (const key in params) {
    const val = params[key];
    if (val !== undefined && val !== null && String(val).trim() !== "") {
      parts.push(encodeURIComponent(key) + "=" + encodeURIComponent(String(val).trim()));
    }
  }
  if (parts.length > 0) {
    return "?" + parts.join("&");
  }
  return "";
}

// Base helper function to send HTTP requests to backend
async function request(path, options) {
  if (!options) {
    options = {};
  }

  // Ensure headers object exists and set JSON content type
  if (!options.headers) {
    options.headers = {};
  }
  options.headers["Content-Type"] = "application/json";

  const url = APP_CONFIG.API_BASE_URL + path;
  const response = await fetch(url, options);
  const body = await response.json();

  if (!response.ok || body.success === false) {
    const errorMsg = body.message ? body.message : "Request failed";
    throw new Error(errorMsg);
  }

  return body;
}

// ---------------- PASSENGERS API ----------------

// Passes search & sort parameters to execute SQL queries on the backend
async function getPassengers(params) {
  return await request("/passengers" + buildQueryString(params));
}

async function createPassenger(data) {
  return await request("/passengers", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

async function updatePassenger(id, data) {
  return await request("/passengers/" + id, {
    method: "PUT",
    body: JSON.stringify(data)
  });
}

async function deletePassenger(id) {
  return await request("/passengers/" + id, {
    method: "DELETE"
  });
}

// ---------------- SMART CARDS API ----------------

// Passes search & sort parameters to execute SQL queries on the backend
async function getCards(params) {
  return await request("/cards" + buildQueryString(params));
}

async function createCard(data) {
  return await request("/cards", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

async function updateCard(id, data) {
  return await request("/cards/" + id, {
    method: "PUT",
    body: JSON.stringify(data)
  });
}

async function deleteCard(id) {
  return await request("/cards/" + id, {
    method: "DELETE"
  });
}

// ---------------- STATIONS API ----------------

// Passes search & sort parameters to execute SQL queries on the backend
async function getStations(params) {
  return await request("/stations" + buildQueryString(params));
}

async function createStation(data) {
  return await request("/stations", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

async function updateStation(id, data) {
  return await request("/stations/" + id, {
    method: "PUT",
    body: JSON.stringify(data)
  });
}

async function deleteStation(id) {
  return await request("/stations/" + id, {
    method: "DELETE"
  });
}

// ---------------- TRANSACTIONS API ----------------

// Passes search & sort parameters to execute SQL queries on the backend
async function getTransactions(params) {
  return await request("/transactions" + buildQueryString(params));
}

async function createTransaction(data) {
  return await request("/transactions", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

async function updateTransaction(id, data) {
  return await request("/transactions/" + id, {
    method: "PUT",
    body: JSON.stringify(data)
  });
}

async function deleteTransaction(id) {
  return await request("/transactions/" + id, {
    method: "DELETE"
  });
}
