// JavaScript for Transactions operations
// Clean and straightforward syntax for DBMS Lab Project

let allTransactions = [];
let allCards = [];
let allStations = [];
let cardMap = {};
let stationMap = {};
let sortCol = "transaction_id";
let sortDir = "asc";

document.addEventListener("DOMContentLoaded", async function () {
  // Page 1: Show Transactions
  if (document.getElementById("transaction-show-table")) {
    await initTransactionsPage("show");
  }

  // Page 2: Add Transaction
  if (document.getElementById("transaction-add-form")) {
    await loadCardsAndStationsDropdowns("card_id", "station_id");
    document.getElementById("transaction-add-form").addEventListener("submit", handleAddTransaction);
  }

  // Page 3: Update Transaction
  if (document.getElementById("transaction-update-table")) {
    await loadCardsAndStationsDropdowns("edit_card_id", "edit_station_id");
    await initTransactionsPage("update");
    document.getElementById("transaction-update-form").addEventListener("submit", handleUpdateTransaction);
  }

  // Page 4: Delete Transaction
  if (document.getElementById("transaction-delete-table")) {
    await initTransactionsPage("delete");
  }
});

// Load cards and stations into dropdown selects
async function loadCardsAndStationsDropdowns(cardSelectId, stationSelectId) {
  try {
    const cardRes = await getCards();
    const statRes = await getStations();

    allCards = cardRes.data ? cardRes.data : [];
    allStations = statRes.data ? statRes.data : [];

    const cardDrop = document.getElementById(cardSelectId);
    if (cardDrop) {
      cardDrop.innerHTML = '<option value="">Select a smart card...</option>';
      for (let i = 0; i < allCards.length; i++) {
        const c = allCards[i];
        const pName = c.passenger_name ? c.passenger_name : "Passenger #" + c.passenger_id;
        cardMap[c.card_id] = { number: c.card_number, passenger: pName };

        const opt = document.createElement("option");
        opt.value = c.card_id;
        opt.textContent = c.card_number + " (" + pName + ") - Balance: " + formatCurrency(c.balance);
        cardDrop.appendChild(opt);
      }
    }

    const statDrop = document.getElementById(stationSelectId);
    if (statDrop) {
      statDrop.innerHTML = '<option value="">Select a station...</option>';
      for (let j = 0; j < allStations.length; j++) {
        const s = allStations[j];
        stationMap[s.station_id] = { name: s.station_name, line: s.line_name };

        const opt = document.createElement("option");
        opt.value = s.station_id;
        opt.textContent = s.station_name + " (" + s.line_name + ")";
        statDrop.appendChild(opt);
      }
    }
  } catch (err) {
    showMessage(err.message, true);
  }
}

// Fetch all transactions, cards, and stations for show/update/delete pages
async function initTransactionsPage(mode) {
  try {
    const tRes = await getTransactions();
    const cRes = await getCards();
    const sRes = await getStations();

    const rawTransactions = tRes.data ? tRes.data : [];
    allCards = cRes.data ? cRes.data : [];
    allStations = sRes.data ? sRes.data : [];

    for (let i = 0; i < allCards.length; i++) {
      const c = allCards[i];
      const pName = c.passenger_name ? c.passenger_name : "Passenger #" + c.passenger_id;
      cardMap[c.card_id] = { number: c.card_number, passenger: pName };
    }

    for (let j = 0; j < allStations.length; j++) {
      const s = allStations[j];
      stationMap[s.station_id] = { name: s.station_name, line: s.line_name };
    }

    allTransactions = [];
    for (let k = 0; k < rawTransactions.length; k++) {
      allTransactions.push(prepareTransaction(rawTransactions[k]));
    }

    fillDatalists();
    setupFilterEvents(mode);
    renderTransactionsTable(mode);
  } catch (err) {
    showMessage(err.message, true);
  }
}

// Attach composite search properties to each transaction item
function prepareTransaction(t) {
  const cardNum = t.card_number ? t.card_number : "Card #" + t.card_id;
  const passName = t.passenger_name ? t.passenger_name : "";
  const statName = t.station_name ? t.station_name : "Station #" + t.station_id;
  const lineName = t.line_name ? t.line_name : "";
  const rawDate = t.transaction_date ? String(t.transaction_date) : "";
  const dateFormatted = formatDateTime(t.transaction_date);

  const cardDisplay = (cardNum + " " + passName).trim();
  const stationDisplay = (statName + " " + lineName).trim();
  const fareDisplay = Number(t.fare_amount).toFixed(2);
  const dateRaw = rawDate.length >= 10 ? rawDate.substring(0, 10) : "";

  return {
    transaction_id: t.transaction_id,
    card_id: t.card_id,
    card_number: t.card_number,
    passenger_name: t.passenger_name,
    station_id: t.station_id,
    station_name: t.station_name,
    line_name: t.line_name,
    fare_amount: t.fare_amount,
    transaction_date: t.transaction_date,
    card_display: cardDisplay,
    station_display: stationDisplay,
    fare_display: fareDisplay,
    date_display: dateFormatted,
    date_raw: dateRaw
  };
}

