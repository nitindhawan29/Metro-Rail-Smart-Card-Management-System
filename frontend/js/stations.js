// Simple and readable JavaScript for Stations operations

let allStations = [];
let sortCol = "station_id";
let sortDir = "asc";

document.addEventListener("DOMContentLoaded", async () => {
  // Page 1: Show Stations
  if (document.getElementById("station-show-table")) {
    await initStationsPage("show");
  }

  // Page 2: Add Station
  if (document.getElementById("station-add-form")) {
    document.getElementById("station-add-form").addEventListener("submit", handleAddStation);
  }

  // Page 3: Update Station
  if (document.getElementById("station-update-table")) {
    await initStationsPage("update");
    document.getElementById("station-update-form").addEventListener("submit", handleUpdateStation);
  }

  // Page 4: Delete Station
  if (document.getElementById("station-delete-table")) {
    await initStationsPage("delete");
  }
});

async function initStationsPage(mode) {
  try {
    const res = await getStations();
    allStations = res.data || [];

    fillDatalists();
    setupFilterEvents(mode);
    renderStationsTable(mode);
  } catch (err) {
    showMessage(err.message, true);
  }
}

function fillDatalists() {
  populateDatalist("dl-id", allStations.map((s) => s.station_id));
  populateDatalist("dl-name", allStations.map((s) => s.station_name));
  populateDatalist("dl-line", allStations.map((s) => s.line_name));
}

function setupFilterEvents(mode) {
  const fields = ["id", "name", "line"];

  fields.forEach((f) => {
    const input = document.getElementById(`filter-${f}`);
    if (input) {
      input.addEventListener("input", () => renderStationsTable(mode));
    }

    const sortBtn = document.getElementById(`sort-${f}`);
    if (sortBtn) {
      sortBtn.addEventListener("click", () => {
        const colMap = {
          id: "station_id",
          name: "station_name",
          line: "line_name",
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
        renderStationsTable(mode);
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
      sortCol = "station_id";
      sortDir = "asc";
      updateSortButtons();
      renderStationsTable(mode);
    });
  }
}

function updateSortButtons() {
  const fields = [
    { id: "sort-id", col: "station_id" },
    { id: "sort-name", col: "station_name" },
    { id: "sort-line", col: "line_name" },
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

function renderStationsTable(mode) {
  const idFilter = document.getElementById("filter-id")?.value.trim().toLowerCase() || "";
  const nameFilter = document.getElementById("filter-name")?.value.trim().toLowerCase() || "";
  const lineFilter = document.getElementById("filter-line")?.value.trim().toLowerCase() || "";

  let filtered = allStations.filter((s) => {
    const sId = String(s.station_id).toLowerCase();
    const sName = String(s.station_name).toLowerCase();
    const sLine = String(s.line_name).toLowerCase();

    if (idFilter && !sId.includes(idFilter)) return false;
    if (nameFilter && !sName.includes(nameFilter)) return false;
    if (lineFilter && !sLine.includes(lineFilter)) return false;
    return true;
  });

  if (sortCol && sortDir) {
    filtered.sort((a, b) => {
      let va = a[sortCol];
      let vb = b[sortCol];
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
    countEl.textContent = `Showing ${filtered.length} of ${allStations.length} stations`;
  }

  const tbody = document.getElementById(`station-${mode}-tbody`);
  if (!tbody) return;
  tbody.innerHTML = "";

  if (filtered.length === 0) {
    const cols = mode === "show" ? 3 : 4;
    tbody.innerHTML = `<tr><td colspan="${cols}" style="text-align:center; color:#888;">No matching stations found</td></tr>`;
    return;
  }

  filtered.forEach((s) => {
    const tr = document.createElement("tr");
    tr.id = `row-${s.station_id}`;

    let actionTd = "";
    if (mode === "update") {
      actionTd = `<td><button type="button" class="btn btn-warning btn-sm" onclick="selectStationForUpdate(${s.station_id})">✏️ Update</button></td>`;
    } else if (mode === "delete") {
      actionTd = `<td><button type="button" class="btn btn-danger btn-sm" onclick="selectStationForDelete(${s.station_id}, '${escapeHTML(s.station_name)}')">🗑️ Delete</button></td>`;
    }

    tr.innerHTML = `
      <td><strong>${escapeHTML(s.station_id)}</strong></td>
      <td>${escapeHTML(s.station_name)}</td>
      <td>${escapeHTML(s.line_name)}</td>
      ${actionTd}
    `;
    tbody.appendChild(tr);
  });
}

// ----------------- ADD STATION -----------------
async function handleAddStation(e) {
  e.preventDefault();

  const idVal = document.getElementById("station_id").value.trim();
  const nameVal = document.getElementById("station_name").value.trim();
  const lineVal = document.getElementById("line_name").value.trim();

  const idNum = parseInt(idVal, 10);
  if (isNaN(idNum) || idNum <= 0) {
    return showMessage("Station ID must be a positive integer.", true);
  }

  const payload = {
    station_id: idNum,
    station_name: nameVal,
    line_name: lineVal,
  };

  try {
    const res = await createStation(payload);
    showMessage(res.message || "Station added successfully!");
    document.getElementById("station-add-form").reset();
  } catch (err) {
    showMessage(err.message, true);
  }
}

// ----------------- UPDATE STATION -----------------
window.selectStationForUpdate = function (id) {
  const s = allStations.find((x) => x.station_id == id);
  if (!s) return;

  document.querySelectorAll("#station-update-tbody tr").forEach((r) => r.classList.remove("selected-row"));
  const row = document.getElementById(`row-${id}`);
  if (row) row.classList.add("selected-row");

  document.getElementById("edit_station_id").value = s.station_id;
  document.getElementById("display-station-id").textContent = s.station_id;
  document.getElementById("edit_station_name").value = s.station_name;
  document.getElementById("edit_line_name").value = s.line_name;

  const area = document.getElementById("update-form-area");
  area.style.display = "block";
  area.scrollIntoView({ behavior: "smooth" });
};

window.cancelUpdate = function () {
  const area = document.getElementById("update-form-area");
  if (area) area.style.display = "none";
  document.querySelectorAll("#station-update-tbody tr").forEach((r) => r.classList.remove("selected-row"));
};

async function handleUpdateStation(e) {
  e.preventDefault();

  const id = document.getElementById("edit_station_id").value;
  const payload = {
    station_name: document.getElementById("edit_station_name").value.trim(),
    line_name: document.getElementById("edit_line_name").value.trim(),
  };

  try {
    const res = await updateStation(id, payload);
    showMessage(res.message || "Station updated successfully!");
    cancelUpdate();

    const r = await getStations();
    allStations = r.data || [];
    fillDatalists();
    renderStationsTable("update");
  } catch (err) {
    showMessage(err.message, true);
  }
}

// ----------------- DELETE STATION -----------------
window.selectStationForDelete = async function (id, name) {
  if (!confirm(`Are you sure you want to delete Station #${id} (${name})?`)) {
    return;
  }

  try {
    const res = await deleteStation(id);
    showMessage(res.message || "Station deleted successfully!");

    const r = await getStations();
    allStations = r.data || [];
    fillDatalists();
    renderStationsTable("delete");
  } catch (err) {
    showMessage(err.message, true);
  }
};
