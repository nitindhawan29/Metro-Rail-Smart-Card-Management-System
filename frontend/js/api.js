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
  if (APP_CONFIG.USE_MOCK_API) return simulateNetwork(mockDatabase.passengers);
  return await request("/passengers");
}

//

async function createPassenger(data) {
  if (APP_CONFIG.USE_MOCK_API) return mockCreatePassenger(data);
  return await request("/passengers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

async function updatePassenger(id, data) {
  if (APP_CONFIG.USE_MOCK_API) return mockUpdatePassenger(id, data);
  return await request(`/passengers/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

async function deletePassenger(id) {
  if (APP_CONFIG.USE_MOCK_API) return mockDeletePassenger(id);
  return await request(`/passengers/${id}`, { method: "DELETE" });
}

//

async function getCards() {
  if (APP_CONFIG.USE_MOCK_API) return simulateNetwork(mockDatabase.cards);
  return await request("/cards");
}

async function createCard(data) {
  if (APP_CONFIG.USE_MOCK_API) return mockCreateCard(data);
  return await request("/cards", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

async function updateCard(id, data) {
  if (APP_CONFIG.USE_MOCK_API) return mockUpdateCard(id, data);
  return await request(`/cards/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

async function deleteCard(id) {
  if (APP_CONFIG.USE_MOCK_API) return mockDeleteCard(id);
  return await request(`/cards/${id}`, { method: "DELETE" });
}

//

async function getStations() {
  if (APP_CONFIG.USE_MOCK_API) return simulateNetwork(mockDatabase.stations);
  return await request("/stations");
}

async function createStation(data) {
  if (APP_CONFIG.USE_MOCK_API) return mockCreateStation(data);
  return await request("/stations", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

async function updateStation(id, data) {
  if (APP_CONFIG.USE_MOCK_API) return mockUpdateStation(id, data);
  return await request(`/stations/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

async function deleteStation(id) {
  if (APP_CONFIG.USE_MOCK_API) return mockDeleteStation(id);
  return await request(`/stations/${id}`, { method: "DELETE" });
}

//

async function getTransactions() {
  if (APP_CONFIG.USE_MOCK_API)
    return simulateNetwork(mockDatabase.transactions);
  return await request("/transactions");
}

async function createTransaction(data) {
  if (APP_CONFIG.USE_MOCK_API) return mockCreateTransaction(data);
  return await request("/transactions", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

async function updateTransaction(id, data) {
  if (APP_CONFIG.USE_MOCK_API) return mockUpdateTransaction(id, data);
  return await request(`/transactions/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

async function deleteTransaction(id) {
  if (APP_CONFIG.USE_MOCK_API) return mockDeleteTransaction(id);
  return await request(`/transactions/${id}`, { method: "DELETE" });
}
