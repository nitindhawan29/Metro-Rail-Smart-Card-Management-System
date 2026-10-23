// JavaScript for Smart Cards operations
// Search and sort are executed directly via SQL queries on the backend

let allCards = [];
let allPassengers = [];
let passengerMap = {};
let sortCol = "card_id";
let sortDir = "asc";

document.addEventListener("DOMContentLoaded", async () => {
  if (document.getElementById("card-show-table")) {
    await initCardsPage("show");
  }
  if (document.getElementById("card-add-form")) {
    await loadPassengersDropdown("passenger_id");
    document.getElementById("card-add-form").addEventListener("submit", handleAddCard);
  }
  if (document.getElementById("card-update-table")) {
    await loadPassengersDropdown("edit_passenger_id");
    await initCardsPage("update");
    document.getElementById("card-update-form").addEventListener("submit", handleUpdateCard);
  }
  if (document.getElementById("card-delete-table")) {
    await initCardsPage("delete");
  }
});

// Load passengers and populate dropdown
async function loadPassengersDropdown(selectId) {
  try {
    const res = await getPassengers();
    allPassengers = res.data || [];
    allPassengers.forEach(p => {
      passengerMap[p.passenger_id] = p.passenger_name;
    });

    const drop = document.getElementById(selectId);
    if (!drop) return;

    drop.innerHTML = '<option value="">Select a passenger...</option>';
    allPassengers.forEach(p => {
      const opt = document.createElement("option");
      opt.value = p.passenger_id;
      opt.textContent = `#${p.passenger_id} - ${p.passenger_name}`;
      drop.appendChild(opt);
    });
  } catch (err) {
    showMessage(err.message, true);
  }
}

// Fetch cards and passengers to initialize datalists and render table via SQL
async function initCardsPage(mode) {
  try {
    const [cRes, pRes] = await Promise.all([getCards(), getPassengers()]);
    allCards = cRes.data || [];
    allPassengers = pRes.data || [];

    allPassengers.forEach(p => {
      passengerMap[p.passenger_id] = p.passenger_name;
    });

    fillDatalists();
    setupFilterEvents(mode);
    await renderCardsTable(mode);
  } catch (err) {
    showMessage(err.message, true);
  }
}

function fillDatalists() {
  populateDatalist("dl-id", allCards.map(c => c.card_id));
  populateDatalist("dl-number", allCards.map(c => c.card_number));
  populateDatalist("dl-passenger", allCards.map(c => c.passenger_name || passengerMap[c.passenger_id] || `Passenger #${c.passenger_id}`));
  populateDatalist("dl-balance", allCards.map(c => Number(c.balance).toFixed(2)));
}

function setupFilterEvents(mode) {
  const fields = ["id", "number", "passenger", "balance"];
  const colMap = {
    id: "card_id",
    number: "card_number",
    passenger: "passenger_name",
    balance: "balance"
  };

  fields.forEach(f => {
    const input = document.getElementById(`filter-${f}`);
    if (input) {
      input.addEventListener("input", () => renderCardsTable(mode));
    }

    const sortBtn = document.getElementById(`sort-${f}`);
    if (sortBtn) {
      sortBtn.addEventListener("click", () => {
        const col = colMap[f];
        if (sortCol === col) {
          sortDir = sortDir === "asc" ? "desc" : sortDir === "desc" ? null : "asc";
          if (!sortDir) sortCol = null;
        } else {
          sortCol = col;
          sortDir = "asc";
        }
        updateSortButtons();
        renderCardsTable(mode);
      });
    }
  });

  const clearBtn = document.getElementById("btn-clear-filter");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      fields.forEach(f => {
        const inp = document.getElementById(`filter-${f}`);
        if (inp) inp.value = "";
      });
      sortCol = "card_id";
      sortDir = "asc";
      updateSortButtons();
      renderCardsTable(mode);
    });
  }
}

