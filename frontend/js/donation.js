const form = document.querySelector("#donation-form");
if (form) form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = document.querySelector("#form-message");
  const payload = Object.fromEntries(new FormData(form).entries());
  try {
    const response = await fetch("/api/donations", {
      method: "POST", headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Submission failed.");
    message.textContent = "Thank you. Your contribution details have been recorded.";
    form.reset();
  } catch (error) {
    message.textContent = error.message || "Could not submit details. Please try again.";
  }
});
