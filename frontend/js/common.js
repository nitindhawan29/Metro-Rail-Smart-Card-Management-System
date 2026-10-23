// Shared helper functions for Metro Rail Management System

// Display banner notification at the top of the page
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

// Safely escape HTML to prevent XSS
function escapeHTML(str) {
  if (str === null || str === undefined) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// Format numbers into Indian Rupee currency format (e.g. ₹ 25.00)
function formatCurrency(amount) {
  const num = Number(amount);
  return isNaN(num) ? "₹ 0.00" : `₹ ${num.toFixed(2)}`;
}

// Helper to get text input value safely
function getInputValue(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

// Populate <datalist> with unique sorted options using built-in Set and sort
function populateDatalist(datalistId, items) {
  const dl = document.getElementById(datalistId);
  if (!dl) return;

  dl.innerHTML = "";

  // Filter valid non-empty items and deduplicate using Set
  const cleanItems = items
    .filter(item => item !== null && item !== undefined && String(item).trim() !== "")
    .map(item => String(item).trim());
  const uniqueItems = [...new Set(cleanItems)];

  // Sort numerically if numbers, otherwise alphabetically
  uniqueItems.sort((a, b) => {
    const na = Number(a);
    const nb = Number(b);
    return (!isNaN(na) && !isNaN(nb)) ? na - nb : a.localeCompare(b);
  });

  uniqueItems.forEach(val => {
    const opt = document.createElement("option");
    opt.value = val;
    dl.appendChild(opt);
  });
}
