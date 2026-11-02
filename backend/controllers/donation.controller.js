const db = require("../config/database");

function createDonation(req, res) {
    const { donorName, email, amount, transferDate, reference } = req.body || {};

    const name = String(donorName || "").trim();
    const value = Number(amount);

    if (!name || !Number.isSafeInteger(value) || value <= 0 || !transferDate) {
        return res.status(400).json({
            error: "Name, valid amount and transfer date are required."
        });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(transferDate)) {
        return res.status(400).json({
            error: "Please provide a valid transfer date."
        });
    }

    try {
        const result = db.prepare(`
            INSERT INTO donations (
                donor_name,
                email,
                amount,
                transfer_date,
                reference,
                status
            )
            VALUES (?, ?, ?, ?, ?, 'donor_reported')
        `).run(
            name.slice(0, 120),
            email ? String(email).trim().slice(0, 254) : null,
            value,
            transferDate,
            reference ? String(reference).trim().slice(0, 120) : null
        );

        return res.status(201).json({
            message: "Contribution details recorded.",
            id: result.lastInsertRowid
        });

    } catch (error) {
        console.error("Donation recording error:", error);

        return res.status(500).json({
            error: "Could not record contribution details."
        });
    }
}

module.exports = { createDonation };