function formatDateTime(dateStr) {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    return String(dateStr);
  }
  return d.toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function fillDatalists() {
  const ids = [];
  const cards = [];
  const stations = [];
  const fares = [];
  const dates = [];

  for (let i = 0; i < allTransactions.length; i++) {
    const t = allTransactions[i];
    ids.push(t.transaction_id);

    const pass = t.passenger_name ? t.passenger_name : "N/A";
    cards.push(t.card_number + " (" + pass + ")");

    stations.push(t.station_name + " (" + t.line_name + ")");
    fares.push(t.fare_display);

    if (t.date_raw) {
      dates.push(t.date_raw);
    }
  }

  populateDatalist("dl-id", ids);
  populateDatalist("dl-card", cards);
  populateDatalist("dl-station", stations);
  populateDatalist("dl-fare", fares);
  populateDatalist("dl-date", dates);
}

function setupFilterEvents(mode) {
  const fields = ["id", "card", "station", "fare", "date"];

  for (let i = 0; i < fields.length; i++) {
    const f = fields[i];

    // Input typing listener
    const input = document.getElementById("filter-" + f);
    if (input) {
      input.addEventListener("input", function () {
        renderTransactionsTable(mode);
      });
    }

    // Sort toggle button listener
    const sortBtn = document.getElementById("sort-" + f);
    if (sortBtn) {
      sortBtn.addEventListener("click", function () {
        const colMap = {
          id: "transaction_id",
          card: "card_number",
          station: "station_name",
          fare: "fare_amount",
          date: "transaction_date"
        };
        const col = colMap[f];

        if (sortCol === col) {
          if (sortDir === "asc") {
            sortDir = "desc";
          } else if (sortDir === "desc") {
            sortCol = null;
            sortDir = null;
          } else {
            sortDir = "asc";
          }
        } else {
          sortCol = col;
          sortDir = "asc";
        }

        updateSortButtons();
        renderTransactionsTable(mode);
      });
    }
  }

  // Clear filters button
  const clearBtn = document.getElementById("btn-clear-filter");
  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      for (let j = 0; j < fields.length; j++) {
        const inp = document.getElementById("filter-" + fields[j]);
        if (inp) {
          inp.value = "";
        }
      }
      sortCol = "transaction_id";
      sortDir = "asc";
      updateSortButtons();
      renderTransactionsTable(mode);
    });
  }
}

function updateSortButtons() {
  const fields = [
    { id: "sort-id", col: "transaction_id" },
    { id: "sort-card", col: "card_number" },
    { id: "sort-station", col: "station_name" },
    { id: "sort-fare", col: "fare_amount" },
    { id: "sort-date", col: "transaction_date" }
  ];

  for (let i = 0; i < fields.length; i++) {
    const f = fields[i];
    const btn = document.getElementById(f.id);
    if (!btn) continue;

    btn.classList.remove("active-sort");

    if (sortCol === f.col && sortDir) {
      btn.classList.add("active-sort");
      btn.textContent = sortDir === "asc" ? "▲ ASC" : "▼ DESC";
    } else {
      btn.textContent = "⇅";
    }
  }
}

function renderTransactionsTable(mode) {
  const filters = {
    transaction_id: getInputValue("filter-id"),
    card_display: getInputValue("filter-card"),
    station_display: getInputValue("filter-station"),
    fare_display: getInputValue("filter-fare"),
    date_display: getInputValue("filter-date")
  };

  const filtered = filterAndSort(allTransactions, filters, sortCol, sortDir);

  const countEl = document.getElementById("record-count");
  if (countEl) {
    countEl.textContent = "Showing " + filtered.length + " of " + allTransactions.length + " transactions";
  }

  const tbody = document.getElementById("transaction-" + mode + "-tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  const colSpanMap = { show: 7, update: 7, delete: 8 };
  const totalCols = colSpanMap[mode] ? colSpanMap[mode] : 7;

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="' + totalCols + '" style="text-align:center; color:#888;">No matching transactions found</td></tr>';
    return;
  }

  for (let j = 0; j < filtered.length; j++) {
    const t = filtered[j];
    const tr = document.createElement("tr");
    tr.id = "row-" + t.transaction_id;

    const passName = t.passenger_name ? escapeHTML(t.passenger_name) : "N/A";

    if (mode === "show") {
      tr.innerHTML =
        "<td><strong>" + escapeHTML(t.transaction_id) + "</strong></td>" +
        "<td>" + escapeHTML(t.card_number) + "</td>" +
        "<td>" + passName + "</td>" +
        "<td>" + escapeHTML(t.station_name) + "</td>" +
        "<td>" + escapeHTML(t.line_name) + "</td>" +
        "<td>" + formatCurrency(t.fare_amount) + "</td>" +
        "<td>" + escapeHTML(t.date_display) + "</td>";
    } else if (mode === "update") {
      tr.innerHTML =
        "<td><strong>" + escapeHTML(t.transaction_id) + "</strong></td>" +
        "<td>" + escapeHTML(t.card_number) + "</td>" +
        "<td>" + passName + "</td>" +
        "<td>" + escapeHTML(t.station_name) + "</td>" +
        "<td>" + formatCurrency(t.fare_amount) + "</td>" +
        "<td>" + escapeHTML(t.date_display) + "</td>" +
        '<td><button type="button" class="btn btn-warning btn-sm" onclick="selectTransactionForUpdate(' + t.transaction_id + ')">✏️ Update</button></td>';
    } else if (mode === "delete") {
      tr.innerHTML =
        "<td><strong>" + escapeHTML(t.transaction_id) + "</strong></td>" +
        "<td>" + escapeHTML(t.card_number) + "</td>" +
        "<td>" + passName + "</td>" +
        "<td>" + escapeHTML(t.station_name) + "</td>" +
        "<td>" + escapeHTML(t.line_name) + "</td>" +
        "<td>" + formatCurrency(t.fare_amount) + "</td>" +
        "<td>" + escapeHTML(t.date_display) + "</td>" +
        '<td><button type="button" class="btn btn-danger btn-sm" onclick="selectTransactionForDelete(' + t.transaction_id + ", '" + escapeHTML(t.card_number) + "')\">🗑️ Delete</button></td>";
    }

    tbody.appendChild(tr);
  }
}

