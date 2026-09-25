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

    const isLinked =
      mockDatabase.transactions.some(
        (t) => t.card_id == id
      );


    if (isLinked) {

      throw new Error(
        "Smart card cannot be deleted because transactions are linked to this card"
      );
    }


    mockDatabase.cards =
      mockDatabase.cards.filter(
        (c) => c.card_id != id
      );


    saveMockDB();


    return {
      success: true,
      message: "Smart card deleted successfully"
    };
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

// -------------------------
// CREATE transaction
// -------------------------

function mockCreateTransaction(data) {

  return simulateNetwork().then(() => {

    const cardIndex =
      mockDatabase.cards.findIndex(
        (c) => c.card_id == data.card_id
      );


    if (cardIndex === -1) {
      throw new Error(
        "Smart card not found"
      );
    }


    const stationExists =
      mockDatabase.stations.some(
        (s) => s.station_id == data.station_id
      );


    if (!stationExists) {
      throw new Error(
        "Station not found"
      );
    }


    const card =
      mockDatabase.cards[cardIndex];


    const fare =
      Number(data.fare_amount);


    if (Number(card.balance) < fare) {

      throw new Error(
        `Insufficient balance. Current balance is ₹${Number(card.balance).toFixed(2)}`
      );
    }


    card.balance =
      Number(card.balance) - fare;


    const newId =
      mockDatabase.transactions.length > 0
        ? Math.max(
            ...mockDatabase.transactions.map(
              (t) => t.transaction_id
            )
          ) + 1
        : 1;


    const now =
      new Date();


    const dateStr =
      now
        .toISOString()
        .replace('T', ' ')
        .substring(0, 19);


    mockDatabase.transactions.push({
      transaction_id: newId,
      transaction_date: dateStr,
      ...data
    });


    saveMockDB();


    return {
      success: true,
      message:
        "Transaction recorded and fare deducted successfully",
      transaction_id: newId,
      remaining_balance:
        card.balance
    };
  });
}



// -------------------------
// UPDATE transaction
// -------------------------

function mockUpdateTransaction(id, data) {

  return simulateNetwork().then(() => {

    const transactionIndex =
      mockDatabase.transactions.findIndex(
        (t) => t.transaction_id == id
      );


    if (transactionIndex === -1) {
      throw new Error(
        "Transaction not found"
      );
    }


    const stationExists =
      mockDatabase.stations.some(
        (s) => s.station_id == data.station_id
      );


    if (!stationExists) {
      throw new Error(
        "Station not found"
      );
    }


    const oldTransaction =
      mockDatabase.transactions[
        transactionIndex
      ];


    const oldCardIndex =
      mockDatabase.cards.findIndex(
        (c) =>
          c.card_id == oldTransaction.card_id
      );


    const newCardIndex =
      mockDatabase.cards.findIndex(
        (c) => c.card_id == data.card_id
      );


    if (newCardIndex === -1) {
      throw new Error(
        "Smart card not found"
      );
    }


    const oldFare =
      Number(oldTransaction.fare_amount);


    const newFare =
      Number(data.fare_amount);


    let remainingBalance;


    // Same card
    if (
      oldTransaction.card_id ==
      data.card_id
    ) {

      const card =
        mockDatabase.cards[
          newCardIndex
        ];


      const availableBalance =
        Number(card.balance) +
        oldFare;


      if (
        availableBalance <
        newFare
      ) {

        throw new Error(
          `Insufficient balance. Available balance after reversing old fare is ₹${availableBalance.toFixed(2)}`
        );
      }


      card.balance =
        availableBalance -
        newFare;


      remainingBalance =
        card.balance;
    }


    // Card changed
    else {

      const newCard =
        mockDatabase.cards[
          newCardIndex
        ];


      if (
        Number(newCard.balance) <
        newFare
      ) {

        throw new Error(
          `Insufficient balance on new smart card. Current balance is ₹${Number(newCard.balance).toFixed(2)}`
        );
      }


      // Refund old card
      mockDatabase.cards[
        oldCardIndex
      ].balance =
        Number(
          mockDatabase.cards[
            oldCardIndex
          ].balance
        ) +
        oldFare;


      // Deduct from new card
      newCard.balance =
        Number(newCard.balance) -
        newFare;


      remainingBalance =
        newCard.balance;
    }


    mockDatabase.transactions[
      transactionIndex
    ] = {
      ...oldTransaction,
      ...data
    };


    saveMockDB();


    return {
      success: true,
      message:
        "Transaction updated and card balance adjusted successfully",
      remaining_balance:
        remainingBalance
    };
  });
}



// -------------------------
// DELETE transaction
// -------------------------

function mockDeleteTransaction(id) {

  return simulateNetwork().then(() => {

    const transactionIndex =
      mockDatabase.transactions.findIndex(
        (t) => t.transaction_id == id
      );


    if (transactionIndex === -1) {
      throw new Error(
        "Transaction not found"
      );
    }


    const transaction =
      mockDatabase.transactions[
        transactionIndex
      ];


    const cardIndex =
      mockDatabase.cards.findIndex(
        (c) =>
          c.card_id ==
          transaction.card_id
      );


    if (cardIndex === -1) {
      throw new Error(
        "Smart card not found"
      );
    }


    const fare =
      Number(
        transaction.fare_amount
      );


    // Refund fare
    mockDatabase.cards[
      cardIndex
    ].balance =
      Number(
        mockDatabase.cards[
          cardIndex
        ].balance
      ) +
      fare;


    const remainingBalance =
      mockDatabase.cards[
        cardIndex
      ].balance;


    mockDatabase.transactions.splice(
      transactionIndex,
      1
    );


    saveMockDB();


    return {
      success: true,
      message:
        "Transaction deleted and fare refunded successfully",
      remaining_balance:
        remainingBalance
    };
  });
}