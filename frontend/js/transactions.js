// Simple and readable JavaScript for Transactions operations

let allTransactions = [];
let allCards = [];
let allStations = [];
let cardMap = {};
let stationMap = {};
let sortCol = "transaction_id";
let sortDir = "asc";

document.addEventListener("DOMContentLoaded", async () => {
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
    const [cardRes, statRes] = await Promise.all([getCards(), getStations()]);
    allCards = cardRes.data || [];
    allStations = statRes.data || [];

    const cardDrop = document.getElementById(cardSelectId);
    if (cardDrop) {
      cardDrop.innerHTML = '<option value="">Select a smart card...</option>';
      allCards.forEach((c) => {
        const pName = c.passenger_name || `Passenger #${c.passenger_id}`;
        cardMap[c.card_id] = { number: c.card_number, passenger: pName };
        const opt = document.createElement("option");
        opt.value = c.card_id;
        opt.textContent = `${c.card_number} (${pName}) - Balance: ₹${Number(c.balance).toFixed(2)}`;
        cardDrop.appendChild(opt);
      });
    }

    const statDrop = document.getElementById(stationSelectId);
    if (statDrop) {
      statDrop.innerHTML = '<option value="">Select a station...</option>';
      allStations.forEach((s) => {
        stationMap[s.station_id] = { name: s.station_name, line: s.line_name };
        const opt = document.createElement("option");
        opt.value = s.station_id;
        opt.textContent = `${s.station_name} (${s.line_name})`;
        statDrop.appendChild(opt);
      });
    }
  } catch (err) {
    showMessage(err.message, true);
  }
}

// Fetch all transactions, cards, and stations for show/update/delete pages
async function initTransactionsPage(mode) {
  try {
    const [tRes, cRes, sRes] = await Promise.all([getTransactions(), getCards(), getStations()]);
    allTransactions = (tRes.data || []).map(prepareTransaction);
    allCards = cRes.data || [];
    allStations = sRes.data || [];

    allCards.forEach((c) => {
      cardMap[c.card_id] = { number: c.card_number, passenger: c.passenger_name || `Passenger #${c.passenger_id}` };
    });

    allStations.forEach((s) => {
      stationMap[s.station_id] = { name: s.station_name, line: s.line_name };
    });

    fillDatalists();
    setupFilterEvents(mode);
    renderTransactionsTable(mode);
  } catch (err) {
    showMessage(err.message, true);
  }
}

// Attach composite search properties to each transaction item
function prepareTransaction(t) {
  const cardNum = t.card_number || `Card #${t.card_id}`;
  const passName = t.passenger_name || "";
  const statName = t.station_name || `Station #${t.station_id}`;
  const lineName = t.line_name || "";
  const rawDate = t.transaction_date ? String(t.transaction_date) : "";
  const dateFormatted = formatDateTime(t.transaction_date);

  return {
    ...t,
    card_display: `${cardNum} ${passName}`.trim(),
    station_display: `${statName} ${lineName}`.trim(),
    fare_display: Number(t.fare_amount).toFixed(2),
    date_display: dateFormatted,
    date_raw: rawDate.substring(0, 10),
  };
}

