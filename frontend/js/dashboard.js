document.addEventListener("DOMContentLoaded", async () => {
  try {
    // 1. Fetch all data concurrently using the existing list APIs
    const [passRes, cardRes, statRes, transRes] = await Promise.all([
      getPassengers(),
      getCards(),
      getStations(),
      getTransactions(),
    ]);

    const passengers = passRes.data;
    const cards = cardRes.data;
    const stations = statRes.data;
    const transactions = transRes.data;

    // 2. Calculate and display the summary totals
    document.getElementById("total-passengers").textContent = passengers.length;
    document.getElementById("total-cards").textContent = cards.length;
    document.getElementById("total-stations").textContent = stations.length;
    document.getElementById("total-transactions").textContent =
      transactions.length;

    // 3. Build lookup maps (just like Stage 14) to display readable names
    const passengerMap = {};
    passengers.forEach(
      (p) => (passengerMap[p.passenger_id] = p.passenger_name),
    );

    const cardMap = {};
    cards.forEach((c) => {
      const pName = passengerMap[c.passenger_id] || "Unknown";
      cardMap[c.card_id] = { number: c.card_number, passenger: pName };
    });

    const stationMap = {};
    stations.forEach(
      (s) =>
        (stationMap[s.station_id] = {
          name: s.station_name,
          line: s.line_name,
        }),
    );

    // 4. Sort transactions by date (descending) and take the top 5 recent ones
    const recentTransactions = [...transactions]
      .sort(
        (a, b) => new Date(b.transaction_date) - new Date(a.transaction_date),
      )
      .slice(0, 5);

    // 5. Render the Recent Transactions Table
    const tbody = document.getElementById("recent-transactions-body");
    tbody.innerHTML = "";

    if (recentTransactions.length === 0) {
      tbody.innerHTML =
        '<tr id="empty-state"><td colspan="5">No records found</td></tr>';
      return;
    }

    recentTransactions.forEach((t) => {
      const tr = document.createElement("tr");

      // Map IDs to readable names
      const cardInfo = cardMap[t.card_id] || {
        number: "Unknown",
        passenger: "Unknown",
      };
      const statInfo = stationMap[t.station_id] || {
        name: "Unknown",
        line: "Unknown",
      };

      tr.innerHTML = `
                <td>${escapeHTML(t.transaction_id)}</td>
                <td>${escapeHTML(cardInfo.number)}</td>
                <td>${escapeHTML(statInfo.name)}</td>
                <td>₹ ${Number(t.fare_amount).toFixed(2)}</td>
                <td>${escapeHTML(t.transaction_date)}</td>
            `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    showMessage("Failed to load dashboard data: " + error.message, true);
  }
});
