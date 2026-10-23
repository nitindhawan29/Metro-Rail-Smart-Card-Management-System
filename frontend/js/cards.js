// JavaScript for Smart Cards operations
// Clean and straightforward syntax for DBMS Lab Project

let allCards = [];
let allPassengers = [];
let passengerMap = {};
let sortCol = "card_id";
let sortDir = "asc";

document.addEventListener("DOMContentLoaded", async function () {
  // Page 1: Show Cards
  if (document.getElementById("card-show-table")) {
    await initCardsPage("show");
  }

  // Page 2: Add / Issue Card
  if (document.getElementById("card-add-form")) {
    await loadPassengersDropdown("passenger_id");
    document.getElementById("card-add-form").addEventListener("submit", handleAddCard);
  }

  // Page 3: Update Card
  if (document.getElementById("card-update-table")) {
    await loadPassengersDropdown("edit_passenger_id");
    await initCardsPage("update");
    document.getElementById("card-update-form").addEventListener("submit", handleUpdateCard);
  }

  // Page 4: Delete Card
  if (document.getElementById("card-delete-table")) {
    await initCardsPage("delete");
  }
});

// Load passengers and populate dropdown
async function loadPassengersDropdown(selectId) {
  try {
    const res = await getPassengers();
    allPassengers = res.data ? res.data : [];

    for (let i = 0; i < allPassengers.length; i++) {
      const p = allPassengers[i];
      passengerMap[p.passenger_id] = p.passenger_name;
    }

    const drop = document.getElementById(selectId);
    if (!drop) return;

    drop.innerHTML = '<option value="">Select a passenger...</option>';
    for (let j = 0; j < allPassengers.length; j++) {
      const p = allPassengers[j];
      const opt = document.createElement("option");
      opt.value = p.passenger_id;
      opt.textContent = "#" + p.passenger_id + " - " + p.passenger_name;
      drop.appendChild(opt);
    }
  } catch (err) {
    showMessage(err.message, true);
  }
}

// Fetch all cards and passengers for show/update/delete pages
async function initCardsPage(mode) {
  try {
    const cRes = await getCards();
    const pRes = await getPassengers();

    allCards = cRes.data ? cRes.data : [];
    allPassengers = pRes.data ? pRes.data : [];

    for (let i = 0; i < allPassengers.length; i++) {
      const p = allPassengers[i];
      passengerMap[p.passenger_id] = p.passenger_name;
    }

    fillDatalists();
    setupFilterEvents(mode);
    renderCardsTable(mode);
  } catch (err) {
    showMessage(err.message, true);
  }
}

function fillDatalists() {
  const ids = [];
  const numbers = [];
  const passengers = [];
  const balances = [];

  for (let i = 0; i < allCards.length; i++) {
    const c = allCards[i];
    ids.push(c.card_id);
    numbers.push(c.card_number);

    let pName = "Passenger #" + c.passenger_id;
    if (passengerMap[c.passenger_id]) {
      pName = passengerMap[c.passenger_id];
    } else if (c.passenger_name) {
      pName = c.passenger_name;
    }
    passengers.push(pName);

    balances.push(Number(c.balance).toFixed(2));
  }

  populateDatalist("dl-id", ids);
  populateDatalist("dl-number", numbers);
  populateDatalist("dl-passenger", passengers);
  populateDatalist("dl-balance", balances);
}

