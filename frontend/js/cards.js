// Simple and readable JavaScript for Smart Cards operations

let allCards = [];
let allPassengers = [];
let passengerMap = {};
let sortCol = "card_id";
let sortDir = "asc";

document.addEventListener("DOMContentLoaded", async () => {
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
    allPassengers = res.data || [];
    allPassengers.forEach((p) => {
      passengerMap[p.passenger_id] = p.passenger_name;
    });

    const drop = document.getElementById(selectId);
    if (!drop) return;
    drop.innerHTML = '<option value="">Select a passenger...</option>';
    allPassengers.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p.passenger_id;
      opt.textContent = `#${p.passenger_id} - ${p.passenger_name}`;
      drop.appendChild(opt);
    });
  } catch (err) {
    showMessage(err.message, true);
  }
}

// Fetch all cards and passengers for show/update/delete pages
async function initCardsPage(mode) {
  try {
    const [cRes, pRes] = await Promise.all([getCards(), getPassengers()]);
    allCards = cRes.data || [];
    allPassengers = pRes.data || [];
    allPassengers.forEach((p) => {
      passengerMap[p.passenger_id] = p.passenger_name;
    });

    fillDatalists();
    setupFilterEvents(mode);
    renderCardsTable(mode);
  } catch (err) {
    showMessage(err.message, true);
  }
}

function fillDatalists() {
  populateDatalist("dl-id", allCards.map((c) => c.card_id));
  populateDatalist("dl-number", allCards.map((c) => c.card_number));
  populateDatalist(
    "dl-passenger",
    allCards.map((c) => passengerMap[c.passenger_id] || c.passenger_name || `Passenger #${c.passenger_id}`)
  );
  populateDatalist("dl-balance", allCards.map((c) => Number(c.balance).toFixed(2)));
}

function setupFilterEvents(mode) {
  const fields = ["id", "number", "passenger", "balance"];

  fields.forEach((f) => {
    const input = document.getElementById(`filter-${f}`);
    if (input) {
      input.addEventListener("input", () => renderCardsTable(mode));
    }

    const sortBtn = document.getElementById(`sort-${f}`);
    if (sortBtn) {
      sortBtn.addEventListener("click", () => {
        const colMap = {
          id: "card_id",
          number: "card_number",
          passenger: "passenger_name",
          balance: "balance",
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
        renderCardsTable(mode);
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
    { id: "sort-balance", col: "balance" },
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

function renderCardsTable(mode) {
  const idFilter = document.getElementById("filter-id")?.value.trim().toLowerCase() || "";
  const numFilter = document.getElementById("filter-number")?.value.trim().toLowerCase() || "";
  const passFilter = document.getElementById("filter-passenger")?.value.trim().toLowerCase() || "";
  const balFilter = document.getElementById("filter-balance")?.value.trim().toLowerCase() || "";

  // 1. Filter
  let filtered = allCards.filter((c) => {
    const pName = (passengerMap[c.passenger_id] || c.passenger_name || `Passenger #${c.passenger_id}`).toLowerCase();
    const cId = String(c.card_id).toLowerCase();
    const cNum = String(c.card_number).toLowerCase();
    const cBal = String(c.balance).toLowerCase();

    if (idFilter && !cId.includes(idFilter)) return false;
    if (numFilter && !cNum.includes(numFilter)) return false;
    if (passFilter && !pName.includes(passFilter)) return false;
    if (balFilter && !cBal.includes(balFilter)) return false;
    return true;
  });

  // 2. Sort
  if (sortCol && sortDir) {
    filtered.sort((a, b) => {
      let va = a[sortCol];
      let vb = b[sortCol];
      if (sortCol === "passenger_name") {
        va = passengerMap[a.passenger_id] || a.passenger_name || "";
        vb = passengerMap[b.passenger_id] || b.passenger_name || "";
      }
      if (va === null || va === undefined) va = "";
      if (vb === null || vb === undefined) vb = "";

      const na = Number(va), nb = Number(vb);
      if (!isNaN(na) && !isNaN(nb) && String(va).trim() !== "" && String(vb).trim() !== "") {
        return sortDir === "asc" ? na - nb : nb - na;
      }
      return sortDir === "asc" ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
  }

  const countEl = document.getElementById("record-count");
  if (countEl) {
    countEl.textContent = `Showing ${filtered.length} of ${allCards.length} smart cards`;
  }

  const tbody = document.getElementById(`card-${mode}-tbody`);
  if (!tbody) return;
  tbody.innerHTML = "";

  if (filtered.length === 0) {
    const cols = mode === "show" ? 4 : 5;
    tbody.innerHTML = `<tr><td colspan="${cols}" style="text-align:center; color:#888;">No matching smart cards found</td></tr>`;
    return;
  }

  filtered.forEach((c) => {
    const pName = passengerMap[c.passenger_id] || c.passenger_name || `Passenger #${c.passenger_id}`;
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
}

// ----------------- ADD CARD -----------------
async function handleAddCard(e) {
  e.preventDefault();

  const idVal = document.getElementById("card_id").value.trim();
  const passVal = document.getElementById("passenger_id").value;
  const numVal = document.getElementById("card_number").value.trim().toUpperCase();
  const balVal = document.getElementById("balance").value;

  const idNum = parseInt(idVal, 10);
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
    balance: parseFloat(balVal) || 0.0,
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
window.selectCardForUpdate = function (id) {
  const c = allCards.find((x) => x.card_id == id);
  if (!c) return;

  document.querySelectorAll("#card-update-tbody tr").forEach((r) => r.classList.remove("selected-row"));
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
  document.querySelectorAll("#card-update-tbody tr").forEach((r) => r.classList.remove("selected-row"));
};

async function handleUpdateCard(e) {
  e.preventDefault();

  const id = document.getElementById("edit_card_id").value;
  const numVal = document.getElementById("edit_card_number").value.trim().toUpperCase();

  if (!/^METRO[0-9]{4}$/.test(numVal)) {
    return showMessage("Card number must be METRO followed by 4 digits (e.g. METRO1001).", true);
  }

  const payload = {
    passenger_id: parseInt(document.getElementById("edit_passenger_id").value, 10),
    card_number: numVal,
    balance: parseFloat(document.getElementById("edit_balance").value),
  };

  try {
    const res = await updateCard(id, payload);
    showMessage(res.message || "Smart card updated successfully!");
    cancelUpdate();

    const r = await getCards();
    allCards = r.data || [];
    fillDatalists();
    renderCardsTable("update");
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
    renderCardsTable("delete");
  } catch (err) {
    showMessage(err.message, true);
  }
};
