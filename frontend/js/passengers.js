// JavaScript for Passengers operations
// Search and sort are executed directly via SQL queries on the backend

let allPassengers = [];
let sortCol = "passenger_id";
let sortDir = "asc";

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("passenger-show-table")) {
    loadPassengersAndInit("show");
  }
  if (document.getElementById("passenger-add-form")) {
    document.getElementById("passenger-add-form").addEventListener("submit", handleAddPassenger);
  }
  if (document.getElementById("passenger-update-table")) {
    loadPassengersAndInit("update");
    document.getElementById("passenger-update-form").addEventListener("submit", handleUpdatePassenger);
  }
  if (document.getElementById("passenger-delete-table")) {
    loadPassengersAndInit("delete");
  }
});

// Fetch all passengers to initialize datalists and render initial table via SQL
async function loadPassengersAndInit(mode) {
  try {
    const res = await getPassengers();
    allPassengers = res.data || [];

    fillDatalists();
    setupFilterEvents(mode);
    await renderPassengerTable(mode);
  } catch (err) {
    showMessage(err.message, true);
  }
}

function fillDatalists() {
  populateDatalist("dl-id", allPassengers.map(p => p.passenger_id));
  populateDatalist("dl-name", allPassengers.map(p => p.passenger_name));
  populateDatalist("dl-country", allPassengers.map(p => p.country_code));
  populateDatalist("dl-mobile", allPassengers.map(p => p.mobile_number));
  populateDatalist("dl-email", allPassengers.map(p => p.email));
}

function setupFilterEvents(mode) {
  const fields = ["id", "name", "country", "mobile", "email"];
  const colMap = {
    id: "passenger_id",
    name: "passenger_name",
    country: "country_code",
    mobile: "mobile_number",
    email: "email"
  };

  fields.forEach(f => {
    const input = document.getElementById(`filter-${f}`);
    if (input) {
      input.addEventListener("input", () => renderPassengerTable(mode));
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
        renderPassengerTable(mode);
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
      sortCol = "passenger_id";
      sortDir = "asc";
      updateSortButtons();
      renderPassengerTable(mode);
    });
  }
}

function updateSortButtons() {
  const fields = [
    { id: "sort-id", col: "passenger_id" },
    { id: "sort-name", col: "passenger_name" },
    { id: "sort-country", col: "country_code" },
    { id: "sort-mobile", col: "mobile_number" },
    { id: "sort-email", col: "email" }
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
    const res = await getPassengers(params);
    const records = res.data || [];

    const countEl = document.getElementById("record-count");
    if (countEl) {
      countEl.textContent = `Showing ${records.length} of ${allPassengers.length} passengers`;
    }

    const tbody = document.getElementById(`passenger-${mode}-tbody`);
    if (!tbody) return;
    tbody.innerHTML = "";

    if (records.length === 0) {
      const cols = mode === "show" ? 5 : 6;
      tbody.innerHTML = `<tr><td colspan="${cols}" style="text-align:center; color:#888;">No matching passengers found</td></tr>`;
      return;
    }

    records.forEach(p => {
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
        <td>${p.email ? escapeHTML(p.email) : "N/A"}</td>
        ${actionTd}
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    showMessage(err.message, true);
  }
}

// ----------------- ADD PASSENGER -----------------
async function handleAddPassenger(e) {
  e.preventDefault();

  const idNum = parseInt(getInputValue("passenger_id"), 10);
  if (isNaN(idNum) || idNum <= 0) {
    return showMessage("Passenger ID must be a positive integer.", true);
  }

  const payload = {
    passenger_id: idNum,
    passenger_name: getInputValue("passenger_name"),
    country_code: getInputValue("country_code"),
    mobile_number: getInputValue("mobile_number"),
    email: getInputValue("email") || null
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
window.selectForUpdate = async function (id) {
  let p = allPassengers.find(x => x.passenger_id == id);
  if (!p) {
    try {
      const res = await request(`/passengers/${id}`);
      p = res.data;
    } catch (err) {
      return showMessage("Passenger details not found", true);
    }
  }
  if (!p) return;

  document.querySelectorAll("#passenger-update-tbody tr").forEach(row => row.classList.remove("selected-row"));
  const row = document.getElementById(`row-${id}`);
  if (row) row.classList.add("selected-row");

  document.getElementById("edit_passenger_id").value = p.passenger_id;
  document.getElementById("display-passenger-id").textContent = p.passenger_id;
  document.getElementById("edit_passenger_name").value = p.passenger_name;
  document.getElementById("edit_country_code").value = p.country_code;
  document.getElementById("edit_mobile_number").value = p.mobile_number;
  document.getElementById("edit_email").value = p.email || "";

  const area = document.getElementById("update-form-area");
  area.style.display = "block";
  area.scrollIntoView({ behavior: "smooth" });
};

window.cancelUpdate = function () {
  const area = document.getElementById("update-form-area");
  if (area) area.style.display = "none";
  document.querySelectorAll("#passenger-update-tbody tr").forEach(row => row.classList.remove("selected-row"));
};

async function handleUpdatePassenger(e) {
  e.preventDefault();

  const id = document.getElementById("edit_passenger_id").value;
  const payload = {
    passenger_name: getInputValue("edit_passenger_name"),
    country_code: getInputValue("edit_country_code"),
    mobile_number: getInputValue("edit_mobile_number"),
    email: getInputValue("edit_email") || null
  };

  try {
    const res = await updatePassenger(id, payload);
    showMessage(res.message || "Passenger updated successfully!");
    cancelUpdate();

    const r = await getPassengers();
    allPassengers = r.data || [];
    fillDatalists();
    await renderPassengerTable("update");
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

    const r = await getPassengers();
    allPassengers = r.data || [];
    fillDatalists();
    await renderPassengerTable("delete");
  } catch (err) {
    showMessage(err.message, true);
  }
};