function setupFilterEvents(mode) {
  const fields = ["id", "number", "passenger", "balance"];

  for (let i = 0; i < fields.length; i++) {
    const f = fields[i];

    // Input typing listener
    const input = document.getElementById("filter-" + f);
    if (input) {
      input.addEventListener("input", function () {
        renderCardsTable(mode);
      });
    }

    // Sort toggle button listener
    const sortBtn = document.getElementById("sort-" + f);
    if (sortBtn) {
      sortBtn.addEventListener("click", function () {
        const colMap = {
          id: "card_id",
          number: "card_number",
          passenger: "passenger_name",
          balance: "balance"
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
        renderCardsTable(mode);
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

function renderCardsTable(mode) {
  const idFilter = getInputValue("filter-id").toLowerCase();
  const numFilter = getInputValue("filter-number").toLowerCase();
  const passFilter = getInputValue("filter-passenger").toLowerCase();
  const balFilter = getInputValue("filter-balance").toLowerCase();

  // 1. Filter cards
  const filtered = [];
  for (let i = 0; i < allCards.length; i++) {
    const c = allCards[i];

    let pName = "Passenger #" + c.passenger_id;
    if (passengerMap[c.passenger_id]) {
      pName = passengerMap[c.passenger_id];
    } else if (c.passenger_name) {
      pName = c.passenger_name;
    }

    const cId = String(c.card_id).toLowerCase();
    const cNum = String(c.card_number).toLowerCase();
    const cPass = pName.toLowerCase();
    const cBal = String(c.balance).toLowerCase();

    if (idFilter && cId.indexOf(idFilter) === -1) continue;
    if (numFilter && cNum.indexOf(numFilter) === -1) continue;
    if (passFilter && cPass.indexOf(passFilter) === -1) continue;
    if (balFilter && cBal.indexOf(balFilter) === -1) continue;

    filtered.push(c);
  }

  // 2. Sort cards
  if (sortCol && sortDir) {
    filtered.sort(function (a, b) {
      let va = a[sortCol];
      let vb = b[sortCol];

      if (sortCol === "passenger_name") {
        va = passengerMap[a.passenger_id] ? passengerMap[a.passenger_id] : (a.passenger_name ? a.passenger_name : "");
        vb = passengerMap[b.passenger_id] ? passengerMap[b.passenger_id] : (b.passenger_name ? b.passenger_name : "");
      }
      if (va === null || va === undefined) va = "";
      if (vb === null || vb === undefined) vb = "";

      const na = Number(va);
      const nb = Number(vb);
      if (!isNaN(na) && !isNaN(nb) && String(va).trim() !== "" && String(vb).trim() !== "") {
        if (sortDir === "asc") {
          return na - nb;
        } else {
          return nb - na;
        }
      }

      const sa = String(va).toLowerCase();
      const sb = String(vb).toLowerCase();
      if (sortDir === "asc") {
        return sa.localeCompare(sb);
      } else {
        return sb.localeCompare(sa);
      }
    });
  }

  const countEl = document.getElementById("record-count");
  if (countEl) {
    countEl.textContent = "Showing " + filtered.length + " of " + allCards.length + " smart cards";
  }

  const tbody = document.getElementById("card-" + mode + "-tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (filtered.length === 0) {
    const cols = mode === "show" ? 4 : 5;
    tbody.innerHTML = '<tr><td colspan="' + cols + '" style="text-align:center; color:#888;">No matching smart cards found</td></tr>';
    return;
  }

  for (let j = 0; j < filtered.length; j++) {
    const c = filtered[j];
    let pName = "Passenger #" + c.passenger_id;
    if (passengerMap[c.passenger_id]) {
      pName = passengerMap[c.passenger_id];
    } else if (c.passenger_name) {
      pName = c.passenger_name;
    }

    const tr = document.createElement("tr");
    tr.id = "row-" + c.card_id;

    let actionTd = "";
    if (mode === "update") {
      actionTd = '<td><button type="button" class="btn btn-warning btn-sm" onclick="selectCardForUpdate(' + c.card_id + ')">✏️ Update</button></td>';
    } else if (mode === "delete") {
      actionTd = '<td><button type="button" class="btn btn-danger btn-sm" onclick="selectCardForDelete(' + c.card_id + ", '" + escapeHTML(c.card_number) + "')\">🗑️ Delete</button></td>";
    }

    tr.innerHTML =
      "<td><strong>" + escapeHTML(c.card_id) + "</strong></td>" +
      "<td><code>" + escapeHTML(c.card_number) + "</code></td>" +
      "<td>" + escapeHTML(pName) + "</td>" +
      "<td>" + formatCurrency(c.balance) + "</td>" +
      actionTd;

    tbody.appendChild(tr);
  }
}

// ----------------- ADD CARD -----------------
async function handleAddCard(e) {
  e.preventDefault();

  const idVal = getInputValue("card_id");
  const passVal = getInputValue("passenger_id");
  const numVal = getInputValue("card_number").toUpperCase();
  const balVal = getInputValue("balance");

  const idNum = parseInt(idVal, 10);
  if (isNaN(idNum) || idNum <= 0) {
    showMessage("Card ID must be a positive integer.", true);
    return;
  }

  if (!passVal) {
    showMessage("Please select a passenger.", true);
    return;
  }

  // Card number format: METRO + 4 digits
  const cardRegex = /^METRO[0-9]{4}$/;
  if (!cardRegex.test(numVal)) {
    showMessage("Card number must be METRO followed by 4 digits (e.g. METRO1001).", true);
    return;
  }

  const payload = {
    card_id: idNum,
    passenger_id: parseInt(passVal, 10),
    card_number: numVal,
    balance: parseFloat(balVal) || 0.0
  };

  try {
    const res = await createCard(payload);
    showMessage(res.message ? res.message : "Smart card issued successfully!");
    document.getElementById("card-add-form").reset();
    document.getElementById("balance").value = "0.00";
  } catch (err) {
    showMessage(err.message, true);
  }
}

// ----------------- UPDATE CARD -----------------
window.selectCardForUpdate = function (id) {
  let c = null;
  for (let i = 0; i < allCards.length; i++) {
    if (allCards[i].card_id == id) {
      c = allCards[i];
      break;
    }
  }
  if (!c) return;

  const allRows = document.querySelectorAll("#card-update-tbody tr");
  for (let j = 0; j < allRows.length; j++) {
    allRows[j].classList.remove("selected-row");
  }
  const row = document.getElementById("row-" + id);
  if (row) {
    row.classList.add("selected-row");
  }

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
  if (area) {
    area.style.display = "none";
  }
  const allRows = document.querySelectorAll("#card-update-tbody tr");
  for (let i = 0; i < allRows.length; i++) {
    allRows[i].classList.remove("selected-row");
  }
};

async function handleUpdateCard(e) {
  e.preventDefault();

  const id = document.getElementById("edit_card_id").value;
  const numVal = getInputValue("edit_card_number").toUpperCase();

  const cardRegex = /^METRO[0-9]{4}$/;
  if (!cardRegex.test(numVal)) {
    showMessage("Card number must be METRO followed by 4 digits (e.g. METRO1001).", true);
    return;
  }

  const payload = {
    passenger_id: parseInt(document.getElementById("edit_passenger_id").value, 10),
    card_number: numVal,
    balance: parseFloat(document.getElementById("edit_balance").value)
  };

  try {
    const res = await updateCard(id, payload);
    showMessage(res.message ? res.message : "Smart card updated successfully!");
    cancelUpdate();

    const r = await getCards();
    allCards = r.data ? r.data : [];
    fillDatalists();
    renderCardsTable("update");
  } catch (err) {
    showMessage(err.message, true);
  }
}

// ----------------- DELETE CARD -----------------
window.selectCardForDelete = async function (id, number) {
  const confirmed = confirm("Are you sure you want to delete Smart Card #" + id + " (" + number + ")?");
  if (!confirmed) {
    return;
  }

  try {
    const res = await deleteCard(id);
    showMessage(res.message ? res.message : "Smart card deleted successfully!");

    const r = await getCards();
    allCards = r.data ? r.data : [];
    fillDatalists();
    renderCardsTable("delete");
  } catch (err) {
    showMessage(err.message, true);
  }
};
