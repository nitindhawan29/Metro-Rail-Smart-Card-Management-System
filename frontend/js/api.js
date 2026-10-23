// API Client for Metro Rail Smart Card Management System
// Direct communication with backend Express server

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

async function getPassengers() {
  return await request("/passengers");
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

async function getCards() {
  return await request("/cards");
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

async function getStations() {
  return await request("/stations");
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

async function getTransactions() {
  return await request("/transactions");
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
