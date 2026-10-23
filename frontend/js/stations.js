// JavaScript for Stations operations
// Clean and straightforward syntax for DBMS Lab Project

let allStations = [];
let sortCol = "station_id";
let sortDir = "asc";

document.addEventListener("DOMContentLoaded", async function () {
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
    allStations = res.data ? res.data : [];

    fillDatalists();
    setupFilterEvents(mode);
    renderStationsTable(mode);
  } catch (err) {
    showMessage(err.message, true);
  }
}

function fillDatalists() {
  const ids = [];
  const names = [];
  const lines = [];

  for (let i = 0; i < allStations.length; i++) {
    const s = allStations[i];
    ids.push(s.station_id);
    names.push(s.station_name);
    lines.push(s.line_name);
  }

  populateDatalist("dl-id", ids);
  populateDatalist("dl-name", names);
  populateDatalist("dl-line", lines);
}

function setupFilterEvents(mode) {
  const fields = ["id", "name", "line"];

  for (let i = 0; i < fields.length; i++) {
    const f = fields[i];

    // Input typing listener
    const input = document.getElementById("filter-" + f);
    if (input) {
      input.addEventListener("input", function () {
        renderStationsTable(mode);
      });
    }

    // Sort toggle button listener
    const sortBtn = document.getElementById("sort-" + f);
    if (sortBtn) {
      sortBtn.addEventListener("click", function () {
        const colMap = {
          id: "station_id",
          name: "station_name",
          line: "line_name"
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
        renderStationsTable(mode);
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
    { id: "sort-line", col: "line_name" }
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

function renderStationsTable(mode) {
  const idFilter = getInputValue("filter-id").toLowerCase();
  const nameFilter = getInputValue("filter-name").toLowerCase();
  const lineFilter = getInputValue("filter-line").toLowerCase();

  // 1. Filter stations
  const filtered = [];
  for (let i = 0; i < allStations.length; i++) {
    const s = allStations[i];
    const sId = String(s.station_id).toLowerCase();
    const sName = String(s.station_name).toLowerCase();
    const sLine = String(s.line_name).toLowerCase();

    if (idFilter && sId.indexOf(idFilter) === -1) continue;
    if (nameFilter && sName.indexOf(nameFilter) === -1) continue;
    if (lineFilter && sLine.indexOf(lineFilter) === -1) continue;

    filtered.push(s);
  }

  // 2. Sort stations
  if (sortCol && sortDir) {
    filtered.sort(function (a, b) {
      let va = a[sortCol];
      let vb = b[sortCol];
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
    countEl.textContent = "Showing " + filtered.length + " of " + allStations.length + " stations";
  }

  const tbody = document.getElementById("station-" + mode + "-tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (filtered.length === 0) {
    const cols = mode === "show" ? 3 : 4;
    tbody.innerHTML = '<tr><td colspan="' + cols + '" style="text-align:center; color:#888;">No matching stations found</td></tr>';
    return;
  }

  for (let j = 0; j < filtered.length; j++) {
    const s = filtered[j];
    const tr = document.createElement("tr");
    tr.id = "row-" + s.station_id;

    let actionTd = "";
    if (mode === "update") {
      actionTd = '<td><button type="button" class="btn btn-warning btn-sm" onclick="selectStationForUpdate(' + s.station_id + ')">✏️ Update</button></td>';
    } else if (mode === "delete") {
      actionTd = '<td><button type="button" class="btn btn-danger btn-sm" onclick="selectStationForDelete(' + s.station_id + ", '" + escapeHTML(s.station_name) + "')\">🗑️ Delete</button></td>";
    }

    tr.innerHTML =
      "<td><strong>" + escapeHTML(s.station_id) + "</strong></td>" +
      "<td>" + escapeHTML(s.station_name) + "</td>" +
      "<td>" + escapeHTML(s.line_name) + "</td>" +
      actionTd;

    tbody.appendChild(tr);
  }
}

// ----------------- ADD STATION -----------------
async function handleAddStation(e) {
  e.preventDefault();

  const idVal = getInputValue("station_id");
  const nameVal = getInputValue("station_name");
  const lineVal = getInputValue("line_name");

  const idNum = parseInt(idVal, 10);
  if (isNaN(idNum) || idNum <= 0) {
    showMessage("Station ID must be a positive integer.", true);
    return;
  }

  const payload = {
    station_id: idNum,
    station_name: nameVal,
    line_name: lineVal
  };

  try {
    const res = await createStation(payload);
    showMessage(res.message ? res.message : "Station added successfully!");
    document.getElementById("station-add-form").reset();
  } catch (err) {
    showMessage(err.message, true);
  }
}

// ----------------- UPDATE STATION -----------------
window.selectStationForUpdate = function (id) {
  let s = null;
  for (let i = 0; i < allStations.length; i++) {
    if (allStations[i].station_id == id) {
      s = allStations[i];
      break;
    }
  }
  if (!s) return;

  const allRows = document.querySelectorAll("#station-update-tbody tr");
  for (let j = 0; j < allRows.length; j++) {
    allRows[j].classList.remove("selected-row");
  }
  const row = document.getElementById("row-" + id);
  if (row) {
    row.classList.add("selected-row");
  }

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
  if (area) {
    area.style.display = "none";
  }
  const allRows = document.querySelectorAll("#station-update-tbody tr");
  for (let i = 0; i < allRows.length; i++) {
    allRows[i].classList.remove("selected-row");
  }
};

async function handleUpdateStation(e) {
  e.preventDefault();

  const id = document.getElementById("edit_station_id").value;
  const payload = {
    station_name: getInputValue("edit_station_name"),
    line_name: getInputValue("edit_line_name")
  };

  try {
    const res = await updateStation(id, payload);
    showMessage(res.message ? res.message : "Station updated successfully!");
    cancelUpdate();

    const r = await getStations();
    allStations = r.data ? r.data : [];
    fillDatalists();
    renderStationsTable("update");
  } catch (err) {
    showMessage(err.message, true);
  }
}

// ----------------- DELETE STATION -----------------
window.selectStationForDelete = async function (id, name) {
  const confirmed = confirm("Are you sure you want to delete Station #" + id + " (" + name + ")?");
  if (!confirmed) {
    return;
  }

  try {
    const res = await deleteStation(id);
    showMessage(res.message ? res.message : "Station deleted successfully!");

    const r = await getStations();
    allStations = r.data ? r.data : [];
    fillDatalists();
    renderStationsTable("delete");
  } catch (err) {
    showMessage(err.message, true);
  }
};
