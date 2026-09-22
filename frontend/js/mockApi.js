// DEVELOPMENT ONLY: Simulates the database with localStorage persistence

// Check exactly what is in local storage
const savedData = localStorage.getItem("metroMockDB");

// If local storage has data, parse it. If it is strictly NULL, create an empty database.
let mockDatabase = savedData ? JSON.parse(savedData) : {
  passengers: [],
  cards: [],
  stations: [],
  transactions: []
};

// Helper to save state after mutations
function saveMockDB() {
  localStorage.setItem("metroMockDB", JSON.stringify(mockDatabase));
}

function simulateNetwork(data) {
  return new Promise((resolve) =>
    setTimeout(() => resolve({ success: true, data: data }), 300)
  );
}

// --- PASSENGER MOCKS ---
function mockCreatePassenger(data) {
  return simulateNetwork().then(() => {
    const newId =
      mockDatabase.passengers.length > 0
        ? Math.max(...mockDatabase.passengers.map((p) => p.passenger_id)) + 1
        : 1;
    mockDatabase.passengers.push({ passenger_id: newId, ...data });
    saveMockDB(); 
    return { success: true, message: "Passenger added successfully" };
  });
}

function mockUpdatePassenger(id, data) {
  return simulateNetwork().then(() => {
    const index = mockDatabase.passengers.findIndex(
      (p) => p.passenger_id == id
    );
    if (index === -1) throw new Error("Passenger not found");
    mockDatabase.passengers[index] = {
      ...mockDatabase.passengers[index],
      ...data,
    };
    saveMockDB(); 
    return { success: true, message: "Passenger updated successfully" };
  });
}

function mockDeletePassenger(id) {
  return simulateNetwork().then(() => {
    const isLinked = mockDatabase.cards.some((c) => c.passenger_id == id);
    if (isLinked)
      throw new Error(
        "Cannot delete passenger: A smart card is linked to this user."
      );

    mockDatabase.passengers = mockDatabase.passengers.filter(
      (p) => p.passenger_id != id
    );
    saveMockDB(); 
    return { success: true, message: "Passenger deleted successfully" };
  });
}

// --- CARD MOCKS ---
function mockCreateCard(data) {
  return simulateNetwork().then(() => {
    if (mockDatabase.cards.some((c) => c.card_number === data.card_number)) {
      throw new Error("Duplicate card number. This card already exists.");
    }
    const newId =
      mockDatabase.cards.length > 0
        ? Math.max(...mockDatabase.cards.map((c) => c.card_id)) + 1
        : 1;
    mockDatabase.cards.push({ card_id: newId, ...data });
    saveMockDB(); 
    return { success: true, message: "Smart card issued successfully" };
  });
}

function mockUpdateCard(id, data) {
  return simulateNetwork().then(() => {
    const index = mockDatabase.cards.findIndex((c) => c.card_id == id);
    if (index === -1) throw new Error("Card not found");

    if (
      mockDatabase.cards.some(
        (c) => c.card_number === data.card_number && c.card_id != id
      )
    ) {
      throw new Error("Duplicate card number. This card already exists.");
    }

    mockDatabase.cards[index] = { ...mockDatabase.cards[index], ...data };
    saveMockDB(); 
    return { success: true, message: "Smart card updated successfully" };
  });
}

function mockDeleteCard(id) {
  return simulateNetwork().then(() => {
    mockDatabase.cards = mockDatabase.cards.filter((c) => c.card_id != id);
    saveMockDB(); 
    return { success: true, message: "Smart card deleted successfully" };
  });
}

// --- STATION MOCKS ---
function mockCreateStation(data) {
  return simulateNetwork().then(() => {
    const newId =
      mockDatabase.stations.length > 0
        ? Math.max(...mockDatabase.stations.map((s) => s.station_id)) + 1
        : 1;
    mockDatabase.stations.push({ station_id: newId, ...data });
    saveMockDB();
    return { success: true, message: "Station added successfully" };
  });
}

function mockUpdateStation(id, data) {
  return simulateNetwork().then(() => {
    const index = mockDatabase.stations.findIndex((s) => s.station_id == id);
    if (index === -1) throw new Error("Station not found");

    mockDatabase.stations[index] = { ...mockDatabase.stations[index], ...data };
    saveMockDB();
    return { success: true, message: "Station updated successfully" };
  });
}

function mockDeleteStation(id) {
  return simulateNetwork().then(() => {
    const isLinked = mockDatabase.transactions.some((t) => t.station_id == id);
    if (isLinked)
      throw new Error("Cannot delete station: Transactions are recorded here.");

    mockDatabase.stations = mockDatabase.stations.filter(
      (s) => s.station_id != id
    );
    saveMockDB();
    return { success: true, message: "Station deleted successfully" };
  });
}

// --- TRANSACTION MOCKS ---
function mockCreateTransaction(data) {
    return simulateNetwork().then(() => {
        const cardIndex = mockDatabase.cards.findIndex(c => c.card_id == data.card_id);
        if (cardIndex === -1) throw new Error("Smart card not found.");
        
        const card = mockDatabase.cards[cardIndex];
        if (card.balance < data.fare_amount) {
            throw new Error(`Insufficient balance. Current balance is ₹ ${card.balance.toFixed(2)}`);
        }
        
        mockDatabase.cards[cardIndex].balance -= data.fare_amount;

        const newId = mockDatabase.transactions.length > 0 ? Math.max(...mockDatabase.transactions.map(t => t.transaction_id)) + 1 : 1;
        
        const now = new Date();
        const dateStr = now.toISOString().replace('T', ' ').substring(0, 19);

        mockDatabase.transactions.push({ 
            transaction_id: newId, 
            transaction_date: dateStr,
            ...data 
        });
        
        saveMockDB();
        return { success: true, message: "Transaction recorded and fare deducted successfully" };
    });
}

function mockUpdateTransaction(id, data) {
  return simulateNetwork().then(() => {
    const index = mockDatabase.transactions.findIndex(
      (t) => t.transaction_id == id
    );
    if (index === -1) throw new Error("Transaction not found");

    mockDatabase.transactions[index] = {
      ...mockDatabase.transactions[index],
      ...data,
    };
    saveMockDB();
    return { success: true, message: "Transaction updated successfully" };
  });
}

function mockDeleteTransaction(id) {
  return simulateNetwork().then(() => {
    mockDatabase.transactions = mockDatabase.transactions.filter(
      (t) => t.transaction_id != id
    );
    saveMockDB();
    return { success: true, message: "Transaction deleted successfully" };
  });
}