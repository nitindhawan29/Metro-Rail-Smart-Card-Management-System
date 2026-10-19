document.addEventListener("DOMContentLoaded", async () => {
  try {
    // 1. Fetch all data concurrently
    const [passRes, cardRes, statRes, transRes] = await Promise.all([
      getPassengers(),
      getCards(),
      getStations(),
      getTransactions(),
    ]);

    const passengers = passRes.data || [];
    const cards = cardRes.data || [];
    const stations = statRes.data || [];
    const transactions = transRes.data || [];

    // 2. Display summary totals
    document.getElementById("total-passengers").textContent = passengers.length;
    document.getElementById("total-cards").textContent = cards.length;
    document.getElementById("total-stations").textContent = stations.length;
    document.getElementById("total-transactions").textContent = transactions.length;

    // 3. Build lookup maps
    const passengerMap = {};
    passengers.forEach((p) => {
      passengerMap[p.passenger_id] = p.passenger_name;
    });

    const cardMap = {};
    cards.forEach((c) => {
      const pName = passengerMap[c.passenger_id] || "Unknown";
      cardMap[c.card_id] = { number: c.card_number, passenger: pName };
    });

    const stationMap = {};
    stations.forEach((s) => {
      stationMap[s.station_id] = {
        name: s.station_name,
        line: s.line_name,
      };
    });

    // 4. Sort transactions by date (descending) and take top 5
    const recentTransactions = [...transactions]
      .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))
      .slice(0, 5);

    // 5. Render recent transactions table
    const tbody = document.getElementById("recent-transactions-body");
    tbody.innerHTML = "";

    if (recentTransactions.length === 0) {
      tbody.innerHTML = '<tr id="empty-state"><td colspan="5" style="text-align:center; color:#888;">No recent transactions recorded</td></tr>';
      return;
    }

    recentTransactions.forEach((t) => {
      const tr = document.createElement("tr");
      const cardInfo = cardMap[t.card_id] || { number: t.card_number || "Unknown" };
      const statInfo = stationMap[t.station_id] || { name: t.station_name || "Unknown" };
      const dateStr = t.transaction_date ? new Date(t.transaction_date).toLocaleString("en-IN") : "N/A";

      tr.innerHTML = `
        <td><strong>${escapeHTML(t.transaction_id)}</strong></td>
        <td>${escapeHTML(cardInfo.number)}</td>
        <td>${escapeHTML(statInfo.name)}</td>
        <td>${formatCurrency(t.fare_amount)}</td>
        <td>${escapeHTML(dateStr)}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    showMessage("Failed to load dashboard data: " + error.message, true);
  }
});
