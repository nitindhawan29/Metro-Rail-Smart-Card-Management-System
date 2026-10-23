// JavaScript for Passengers operations
// Search and sort are executed directly via SQL queries on the backend

let allPassengers = [];
let sortCol = "passenger_id";
let sortDir = "asc";

document.addEventListener("DOMContentLoaded", function () {
  // Page 1: Show Passengers
  if (document.getElementById("passenger-show-table")) {
    loadPassengersAndInit("show");
  }

  // Page 2: Add Passenger
  if (document.getElementById("passenger-add-form")) {
    document.getElementById("passenger-add-form").addEventListener("submit", handleAddPassenger);
  }

  // Page 3: Update Passenger
  if (document.getElementById("passenger-update-table")) {
    loadPassengersAndInit("update");
    document.getElementById("passenger-update-form").addEventListener("submit", handleUpdatePassenger);
  }

  // Page 4: Delete Passenger
  if (document.getElementById("passenger-delete-table")) {
    loadPassengersAndInit("delete");
  }
});

// Fetch all passengers to initialize datalists and render initial table via SQL
async function loadPassengersAndInit(mode) {
  try {
    const res = await getPassengers();
    allPassengers = res.data ? res.data : [];

    fillDatalists();
    setupFilterEvents(mode);
    await renderPassengerTable(mode);
  } catch (err) {
    showMessage(err.message, true);
  }
}

// Populate datalists so user can type or choose from dropdown
function fillDatalists() {
  const ids = [];
  const names = [];
  const countries = [];
  const mobiles = [];
  const emails = [];

  for (let i = 0; i < allPassengers.length; i++) {
    const p = allPassengers[i];
    ids.push(p.passenger_id);
    names.push(p.passenger_name);
    countries.push(p.country_code);
    mobiles.push(p.mobile_number);
    if (p.email) {
      emails.push(p.email);
    }
  }

  populateDatalist("dl-id", ids);
  populateDatalist("dl-name", names);
  populateDatalist("dl-country", countries);
  populateDatalist("dl-mobile", mobiles);
  populateDatalist("dl-email", emails);
}

