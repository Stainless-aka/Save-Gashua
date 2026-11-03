const form = document.querySelector("#donation-form");
if (form) form.addEventListener("submit", async event => {
  event.preventDefault();
  const message = document.querySelector("#form-message");
  const button = form.querySelector('button[type="submit"]');
  const payload = Object.fromEntries(new FormData(form).entries());
  button.disabled = true;
  try {
    const { error } = await window.saveGashuaSupabase.from("donations").insert({
      donor_name: String(payload.donorName || "").trim(),
      email: String(payload.email || "").trim() || null,
      amount: Number(payload.amount), transfer_date: payload.transferDate,
      reference: String(payload.reference || "").trim() || null, status: "donor_reported"
    });
    if (error) throw error;
    message.textContent = "Thank you. Your contribution details have been recorded.";
    form.reset();
  } catch (error) { console.error(error); message.textContent = "Could not submit details. Please check your connection and try again."; }
  finally { button.disabled = false; }
});
