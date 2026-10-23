// Dashboard JavaScript - Metro Rail Management System

document.addEventListener("DOMContentLoaded", async function () {
  try {
    // 1. Fetch data from backend for each entity
    const passRes = await getPassengers();
    const cardRes = await getCards();
    const statRes = await getStations();
    const transRes = await getTransactions();

    const passengers = passRes.data ? passRes.data : [];
    const cards = cardRes.data ? cardRes.data : [];
    const stations = statRes.data ? statRes.data : [];
    const transactions = transRes.data ? transRes.data : [];

    // 2. Display summary count on the stat cards
    document.getElementById("total-passengers").textContent = passengers.length;
    document.getElementById("total-cards").textContent = cards.length;
    document.getElementById("total-stations").textContent = stations.length;
    document.getElementById("total-transactions").textContent = transactions.length;

    // 3. Build lookup maps for readable names
    const passengerMap = {};
    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      passengerMap[p.passenger_id] = p.passenger_name;
    }

    const cardMap = {};
    for (let j = 0; j < cards.length; j++) {
      const c = cards[j];
      const pName = passengerMap[c.passenger_id] ? passengerMap[c.passenger_id] : "Unknown";
      cardMap[c.card_id] = { number: c.card_number, passenger: pName };
    }

    const stationMap = {};
    for (let k = 0; k < stations.length; k++) {
      const s = stations[k];
      stationMap[s.station_id] = {
        name: s.station_name,
        line: s.line_name
      };
    }

    // 4. Sort transactions by date descending to get the top 5 recent ones
    const sortedTransactions = transactions.slice();
    sortedTransactions.sort(function (a, b) {
      const dateA = new Date(a.transaction_date);
      const dateB = new Date(b.transaction_date);
      return dateB - dateA;
    });
    const recentTransactions = sortedTransactions.slice(0, 5);

    // 5. Render recent transactions table
    const tbody = document.getElementById("recent-transactions-body");
    tbody.innerHTML = "";

    if (recentTransactions.length === 0) {
      tbody.innerHTML = '<tr id="empty-state"><td colspan="5" style="text-align:center; color:#888;">No recent transactions recorded</td></tr>';
      return;
    }

    for (let m = 0; m < recentTransactions.length; m++) {
      const t = recentTransactions[m];
      const tr = document.createElement("tr");

      const cardInfo = cardMap[t.card_id] ? cardMap[t.card_id] : { number: t.card_number ? t.card_number : "Unknown" };
      const statInfo = stationMap[t.station_id] ? stationMap[t.station_id] : { name: t.station_name ? t.station_name : "Unknown" };
      const dateStr = t.transaction_date ? new Date(t.transaction_date).toLocaleString("en-IN") : "N/A";

      tr.innerHTML =
        "<td><strong>" + escapeHTML(t.transaction_id) + "</strong></td>" +
        "<td>" + escapeHTML(cardInfo.number) + "</td>" +
        "<td>" + escapeHTML(statInfo.name) + "</td>" +
        "<td>" + formatCurrency(t.fare_amount) + "</td>" +
        "<td>" + escapeHTML(dateStr) + "</td>";

      tbody.appendChild(tr);
    }
  } catch (error) {
    showMessage("Failed to load dashboard data: " + error.message, true);
  }
});
