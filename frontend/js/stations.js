let currentStations = [];

document.addEventListener("DOMContentLoaded", () => {
  loadStations();

  document
    .getElementById("station-form")
    .addEventListener("submit", handleFormSubmit);

  document.getElementById("cancel-btn").addEventListener("click", () => {
    resetForm("station-form", "form-title", "Add New Station");
    document.getElementById("station_id").value = "";
  });

  document
    .getElementById("search-input")
    .addEventListener("input", handleSearch);
});

async function loadStations() {
  try {
    const response = await getStations();
    currentStations = response.data;
    renderTable(currentStations);
  } catch (error) {
    showMessage(error.message, true);
  }
}

function renderTable(data) {
  const tbody = document.getElementById("stations-body");
  tbody.innerHTML = "";

  if (data.length === 0) {
    tbody.innerHTML =
      '<tr id="empty-state"><td colspan="4">No records found</td></tr>';
    return;
  }

  data.forEach((s) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
            <td>${escapeHTML(s.station_id)}</td>
            <td>${escapeHTML(s.station_name)}</td>
            <td>${escapeHTML(s.line_name)}</td>
            <td>
                <button onclick="editStation(${s.station_id})">Edit</button>
                <button onclick="deleteStationAction(${s.station_id})" style="background-color: #dc3545;">Delete</button>
            </td>
        `;
    tbody.appendChild(tr);
  });
}

async function handleFormSubmit(e) {
  e.preventDefault();

  const id = document.getElementById("station_id").value;
  const name = document.getElementById("station_name").value.trim();
  const line = document.getElementById("line_name").value.trim();

  const payload = {
    station_name: name,
    line_name: line,
  };

  try {
    document.getElementById("submit-btn").disabled = true;
    let response;

    if (id) {
      response = await updateStation(id, payload);
    } else {
      response = await createStation(payload);
    }

    showMessage(response.message);
    resetForm("station-form", "form-title", "Add New Station");
    await loadStations();
  } catch (error) {
    showMessage(error.message, true);
  } finally {
    document.getElementById("submit-btn").disabled = false;
  }
}

window.editStation = function (id) {
  const station = currentStations.find((s) => s.station_id == id);
  if (!station) return;

  document.getElementById("station_id").value = station.station_id;
  document.getElementById("station_name").value = station.station_name;
  document.getElementById("line_name").value = station.line_name;

  document.getElementById("form-title").textContent = "Edit Station";
  document.getElementById("submit-btn").textContent = "Update";
  document.getElementById("cancel-btn").style.display = "inline-block";
};

window.deleteStationAction = async function (id) {
  if (!confirm("Are you sure you want to delete this station?")) return;

  try {
    const response = await deleteStation(id);
    showMessage(response.message);
    await loadStations();

    if (document.getElementById("station_id").value == id) {
      resetForm("station-form", "form-title", "Add New Station");
      document.getElementById("station_id").value = "";
    }
  } catch (error) {
    showMessage(error.message, true);
  }
};

function handleSearch(e) {
  const term = e.target.value.toLowerCase();
  const filtered = currentStations.filter(
    (s) =>
      s.station_name.toLowerCase().includes(term) ||
      s.line_name.toLowerCase().includes(term),
  );
  renderTable(filtered);
}
