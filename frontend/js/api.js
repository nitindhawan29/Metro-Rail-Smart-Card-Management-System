async function request(path, options = {}) {

  const response = await fetch(
    `${APP_CONFIG.API_BASE_URL}${path}`,
    {
      ...options,

      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    }
  );


  const body = await response.json();


  if (!response.ok || body.success === false) {

    throw new Error(
      body.message || "Request failed"
    );
  }


  return body;
}

// Passenger Service API
async function getPassengers() {
  return await request("/passengers");
}

async function createPassenger(data) {
  return await request("/passengers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

async function updatePassenger(id, data) {
  return await request(`/passengers/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

async function deletePassenger(id) {
  return await request(`/passengers/${id}`, { method: "DELETE" });
}

// Cards API
async function getCards() {
  return await request("/cards");
}

async function createCard(data) {
  return await request("/cards", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

async function updateCard(id, data) {
  return await request(`/cards/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

async function deleteCard(id) {
  return await request(`/cards/${id}`, { method: "DELETE" });
}

// Stations API
async function getStations() {
  return await request("/stations");
}

async function createStation(data) {
  return await request("/stations", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

async function updateStation(id, data) {
  return await request(`/stations/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

async function deleteStation(id) {
  return await request(`/stations/${id}`, { method: "DELETE" });
}

// Transactions API
async function getTransactions() {
  return await request("/transactions");
}

async function createTransaction(data) {
  return await request("/transactions", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

async function updateTransaction(id, data) {
  return await request(`/transactions/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

async function deleteTransaction(id) {
  return await request(`/transactions/${id}`, { method: "DELETE" });
}