// Bind search input typing and sort toggle clicks
function setupFilterEvents(mode) {
  const fields = ["id", "name", "country", "mobile", "email"];

  for (let i = 0; i < fields.length; i++) {
    const f = fields[i];

    // Input typing listener - triggers SQL query
    const input = document.getElementById("filter-" + f);
    if (input) {
      input.addEventListener("input", function () {
        renderPassengerTable(mode);
      });
    }

    // Sort toggle button listener - triggers SQL query with ORDER BY
    const sortBtn = document.getElementById("sort-" + f);
    if (sortBtn) {
      sortBtn.addEventListener("click", function () {
        const colMap = {
          id: "passenger_id",
          name: "passenger_name",
          country: "country_code",
          mobile: "mobile_number",
          email: "email"
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
        renderPassengerTable(mode);
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
      sortCol = "passenger_id";
      sortDir = "asc";
      updateSortButtons();
      renderPassengerTable(mode);
    });
  }
}

// Update the sort button labels
function updateSortButtons() {
  const fields = [
    { id: "sort-id", col: "passenger_id" },
    { id: "sort-name", col: "passenger_name" },
    { id: "sort-country", col: "country_code" },
    { id: "sort-mobile", col: "mobile_number" },
    { id: "sort-email", col: "email" }
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

// Executes SQL query with WHERE conditions and ORDER BY through backend
async function renderPassengerTable(mode) {
  const params = {
    passenger_id: getInputValue("filter-id"),
    passenger_name: getInputValue("filter-name"),
    country_code: getInputValue("filter-country"),
    mobile_number: getInputValue("filter-mobile"),
    email: getInputValue("filter-email"),
    sort_col: sortCol,
    sort_dir: sortDir
  };

  try {
    // Backend executes SELECT ... FROM Passengers WHERE ... ORDER BY ...
    const res = await getPassengers(params);
    const records = res.data ? res.data : [];

    const countEl = document.getElementById("record-count");
    if (countEl) {
      countEl.textContent = "Showing " + records.length + " of " + allPassengers.length + " passengers";
    }

    const tbody = document.getElementById("passenger-" + mode + "-tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (records.length === 0) {
      const cols = mode === "show" ? 5 : 6;
      tbody.innerHTML = '<tr><td colspan="' + cols + '" style="text-align:center; color:#888;">No matching passengers found</td></tr>';
      return;
    }

    for (let i = 0; i < records.length; i++) {
      const p = records[i];
      const tr = document.createElement("tr");
      tr.id = "row-" + p.passenger_id;

      let actionTd = "";
      if (mode === "update") {
        actionTd = `<td><button type="button" class="btn btn-warning btn-sm" onclick="selectForUpdate(${p.passenger_id})">✏️ Update</button></td>`;
      } else if (mode === "delete") {
        actionTd = `<td><button type="button" class="btn btn-danger btn-sm" onclick="selectForDelete(${p.passenger_id}, '${escapeHTML(p.passenger_name)}')">🗑️ Delete</button></td>`;
      }

      const emailDisplay = p.email ? escapeHTML(p.email) : "N/A";

      tr.innerHTML =
        "<td><strong>" + escapeHTML(p.passenger_id) + "</strong></td>" +
        "<td>" + escapeHTML(p.passenger_name) + "</td>" +
        "<td>" + escapeHTML(p.country_code) + "</td>" +
        "<td>" + escapeHTML(p.mobile_number) + "</td>" +
        "<td>" + emailDisplay + "</td>" +
        actionTd;

      tbody.appendChild(tr);
    }
  } catch (err) {
    showMessage(err.message, true);
  }
}

// ----------------- ADD PASSENGER -----------------
async function handleAddPassenger(e) {
  e.preventDefault();

  const idVal = getInputValue("passenger_id");
  const nameVal = getInputValue("passenger_name");
  const countryVal = getInputValue("country_code");
  const mobileVal = getInputValue("mobile_number");
  const emailVal = getInputValue("email");

  const idNum = parseInt(idVal, 10);
  if (isNaN(idNum) || idNum <= 0) {
    showMessage("Passenger ID must be a positive integer.", true);
    return;
  }

  const payload = {
    passenger_id: idNum,
    passenger_name: nameVal,
    country_code: countryVal,
    mobile_number: mobileVal,
    email: emailVal ? emailVal : null
  };

  try {
    const res = await createPassenger(payload);
    showMessage(res.message ? res.message : "Passenger created successfully!");
    document.getElementById("passenger-add-form").reset();
  } catch (err) {
    showMessage(err.message, true);
  }
}

// ----------------- UPDATE PASSENGER -----------------
window.selectForUpdate = async function (id) {
  let p = null;
  for (let i = 0; i < allPassengers.length; i++) {
    if (allPassengers[i].passenger_id == id) {
      p = allPassengers[i];
      break;
    }
  }

  // If not found in cached list, fetch from database directly
  if (!p) {
    try {
      const res = await request("/passengers/" + id);
      p = res.data;
    } catch (err) {
      return showMessage("Passenger details not found", true);
    }
  }
  if (!p) return;

  // Highlight selected row in table
  const allRows = document.querySelectorAll("#passenger-update-tbody tr");
  for (let j = 0; j < allRows.length; j++) {
    allRows[j].classList.remove("selected-row");
  }
  const row = document.getElementById("row-" + id);
  if (row) {
    row.classList.add("selected-row");
  }

  // Populate edit form
  document.getElementById("edit_passenger_id").value = p.passenger_id;
  document.getElementById("display-passenger-id").textContent = p.passenger_id;
  document.getElementById("edit_passenger_name").value = p.passenger_name;
  document.getElementById("edit_country_code").value = p.country_code;
  document.getElementById("edit_mobile_number").value = p.mobile_number;
  document.getElementById("edit_email").value = p.email ? p.email : "";

  // Show form and scroll to it
  const area = document.getElementById("update-form-area");
  area.style.display = "block";
  area.scrollIntoView({ behavior: "smooth" });
};

window.cancelUpdate = function () {
  const area = document.getElementById("update-form-area");
  if (area) {
    area.style.display = "none";
  }
  const allRows = document.querySelectorAll("#passenger-update-tbody tr");
  for (let i = 0; i < allRows.length; i++) {
    allRows[i].classList.remove("selected-row");
  }
};

async function handleUpdatePassenger(e) {
  e.preventDefault();

  const id = document.getElementById("edit_passenger_id").value;
  const emailVal = getInputValue("edit_email");

  const payload = {
    passenger_name: getInputValue("edit_passenger_name"),
    country_code: getInputValue("edit_country_code"),
    mobile_number: getInputValue("edit_mobile_number"),
    email: emailVal ? emailVal : null
  };

  try {
    const res = await updatePassenger(id, payload);
    showMessage(res.message ? res.message : "Passenger updated successfully!");
    cancelUpdate();

    // Reload records from backend and re-render via SQL
    const r = await getPassengers();
    allPassengers = r.data ? r.data : [];
    fillDatalists();
    await renderPassengerTable("update");
  } catch (err) {
    showMessage(err.message, true);
  }
}

// ----------------- DELETE PASSENGER -----------------
window.selectForDelete = async function (id, name) {
  const confirmed = confirm("Are you sure you want to delete Passenger #" + id + " (" + name + ")?");
  if (!confirmed) {
    return;
  }

  try {
    const res = await deletePassenger(id);
    showMessage(res.message ? res.message : "Passenger deleted successfully!");

    // Reload records from backend and re-render via SQL
    const r = await getPassengers();
    allPassengers = r.data ? r.data : [];
    fillDatalists();
    await renderPassengerTable("delete");
  } catch (err) {
    showMessage(err.message, true);
  }
};
