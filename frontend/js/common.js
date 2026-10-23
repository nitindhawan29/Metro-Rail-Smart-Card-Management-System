// Simple shared helper functions for the Metro Rail project

// Display banner notification at the top of the page
function showMessage(message, isError) {
  const msgArea = document.getElementById("message-area");
  if (!msgArea) return;

  msgArea.textContent = message;
  if (isError) {
    msgArea.className = "message-error";
  } else {
    msgArea.className = "message-success";
  }
  msgArea.style.display = "block";

  // Hide after 5 seconds
  setTimeout(function () {
    msgArea.style.display = "none";
  }, 5000);
}

// Safely escape HTML to prevent XSS
function escapeHTML(str) {
  if (str === null || str === undefined) {
    return "";
  }
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// Format numbers into Indian Rupee currency format (e.g. ₹ 25.00)
function formatCurrency(amount) {
  const num = Number(amount);
  if (isNaN(num)) {
    return "₹ 0.00";
  }
  return "₹ " + num.toFixed(2);
}

// Helper to get text input value safely without optional chaining (?.)
function getInputValue(elementId) {
  const element = document.getElementById(elementId);
  if (element && element.value !== undefined) {
    return element.value.trim();
  }
  return "";
}

// Populate <datalist> with sorted unique values for search suggestions
function populateDatalist(datalistId, items) {
  const dl = document.getElementById(datalistId);
  if (!dl) return;

  dl.innerHTML = "";

  // 1. Collect unique, non-empty values using standard array loop
  const unique = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item !== null && item !== undefined) {
      const str = String(item).trim();
      if (str !== "" && unique.indexOf(str) === -1) {
        unique.push(str);
      }
    }
  }

  // 2. Sort the values (numerically if numbers, otherwise alphabetically)
  unique.sort(function (a, b) {
    const na = Number(a);
    const nb = Number(b);
    if (!isNaN(na) && !isNaN(nb)) {
      return na - nb;
    }
    return a.localeCompare(b);
  });

  // 3. Create <option> tags and append to datalist
  for (let j = 0; j < unique.length; j++) {
    const opt = document.createElement("option");
    opt.value = unique[j];
    dl.appendChild(opt);
  }
}

// Filter and sort records using simple standard loops
function filterAndSort(records, filters, sortCol, sortDir) {
  const result = [];

  // 1. Filter records matching all active search terms
  for (let i = 0; i < records.length; i++) {
    const item = records[i];
    let matches = true;

    for (const key in filters) {
      const searchVal = filters[key];
      if (searchVal && searchVal.trim() !== "") {
        const term = searchVal.trim().toLowerCase();
        let val = "";
        if (item[key] !== null && item[key] !== undefined) {
          val = String(item[key]).toLowerCase();
        }
        if (val.indexOf(term) === -1) {
          matches = false;
          break;
        }
      }
    }

    if (matches) {
      result.push(item);
    }
  }

  // 2. Sort the filtered records
  if (sortCol && sortDir) {
    result.sort(function (a, b) {
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

  return result;
}