function updateSortButtons() {
  const fields = [
    { id: "sort-id", col: "card_id" },
    { id: "sort-number", col: "card_number" },
    { id: "sort-passenger", col: "passenger_name" },
    { id: "sort-balance", col: "balance" }
  ];

  fields.forEach(f => {
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

// Executes SQL query with WHERE conditions and ORDER BY through backend
async function renderCardsTable(mode) {
  const params = {
    card_id: getInputValue("filter-id"),
    card_number: getInputValue("filter-number"),
    passenger_name: getInputValue("filter-passenger"),
    balance: getInputValue("filter-balance"),
    sort_col: sortCol,
    sort_dir: sortDir
  };

  try {
    const res = await getCards(params);
    const records = res.data || [];

    const countEl = document.getElementById("record-count");
    if (countEl) {
      countEl.textContent = `Showing ${records.length} of ${allCards.length} smart cards`;
    }

    const tbody = document.getElementById(`card-${mode}-tbody`);
    if (!tbody) return;
    tbody.innerHTML = "";

    if (records.length === 0) {
      const cols = mode === "show" ? 4 : 5;
      tbody.innerHTML = `<tr><td colspan="${cols}" style="text-align:center; color:#888;">No matching smart cards found</td></tr>`;
      return;
    }

    records.forEach(c => {
      const pName = c.passenger_name || passengerMap[c.passenger_id] || `Passenger #${c.passenger_id}`;
      const tr = document.createElement("tr");
      tr.id = `row-${c.card_id}`;

      let actionTd = "";
      if (mode === "update") {
        actionTd = `<td><button type="button" class="btn btn-warning btn-sm" onclick="selectCardForUpdate(${c.card_id})">✏️ Update</button></td>`;
      } else if (mode === "delete") {
        actionTd = `<td><button type="button" class="btn btn-danger btn-sm" onclick="selectCardForDelete(${c.card_id}, '${escapeHTML(c.card_number)}')">🗑️ Delete</button></td>`;
      }

      tr.innerHTML = `
        <td><strong>${escapeHTML(c.card_id)}</strong></td>
        <td><code>${escapeHTML(c.card_number)}</code></td>
        <td>${escapeHTML(pName)}</td>
        <td>${formatCurrency(c.balance)}</td>
        ${actionTd}
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    showMessage(err.message, true);
  }
}

// ----------------- ADD CARD -----------------
async function handleAddCard(e) {
  e.preventDefault();

  const idNum = parseInt(getInputValue("card_id"), 10);
  const passVal = getInputValue("passenger_id");
  const numVal = getInputValue("card_number").toUpperCase();
  const balVal = getInputValue("balance");

  if (isNaN(idNum) || idNum <= 0) {
    return showMessage("Card ID must be a positive integer.", true);
  }
  if (!passVal) {
    return showMessage("Please select a passenger.", true);
  }
  if (!/^METRO[0-9]{4}$/.test(numVal)) {
    return showMessage("Card number must be METRO followed by 4 digits (e.g. METRO1001).", true);
  }

  const payload = {
    card_id: idNum,
    passenger_id: parseInt(passVal, 10),
    card_number: numVal,
    balance: parseFloat(balVal) || 0.0
  };

  try {
    const res = await createCard(payload);
    showMessage(res.message || "Smart card issued successfully!");
    document.getElementById("card-add-form").reset();
    document.getElementById("balance").value = "0.00";
  } catch (err) {
    showMessage(err.message, true);
  }
}

// ----------------- UPDATE CARD -----------------
window.selectCardForUpdate = async function (id) {
  let c = allCards.find(x => x.card_id == id);
  if (!c) {
    try {
      const res = await request(`/cards/${id}`);
      c = res.data;
    } catch (err) {
      return showMessage("Card details not found", true);
    }
  }
  if (!c) return;

  document.querySelectorAll("#card-update-tbody tr").forEach(row => row.classList.remove("selected-row"));
  const row = document.getElementById(`row-${id}`);
  if (row) row.classList.add("selected-row");

  document.getElementById("edit_card_id").value = c.card_id;
  document.getElementById("display-card-id").textContent = c.card_id;
  document.getElementById("edit_passenger_id").value = c.passenger_id;
  document.getElementById("edit_card_number").value = c.card_number;
  document.getElementById("edit_balance").value = c.balance;

  const area = document.getElementById("update-form-area");
  area.style.display = "block";
  area.scrollIntoView({ behavior: "smooth" });
};

window.cancelUpdate = function () {
  const area = document.getElementById("update-form-area");
  if (area) area.style.display = "none";
  document.querySelectorAll("#card-update-tbody tr").forEach(row => row.classList.remove("selected-row"));
};

async function handleUpdateCard(e) {
  e.preventDefault();

  const id = document.getElementById("edit_card_id").value;
  const numVal = getInputValue("edit_card_number").toUpperCase();

  if (!/^METRO[0-9]{4}$/.test(numVal)) {
    return showMessage("Card number must be METRO followed by 4 digits (e.g. METRO1001).", true);
  }

  const payload = {
    passenger_id: parseInt(document.getElementById("edit_passenger_id").value, 10),
    card_number: numVal,
    balance: parseFloat(document.getElementById("edit_balance").value)
  };

  try {
    const res = await updateCard(id, payload);
    showMessage(res.message || "Smart card updated successfully!");
    cancelUpdate();

    const r = await getCards();
    allCards = r.data || [];
    fillDatalists();
    await renderCardsTable("update");
  } catch (err) {
    showMessage(err.message, true);
  }
}

// ----------------- DELETE CARD -----------------
window.selectCardForDelete = async function (id, number) {
  if (!confirm(`Are you sure you want to delete Smart Card #${id} (${number})?`)) {
    return;
  }

  try {
    const res = await deleteCard(id);
    showMessage(res.message || "Smart card deleted successfully!");

    const r = await getCards();
    allCards = r.data || [];
    fillDatalists();
    await renderCardsTable("delete");
  } catch (err) {
    showMessage(err.message, true);
  }
};