// ----------------- ADD TRANSACTION -----------------
async function handleAddTransaction(e) {
  e.preventDefault();

  const idVal = getInputValue("transaction_id");
  const cardIdVal = getInputValue("card_id");
  const stationIdVal = getInputValue("station_id");
  const fareVal = getInputValue("fare_amount");

  const idNum = parseInt(idVal, 10);
  if (isNaN(idNum) || idNum <= 0) {
    showMessage("Transaction ID must be a positive integer.", true);
    return;
  }

  const payload = {
    transaction_id: idNum,
    card_id: parseInt(cardIdVal, 10),
    station_id: parseInt(stationIdVal, 10),
    fare_amount: parseFloat(fareVal)
  };

  try {
    const res = await createTransaction(payload);
    showMessage(res.message ? res.message : "Transaction recorded successfully!");
    document.getElementById("transaction-add-form").reset();
  } catch (err) {
    showMessage(err.message, true);
  }
}

// ----------------- UPDATE TRANSACTION -----------------
window.selectTransactionForUpdate = function (id) {
  let t = null;
  for (let i = 0; i < allTransactions.length; i++) {
    if (allTransactions[i].transaction_id == id) {
      t = allTransactions[i];
      break;
    }
  }
  if (!t) return;

  const allRows = document.querySelectorAll("#transaction-update-tbody tr");
  for (let j = 0; j < allRows.length; j++) {
    allRows[j].classList.remove("selected-row");
  }
  const row = document.getElementById("row-" + id);
  if (row) {
    row.classList.add("selected-row");
  }

  document.getElementById("edit_transaction_id").value = t.transaction_id;
  document.getElementById("display-transaction-id").textContent = t.transaction_id;
  document.getElementById("edit_card_id").value = t.card_id;
  document.getElementById("edit_station_id").value = t.station_id;
  document.getElementById("edit_fare_amount").value = t.fare_amount;

  const area = document.getElementById("update-form-area");
  area.style.display = "block";
  area.scrollIntoView({ behavior: "smooth" });
};

window.cancelUpdate = function () {
  const area = document.getElementById("update-form-area");
  if (area) {
    area.style.display = "none";
  }
  const allRows = document.querySelectorAll("#transaction-update-tbody tr");
  for (let i = 0; i < allRows.length; i++) {
    allRows[i].classList.remove("selected-row");
  }
};

async function handleUpdateTransaction(e) {
  e.preventDefault();

  const id = document.getElementById("edit_transaction_id").value;
  const payload = {
    card_id: parseInt(document.getElementById("edit_card_id").value, 10),
    station_id: parseInt(document.getElementById("edit_station_id").value, 10),
    fare_amount: parseFloat(document.getElementById("edit_fare_amount").value)
  };

  try {
    const res = await updateTransaction(id, payload);
    showMessage(res.message ? res.message : "Transaction updated successfully!");
    cancelUpdate();

    const r = await getTransactions();
    const rawTransactions = r.data ? r.data : [];
    allTransactions = [];
    for (let k = 0; k < rawTransactions.length; k++) {
      allTransactions.push(prepareTransaction(rawTransactions[k]));
    }
    fillDatalists();
    renderTransactionsTable("update");
  } catch (err) {
    showMessage(err.message, true);
  }
}

// ----------------- DELETE TRANSACTION -----------------
window.selectTransactionForDelete = async function (id, cardNum) {
  const confirmed = confirm("Are you sure you want to delete Transaction #" + id + " (Card: " + cardNum + ")?");
  if (!confirmed) {
    return;
  }

  try {
    const res = await deleteTransaction(id);
    showMessage(res.message ? res.message : "Transaction deleted successfully!");

    const r = await getTransactions();
    const rawTransactions = r.data ? r.data : [];
    allTransactions = [];
    for (let k = 0; k < rawTransactions.length; k++) {
      allTransactions.push(prepareTransaction(rawTransactions[k]));
    }
    fillDatalists();
    renderTransactionsTable("delete");
  } catch (err) {
    showMessage(err.message, true);
  }
};
