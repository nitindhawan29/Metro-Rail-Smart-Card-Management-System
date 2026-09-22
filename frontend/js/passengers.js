let currentPassengers = [];

document.addEventListener("DOMContentLoaded", () => {
  loadPassengers();

  document
    .getElementById("passenger-form")
    .addEventListener("submit", handleFormSubmit);

  document.getElementById("cancel-btn").addEventListener("click", () => {
    resetForm("passenger-form", "form-title", "Add New Passenger");
    document.getElementById("passenger_id").value = "";
  });

  document
    .getElementById("search-input")
    .addEventListener("input", handleSearch);
});

async function loadPassengers() {
  try {
    const response = await getPassengers();
    currentPassengers = response.data;
    renderTable(currentPassengers);
  } catch (error) {
    showMessage(error.message, true);
  }
}

function renderTable(data) {
  const tbody = document.getElementById("passengers-body");
  tbody.innerHTML = "";

  if (data.length === 0) {
    tbody.innerHTML =
      '<tr id="empty-state"><td colspan="5">No records found</td></tr>';
    return;
  }

  data.forEach((p) => {
    const tr = document.createElement("tr");
    const fullMobile = `${p.country_code} ${p.mobile_number}`;

    tr.innerHTML = `
            <td>${escapeHTML(p.passenger_id)}</td>
            <td>${escapeHTML(p.passenger_name)}</td>
            <td>${escapeHTML(fullMobile)}</td>
            <td>${escapeHTML(p.email || "N/A")}</td>
            <td>
                <button onclick="editPassenger(${p.passenger_id})">Edit</button>
                <button onclick="deletePassengerAction(${p.passenger_id})" style="background-color: #dc3545;">Delete</button>
            </td>
        `;
    tbody.appendChild(tr);
  });
}

async function handleFormSubmit(e) {
  e.preventDefault();

  const id = document.getElementById("passenger_id").value;
  const name = document.getElementById("passenger_name").value.trim();
  const countryCode = document.getElementById("country_code").value.trim();
  const mobile = document.getElementById("mobile_number").value.trim();
  const email = document.getElementById("email").value.trim();

  // Strict Validation
  if (!/^[+][1-9][0-9]{0,2}$/.test(countryCode)) {
    return showMessage("Invalid country code. Format must be like +91", true);
  }
  if (!/^[0-9]{4,14}$/.test(mobile)) {
    return showMessage(
      "Mobile number must contain strictly 4 to 14 digits.",
      true,
    );
  }
  if (countryCode.replace("+", "").length + mobile.length > 15) {
    return showMessage(
      "Combined country code and mobile digits must not exceed 15.",
      true,
    );
  }

  const payload = {
    passenger_name: name,
    country_code: countryCode,
    mobile_number: mobile,
    email: email,
  };

  try {
    document.getElementById("submit-btn").disabled = true;
    let response;

    if (id) {
      response = await updatePassenger(id, payload);
    } else {
      response = await createPassenger(payload);
    }

    showMessage(response.message);
    resetForm("passenger-form", "form-title", "Add New Passenger");
    await loadPassengers();
  } catch (error) {
    showMessage(error.message, true);
  } finally {
    document.getElementById("submit-btn").disabled = false;
  }
}

window.editPassenger = function (id) {
  const passenger = currentPassengers.find((p) => p.passenger_id == id);
  if (!passenger) return;

  document.getElementById("passenger_id").value = passenger.passenger_id;
  document.getElementById("passenger_name").value = passenger.passenger_name;
  document.getElementById("country_code").value = passenger.country_code;
  document.getElementById("mobile_number").value = passenger.mobile_number;
  document.getElementById("email").value = passenger.email || "";

  document.getElementById("form-title").textContent = "Edit Passenger";
  document.getElementById("submit-btn").textContent = "Update";
  document.getElementById("cancel-btn").style.display = "inline-block";
};

window.deletePassengerAction = async function (id) {
  if (!confirm("Are you sure you want to delete this passenger?")) return;

  try {
    const response = await deletePassenger(id);
    showMessage(response.message);
    await loadPassengers();

    // FIX: Automatically clear the form if the deleted passenger was sitting in the form
    if (document.getElementById("passenger_id").value == id) {
      resetForm("passenger-form", "form-title", "Add New Passenger");
      document.getElementById("passenger_id").value = "";
    }
  } catch (error) {
    showMessage(error.message, true);
  }
};

function handleSearch(e) {
  const term = e.target.value.toLowerCase();
  const filtered = currentPassengers.filter(
    (p) =>
      p.passenger_name.toLowerCase().includes(term) ||
      p.mobile_number.includes(term) ||
      (p.email && p.email.toLowerCase().includes(term)),
  );
  renderTable(filtered);
}
