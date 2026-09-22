let currentTransactions = [];
let cardMap = {};
let stationMap = {};
let passengerMap = {};

document.addEventListener("DOMContentLoaded", async () => {
  await initializePage();

  document
    .getElementById("transaction-form")
    .addEventListener("submit", handleFormSubmit);

  document.getElementById("cancel-btn").addEventListener("click", () => {
    resetForm("transaction-form", "form-title", "New Transaction");
    document.getElementById("transaction_id").value = "";
  });

  document
    .getElementById("search-input")
    .addEventListener("input", handleSearch);
});

async function initializePage() {
  try {
    // Load transactions, cards, stations, and passengers concurrently
    const [passRes, cardRes, statRes] = await Promise.all([
      getPassengers(),
      getCards(),
      getStations(),
    ]);

    // Build passenger lookup map
    passRes.data.forEach(
      (p) => (passengerMap[p.passenger_id] = p.passenger_name),
    );

    // Populate Smart Card Dropdown (value = card_id, text = card_number + passenger)
    const cardDropdown = document.getElementById("card_id");
    cardRes.data.forEach((c) => {
      const pName = passengerMap[c.passenger_id] || "Unknown";
      cardMap[c.card_id] = { number: c.card_number, passenger: pName };

      const option = document.createElement("option");
      option.value = c.card_id;
      option.textContent = `${c.card_number} (${pName})`;
      cardDropdown.appendChild(option);
    });

    // Populate Station Dropdown (value = station_id, text = station_name + line_name)
    const statDropdown = document.getElementById("station_id");
    statRes.data.forEach((s) => {
      stationMap[s.station_id] = { name: s.station_name, line: s.line_name };

      const option = document.createElement("option");
      option.value = s.station_id;
      option.textContent = `${s.station_name} - ${s.line_name}`;
      statDropdown.appendChild(option);
    });

    await loadTransactions();
  } catch (error) {
    showMessage(error.message, true);
  }
}

async function loadTransactions() {
  try {
    const response = await getTransactions();
    currentTransactions = response.data;
    renderTable(currentTransactions);
  } catch (error) {
    showMessage(error.message, true);
  }
}

function renderTable(data) {
  const tbody = document.getElementById("transactions-body");
  tbody.innerHTML = "";

  if (data.length === 0) {
    tbody.innerHTML =
      '<tr id="empty-state"><td colspan="8">No records found</td></tr>';
    return;
  }

  data.forEach((t) => {
    const tr = document.createElement("tr");

    // Use lookup maps to display readable names
    const cardInfo = cardMap[t.card_id] || {
      number: "Unknown",
      passenger: "Unknown",
    };
    const statInfo = stationMap[t.station_id] || {
      name: "Unknown",
      line: "Unknown",
    };

    tr.innerHTML = `
            <td>${escapeHTML(t.transaction_id)}</td>
            <td>${escapeHTML(cardInfo.passenger)}</td>
            <td>${escapeHTML(cardInfo.number)}</td>
            <td>${escapeHTML(statInfo.name)}</td>
            <td>${escapeHTML(statInfo.line)}</td>
            <td>${escapeHTML(t.transaction_date)}</td>
            <td>₹ ${Number(t.fare_amount).toFixed(2)}</td>
            <td>
                <button onclick="editTransaction(${t.transaction_id})">Edit</button>
                <button onclick="deleteTransactionAction(${t.transaction_id})" style="background-color: #dc3545;">Delete</button>
            </td>
        `;
    tbody.appendChild(tr);
  });
}

async function handleFormSubmit(e) {
  e.preventDefault();

  const id = document.getElementById("transaction_id").value;
  const cardId = document.getElementById("card_id").value;
  const stationId = document.getElementById("station_id").value;
  const fare = document.getElementById("fare_amount").value;

  // Strict Payload: Send only card_id, station_id, and fare_amount
  const payload = {
    card_id: parseInt(cardId),
    station_id: parseInt(stationId),
    fare_amount: parseFloat(fare),
  };

  try {
    document.getElementById("submit-btn").disabled = true;
    let response;

    if (id) {
      response = await updateTransaction(id, payload);
    } else {
      response = await createTransaction(payload);
    }

    showMessage(response.message);
    resetForm("transaction-form", "form-title", "New Transaction");
    await loadTransactions();
  } catch (error) {
    showMessage(error.message, true);
  } finally {
    document.getElementById("submit-btn").disabled = false;
  }
}

window.editTransaction = function (id) {
  const transaction = currentTransactions.find((t) => t.transaction_id == id);
  if (!transaction) return;

  document.getElementById("transaction_id").value = transaction.transaction_id;
  document.getElementById("card_id").value = transaction.card_id;
  document.getElementById("station_id").value = transaction.station_id;
  document.getElementById("fare_amount").value = transaction.fare_amount;

  document.getElementById("form-title").textContent = "Edit Transaction";
  document.getElementById("submit-btn").textContent = "Update";
  document.getElementById("cancel-btn").style.display = "inline-block";
};

window.deleteTransactionAction = async function (id) {
  if (!confirm("Are you sure you want to delete this transaction?")) return;

  try {
    const response = await deleteTransaction(id);
    showMessage(response.message);
    await loadTransactions();

    if (document.getElementById("transaction_id").value == id) {
      resetForm("transaction-form", "form-title", "New Transaction");
      document.getElementById("transaction_id").value = "";
    }
  } catch (error) {
    showMessage(error.message, true);
  }
};

function handleSearch(e) {
  const term = e.target.value.toLowerCase();
  const filtered = currentTransactions.filter((t) => {
    const cardInfo = cardMap[t.card_id] || { number: "", passenger: "" };
    const statInfo = stationMap[t.station_id] || { name: "", line: "" };

    return (
      cardInfo.passenger.toLowerCase().includes(term) ||
      cardInfo.number.toLowerCase().includes(term) ||
      statInfo.name.toLowerCase().includes(term) ||
      (t.transaction_date && t.transaction_date.toLowerCase().includes(term))
    );
  });
  renderTable(filtered);
}
