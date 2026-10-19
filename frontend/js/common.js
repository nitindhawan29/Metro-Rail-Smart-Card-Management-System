// Simple shared helpers for the project

function showMessage(message, isError = false) {
  const msgArea = document.getElementById("message-area");
  if (!msgArea) return;

  msgArea.textContent = message;
  msgArea.className = isError ? "message-error" : "message-success";
  msgArea.style.display = "block";

  setTimeout(() => {
    msgArea.style.display = "none";
  }, 5000);
}

function escapeHTML(str) {
  if (str === null || str === undefined) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function formatCurrency(amount) {
  const num = Number(amount);
  return isNaN(num) ? "₹ 0.00" : `₹ ${num.toFixed(2)}`;
}

// Helper to fill <datalist> with unique values
function populateDatalist(datalistId, items) {
  const dl = document.getElementById(datalistId);
  if (!dl) return;

  dl.innerHTML = "";
  const unique = Array.from(new Set(items.map((x) => (x !== null && x !== undefined ? String(x).trim() : "")).filter(Boolean)));
  unique.sort((a, b) => {
    const na = Number(a), nb = Number(b);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return a.localeCompare(b);
  });

  unique.forEach((val) => {
    const opt = document.createElement("option");
    opt.value = val;
    dl.appendChild(opt);
  });
}

// Simple filter and sort function
function filterAndSort(records, filters, sortCol, sortDir) {
  // 1. Filter
  let result = records.filter((item) => {
    for (const [key, searchVal] of Object.entries(filters)) {
      if (!searchVal || searchVal.trim() === "") continue;
      const term = searchVal.trim().toLowerCase();
      const val = item[key] !== null && item[key] !== undefined ? String(item[key]).toLowerCase() : "";
      if (!val.includes(term)) {
        return false;
      }
    }
    return true;
  });

  // 2. Sort
  if (sortCol && sortDir) {
    result.sort((a, b) => {
      let va = a[sortCol];
      let vb = b[sortCol];
      if (va === null || va === undefined) va = "";
      if (vb === null || vb === undefined) vb = "";

      const na = Number(va), nb = Number(vb);
      if (!isNaN(na) && !isNaN(nb) && String(va).trim() !== "" && String(vb).trim() !== "") {
        return sortDir === "asc" ? na - nb : nb - na;
      }

      const sa = String(va).toLowerCase();
      const sb = String(vb).toLowerCase();
      return sortDir === "asc" ? sa.localeCompare(sb) : sb.localeCompare(sa);
    });
  }

  return result;
}