function formatDateTime(dateStr) {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fillDatalists() {
  populateDatalist("dl-id", allTransactions.map((t) => t.transaction_id));
  populateDatalist("dl-card", allTransactions.map((t) => `${t.card_number} (${t.passenger_name || "N/A"})`));
  populateDatalist("dl-station", allTransactions.map((t) => `${t.station_name} (${t.line_name})`));
  populateDatalist("dl-fare", allTransactions.map((t) => t.fare_display));
  populateDatalist("dl-date", allTransactions.map((t) => t.date_raw).filter(Boolean));
}

function setupFilterEvents(mode) {
  const fields = ["id", "card", "station", "fare", "date"];

  fields.forEach((f) => {
    const input = document.getElementById(`filter-${f}`);
    if (input) {
      input.addEventListener("input", () => renderTransactionsTable(mode));
    }

    const sortBtn = document.getElementById(`sort-${f}`);
    if (sortBtn) {
      sortBtn.addEventListener("click", () => {
        const colMap = {
          id: "transaction_id",
          card: "card_number",
          station: "station_name",
          fare: "fare_amount",
          date: "transaction_date",
        };
        const col = colMap[f];

        if (sortCol === col) {
          if (sortDir === "asc") sortDir = "desc";
          else if (sortDir === "desc") {
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
  });

  const clearBtn = document.getElementById("btn-clear-filter");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      fields.forEach((f) => {
        const inp = document.getElementById(`filter-${f}`);
        if (inp) inp.value = "";
      });
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
    { id: "sort-date", col: "transaction_date" },
  ];

  fields.forEach((f) => {
    const btn = document.getElementById(f.id);
    if (!btn) return;
    btn.classList.remove("active-sort");

    if (sortCol === f.col && sortDir) {
      btn.classList.add("active-sort");
      btn.textContent = sortDir === "asc" ? "▲ ASC" : "▼ DESC";
    } else {
      btn.textContent = "⇅";
    }
  });
}

function renderTransactionsTable(mode) {
  const filters = {
    transaction_id: (document.getElementById("filter-id")?.value || ""),
    card_display: (document.getElementById("filter-card")?.value || ""),
    station_display: (document.getElementById("filter-station")?.value || ""),
    fare_display: (document.getElementById("filter-fare")?.value || ""),
    date_display: (document.getElementById("filter-date")?.value || ""),
  };

  const filtered = filterAndSort(allTransactions, filters, sortCol, sortDir);

  const countEl = document.getElementById("record-count");
  if (countEl) {
    countEl.textContent = `Showing ${filtered.length} of ${allTransactions.length} transactions`;
  }

  const tbody = document.getElementById(`transaction-${mode}-tbody`);
  if (!tbody) return;
  tbody.innerHTML = "";

  const colSpanMap = { show: 7, update: 7, delete: 8 };
  const totalCols = colSpanMap[mode] || 7;

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="${totalCols}" style="text-align:center; color:#888;">No matching transactions found</td></tr>`;
    return;
  }

  filtered.forEach((t) => {
    const tr = document.createElement("tr");
    tr.id = `row-${t.transaction_id}`;

    if (mode === "show") {
      tr.innerHTML = `
        <td><strong>${escapeHTML(t.transaction_id)}</strong></td>
        <td>${escapeHTML(t.card_number)}</td>
        <td>${escapeHTML(t.passenger_name || "N/A")}</td>
        <td>${escapeHTML(t.station_name)}</td>
        <td>${escapeHTML(t.line_name)}</td>
        <td>${formatCurrency(t.fare_amount)}</td>
        <td>${escapeHTML(t.date_display)}</td>
      `;
    } else if (mode === "update") {
      tr.innerHTML = `
        <td><strong>${escapeHTML(t.transaction_id)}</strong></td>
        <td>${escapeHTML(t.card_number)}</td>
        <td>${escapeHTML(t.passenger_name || "N/A")}</td>
        <td>${escapeHTML(t.station_name)}</td>
        <td>${formatCurrency(t.fare_amount)}</td>
        <td>${escapeHTML(t.date_display)}</td>
        <td><button type="button" class="btn btn-warning btn-sm" onclick="selectTransactionForUpdate(${t.transaction_id})">✏️ Update</button></td>
      `;
    } else if (mode === "delete") {
      tr.innerHTML = `
        <td><strong>${escapeHTML(t.transaction_id)}</strong></td>
        <td>${escapeHTML(t.card_number)}</td>
        <td>${escapeHTML(t.passenger_name || "N/A")}</td>
        <td>${escapeHTML(t.station_name)}</td>
        <td>${escapeHTML(t.line_name)}</td>
        <td>${formatCurrency(t.fare_amount)}</td>
        <td>${escapeHTML(t.date_display)}</td>
        <td><button type="button" class="btn btn-danger btn-sm" onclick="selectTransactionForDelete(${t.transaction_id}, '${escapeHTML(t.card_number)}')">🗑️ Delete</button></td>
      `;
    }

    tbody.appendChild(tr);
  });
}

// ----------------- ADD TRANSACTION -----------------
async function handleAddTransaction(e) {
  e.preventDefault();

  const idVal = document.getElementById("transaction_id").value.trim();
  const cardIdVal = document.getElementById("card_id").value;
  const stationIdVal = document.getElementById("station_id").value;
  const fareVal = document.getElementById("fare_amount").value.trim();

  const idNum = parseInt(idVal, 10);
  if (isNaN(idNum) || idNum <= 0) {
    return showMessage("Transaction ID must be a positive integer.", true);
  }

  const payload = {
    transaction_id: idNum,
    card_id: parseInt(cardIdVal, 10),
    station_id: parseInt(stationIdVal, 10),
    fare_amount: parseFloat(fareVal),
  };

  try {
    const res = await createTransaction(payload);
    showMessage(res.message || "Transaction recorded successfully!");
    document.getElementById("transaction-add-form").reset();
  } catch (err) {
    showMessage(err.message, true);
  }
}

// ----------------- UPDATE TRANSACTION -----------------
window.selectTransactionForUpdate = function (id) {
  const t = allTransactions.find((x) => x.transaction_id == id);
  if (!t) return;

  // Highlight row
  document.querySelectorAll("#transaction-update-tbody tr").forEach((r) => r.classList.remove("selected-row"));
  const row = document.getElementById(`row-${id}`);
  if (row) row.classList.add("selected-row");

  // Populate edit form
  document.getElementById("edit_transaction_id").value = t.transaction_id;
  document.getElementById("display-transaction-id").textContent = t.transaction_id;
  document.getElementById("edit_card_id").value = t.card_id;
  document.getElementById("edit_station_id").value = t.station_id;
  document.getElementById("edit_fare_amount").value = t.fare_amount;

  // Reveal form and scroll
  const area = document.getElementById("update-form-area");
  area.style.display = "block";
  area.scrollIntoView({ behavior: "smooth" });
};

window.cancelUpdate = function () {
  const area = document.getElementById("update-form-area");
  if (area) area.style.display = "none";
  document.querySelectorAll("#transaction-update-tbody tr").forEach((r) => r.classList.remove("selected-row"));
};

async function handleUpdateTransaction(e) {
  e.preventDefault();

  const id = document.getElementById("edit_transaction_id").value;
  const payload = {
    card_id: parseInt(document.getElementById("edit_card_id").value, 10),
    station_id: parseInt(document.getElementById("edit_station_id").value, 10),
    fare_amount: parseFloat(document.getElementById("edit_fare_amount").value),
  };

  try {
    const res = await updateTransaction(id, payload);
    showMessage(res.message || "Transaction updated successfully!");
    cancelUpdate();

    // Reload records
    const r = await getTransactions();
    allTransactions = (r.data || []).map(prepareTransaction);
    fillDatalists();
    renderTransactionsTable("update");
  } catch (err) {
    showMessage(err.message, true);
  }
}

// ----------------- DELETE TRANSACTION -----------------
window.selectTransactionForDelete = async function (id, cardNum) {
  if (!confirm(`Are you sure you want to delete Transaction #${id} (Card: ${cardNum})?`)) {
    return;
  }

  try {
    const res = await deleteTransaction(id);
    showMessage(res.message || "Transaction deleted successfully!");

    // Reload records
    const r = await getTransactions();
    allTransactions = (r.data || []).map(prepareTransaction);
    fillDatalists();
    renderTransactionsTable("delete");
  } catch (err) {
    showMessage(err.message, true);
  }
};
