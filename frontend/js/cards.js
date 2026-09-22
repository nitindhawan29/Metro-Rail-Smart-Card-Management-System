let currentCards = [];
let passengerMap = {};

document.addEventListener("DOMContentLoaded", async () => {
  await initializePage();

  document
    .getElementById("card-form")
    .addEventListener("submit", handleFormSubmit);

  document.getElementById("cancel-btn").addEventListener("click", () => {
    resetForm("card-form", "form-title", "Issue New Smart Card");
    document.getElementById("card_id").value = "";
  });

  document
    .getElementById("search-input")
    .addEventListener("input", handleSearch);
});

async function initializePage() {
  try {
    // 1. Fetch passengers to populate the dropdown and build the lookup map
    const passRes = await getPassengers();
    const passengers = passRes.data;

    const dropdown = document.getElementById("passenger_id");
    dropdown.innerHTML = '<option value="">Select a passenger...</option>';

    passengers.forEach((p) => {
      passengerMap[p.passenger_id] = p.passenger_name;

      const option = document.createElement("option");
      option.value = p.passenger_id;
      option.textContent = p.passenger_name;
      dropdown.appendChild(option);
    });

    // 2. Fetch and render the smart cards
    await loadCards();
  } catch (error) {
    showMessage(error.message, true);
  }
}

async function loadCards() {
  try {
    const response = await getCards();
    currentCards = response.data;
    renderTable(currentCards);
  } catch (error) {
    showMessage(error.message, true);
  }
}

function renderTable(data) {
  const tbody = document.getElementById("cards-body");
  tbody.innerHTML = "";

  if (data.length === 0) {
    tbody.innerHTML =
      '<tr id="empty-state"><td colspan="5">No records found</td></tr>';
    return;
  }

  data.forEach((c) => {
    const tr = document.createElement("tr");
    // Map the passenger ID to the actual name using our local map
    const pName = passengerMap[c.passenger_id] || "Unknown Passenger";

    tr.innerHTML = `
            <td>${escapeHTML(c.card_id)}</td>
            <td>${escapeHTML(c.card_number)}</td>
            <td>${escapeHTML(pName)}</td>
            <td>₹ ${Number(c.balance).toFixed(2)}</td>
            <td>
                <button onclick="editCard(${c.card_id})">Edit</button>
                <button onclick="deleteCardAction(${c.card_id})" style="background-color: #dc3545;">Delete</button>
            </td>
        `;
    tbody.appendChild(tr);
  });
}

async function handleFormSubmit(e) {
  e.preventDefault();

  const id = document.getElementById("card_id").value;
  const passengerId = document.getElementById("passenger_id").value;
  const cardNumber = document.getElementById("card_number").value.trim();
  const balance = document.getElementById("balance").value;

  // Strict Validation: METROxxxx
  if (!/^METRO[0-9]{4}$/.test(cardNumber)) {
    return showMessage(
      "Card number must be exactly METRO followed by 4 digits (e.g., METRO0001).",
      true,
    );
  }

  const payload = {
    passenger_id: parseInt(passengerId),
    card_number: cardNumber,
    balance: parseFloat(balance),
  };

  try {
    document.getElementById("submit-btn").disabled = true;
    let response;

    if (id) {
      response = await updateCard(id, payload);
    } else {
      response = await createCard(payload);
    }

    showMessage(response.message);
    resetForm("card-form", "form-title", "Issue New Smart Card");
    await loadCards();
  } catch (error) {
    showMessage(error.message, true);
  } finally {
    document.getElementById("submit-btn").disabled = false;
  }
}

window.editCard = function (id) {
  const card = currentCards.find((c) => c.card_id == id);
  if (!card) return;

  document.getElementById("card_id").value = card.card_id;
  document.getElementById("passenger_id").value = card.passenger_id;
  document.getElementById("card_number").value = card.card_number;
  document.getElementById("balance").value = card.balance;

  document.getElementById("form-title").textContent = "Edit Smart Card";
  document.getElementById("submit-btn").textContent = "Update";
  document.getElementById("cancel-btn").style.display = "inline-block";
};

window.deleteCardAction = async function (id) {
  if (!confirm("Are you sure you want to delete this smart card?")) return;

  try {
    const response = await deleteCard(id);
    showMessage(response.message);
    await loadCards();

    // FIX: Automatically clear the form if the deleted card was sitting in the form
    if (document.getElementById("card_id").value == id) {
      resetForm("card-form", "form-title", "Issue New Smart Card");
      document.getElementById("card_id").value = "";
    }
  } catch (error) {
    showMessage(error.message, true);
  }
};

function handleSearch(e) {
  const term = e.target.value.toLowerCase();
  const filtered = currentCards.filter((c) => {
    const pName = (passengerMap[c.passenger_id] || "").toLowerCase();
    return c.card_number.toLowerCase().includes(term) || pName.includes(term);
  });
  renderTable(filtered);
}
