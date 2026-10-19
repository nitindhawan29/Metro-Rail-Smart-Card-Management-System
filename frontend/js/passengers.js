// Simple and readable JavaScript for Passengers operations

let allPassengers = [];
let sortCol = "passenger_id";
let sortDir = "asc";

document.addEventListener("DOMContentLoaded", () => {
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

// Fetch all passengers from the backend
async function loadPassengersAndInit(mode) {
  try {
    const res = await getPassengers();
    allPassengers = res.data || [];

    // Fill datalists for dropdown selection
    fillDatalists();

    // Bind search input events
    setupFilterEvents(mode);

    // Initial render
    renderPassengerTable(mode);
  } catch (err) {
    showMessage(err.message, true);
  }
}

// Populate datalists so user can type or choose from dropdown
function fillDatalists() {
  populateDatalist("dl-id", allPassengers.map((p) => p.passenger_id));
  populateDatalist("dl-name", allPassengers.map((p) => p.passenger_name));
  populateDatalist("dl-country", allPassengers.map((p) => p.country_code));
  populateDatalist("dl-mobile", allPassengers.map((p) => p.mobile_number));
  populateDatalist("dl-email", allPassengers.map((p) => p.email).filter(Boolean));
}

// Bind search input typing and sort toggle clicks
function setupFilterEvents(mode) {
  const fields = ["id", "name", "country", "mobile", "email"];

  fields.forEach((f) => {
    const input = document.getElementById(`filter-${f}`);
    if (input) {
      input.addEventListener("input", () => renderPassengerTable(mode));
    }

    const sortBtn = document.getElementById(`sort-${f}`);
    if (sortBtn) {
      sortBtn.addEventListener("click", () => {
        const colMap = {
          id: "passenger_id",
          name: "passenger_name",
          country: "country_code",
          mobile: "mobile_number",
          email: "email",
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
        renderPassengerTable(mode);
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
    { id: "sort-email", col: "email" },
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

// Filter, sort and display rows in table
function renderPassengerTable(mode) {
  const filters = {
    passenger_id: (document.getElementById("filter-id")?.value || ""),
    passenger_name: (document.getElementById("filter-name")?.value || ""),
    country_code: (document.getElementById("filter-country")?.value || ""),
    mobile_number: (document.getElementById("filter-mobile")?.value || ""),
    email: (document.getElementById("filter-email")?.value || ""),
  };

  const filtered = filterAndSort(allPassengers, filters, sortCol, sortDir);

  const countEl = document.getElementById("record-count");
  if (countEl) {
    countEl.textContent = `Showing ${filtered.length} of ${allPassengers.length} passengers`;
  }

  const tbody = document.getElementById(`passenger-${mode}-tbody`);
  if (!tbody) return;
  tbody.innerHTML = "";

  if (filtered.length === 0) {
    const cols = mode === "show" ? 5 : 6;
    tbody.innerHTML = `<tr><td colspan="${cols}" style="text-align:center; color:#888;">No matching passengers found</td></tr>`;
    return;
  }

  filtered.forEach((p) => {
    const tr = document.createElement("tr");
    tr.id = `row-${p.passenger_id}`;

    let actionTd = "";
    if (mode === "update") {
      actionTd = `<td><button type="button" class="btn btn-warning btn-sm" onclick="selectForUpdate(${p.passenger_id})">✏️ Update</button></td>`;
    } else if (mode === "delete") {
      actionTd = `<td><button type="button" class="btn btn-danger btn-sm" onclick="selectForDelete(${p.passenger_id}, '${escapeHTML(p.passenger_name)}')">🗑️ Delete</button></td>`;
    }

    tr.innerHTML = `
      <td><strong>${escapeHTML(p.passenger_id)}</strong></td>
      <td>${escapeHTML(p.passenger_name)}</td>
      <td>${escapeHTML(p.country_code)}</td>
      <td>${escapeHTML(p.mobile_number)}</td>
      <td>${escapeHTML(p.email || "N/A")}</td>
      ${actionTd}
    `;
    tbody.appendChild(tr);
  });
}

// ----------------- ADD PASSENGER -----------------
async function handleAddPassenger(e) {
  e.preventDefault();

  const idVal = document.getElementById("passenger_id").value.trim();
  const nameVal = document.getElementById("passenger_name").value.trim();
  const countryVal = document.getElementById("country_code").value.trim();
  const mobileVal = document.getElementById("mobile_number").value.trim();
  const emailVal = document.getElementById("email").value.trim();

  const idNum = parseInt(idVal, 10);
  if (isNaN(idNum) || idNum <= 0) {
    return showMessage("Passenger ID must be a positive integer.", true);
  }

  const payload = {
    passenger_id: idNum,
    passenger_name: nameVal,
    country_code: countryVal,
    mobile_number: mobileVal,
    email: emailVal || null,
  };

  try {
    const res = await createPassenger(payload);
    showMessage(res.message || "Passenger created successfully!");
    document.getElementById("passenger-add-form").reset();
  } catch (err) {
    showMessage(err.message, true);
  }
}

// ----------------- UPDATE PASSENGER -----------------
window.selectForUpdate = function (id) {
  const p = allPassengers.find((x) => x.passenger_id == id);
  if (!p) return;

  // Highlight row
  document.querySelectorAll("#passenger-update-tbody tr").forEach((r) => r.classList.remove("selected-row"));
  const row = document.getElementById(`row-${id}`);
  if (row) row.classList.add("selected-row");

  // Populate edit form
  document.getElementById("edit_passenger_id").value = p.passenger_id;
  document.getElementById("display-passenger-id").textContent = p.passenger_id;
  document.getElementById("edit_passenger_name").value = p.passenger_name;
  document.getElementById("edit_country_code").value = p.country_code;
  document.getElementById("edit_mobile_number").value = p.mobile_number;
  document.getElementById("edit_email").value = p.email || "";

  // Show form and scroll to it
  const area = document.getElementById("update-form-area");
  area.style.display = "block";
  area.scrollIntoView({ behavior: "smooth" });
};

window.cancelUpdate = function () {
  const area = document.getElementById("update-form-area");
  if (area) area.style.display = "none";
  document.querySelectorAll("#passenger-update-tbody tr").forEach((r) => r.classList.remove("selected-row"));
};

async function handleUpdatePassenger(e) {
  e.preventDefault();

  const id = document.getElementById("edit_passenger_id").value;
  const payload = {
    passenger_name: document.getElementById("edit_passenger_name").value.trim(),
    country_code: document.getElementById("edit_country_code").value.trim(),
    mobile_number: document.getElementById("edit_mobile_number").value.trim(),
    email: document.getElementById("edit_email").value.trim() || null,
  };

  try {
    const res = await updatePassenger(id, payload);
    showMessage(res.message || "Passenger updated successfully!");
    cancelUpdate();

    // Reload records
    const r = await getPassengers();
    allPassengers = r.data || [];
    fillDatalists();
    renderPassengerTable("update");
  } catch (err) {
    showMessage(err.message, true);
  }
}

// ----------------- DELETE PASSENGER -----------------
window.selectForDelete = async function (id, name) {
  if (!confirm(`Are you sure you want to delete Passenger #${id} (${name})?`)) {
    return;
  }

  try {
    const res = await deletePassenger(id);
    showMessage(res.message || "Passenger deleted successfully!");

    // Reload records
    const r = await getPassengers();
    allPassengers = r.data || [];
    fillDatalists();
    renderPassengerTable("delete");
  } catch (err) {
    showMessage(err.message, true);
  }
};
