function showMessage(message, isError = false) {
  const msgArea = document.getElementById("message-area");
  if (!msgArea) return;

  msgArea.textContent = message;
  msgArea.className = isError ? "message-error" : "message-success";

  setTimeout(() => (msgArea.className = "message-hidden"), 7000);
}

function escapeHTML(str) {
  if (str === null || str === undefined) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function resetForm(formId, titleId, defaultTitle) {
  const form = document.getElementById(formId);
  if (form) form.reset();
  document.getElementById(titleId).textContent = defaultTitle;
  const cancelBtn = document.getElementById("cancel-btn");
  if (cancelBtn) cancelBtn.style.display = "none";
  document.getElementById("submit-btn").textContent = "Save";
}
