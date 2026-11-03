const router = require("express").Router();
const crypto = require("crypto");
const { requireAdmin, setAdminCookie, clearAdminCookie } = require("../middleware/admin-auth");
const {
    adminGallery, uploadGalleryImage, updateGalleryImage, removeGalleryImage
} = require("../controllers/gallery.controller");

const loginAttempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

router.post("/login", (req, res) => {
    const ip = req.ip;
    const now = Date.now();
    const record = loginAttempts.get(ip);
    if (record && now - record.startedAt < WINDOW_MS && record.count >= MAX_ATTEMPTS) {
        return res.status(429).json({ error: "Too many login attempts. Try again in 15 minutes." });
    }

    const configuredPassword = process.env.ADMIN_PASSWORD || "";
    const suppliedPassword = typeof req.body?.password === "string" ? req.body.password : "";
    const supplied = Buffer.from(suppliedPassword);
    const expected = Buffer.from(configuredPassword);
    const valid = configuredPassword.length >= 12 && supplied.length === expected.length &&
        crypto.timingSafeEqual(supplied, expected);

    if (!valid) {
        const next = !record || now - record.startedAt >= WINDOW_MS
            ? { startedAt: now, count: 1 }
            : { ...record, count: record.count + 1 };
        loginAttempts.set(ip, next);
        return res.status(401).json({ error: "Invalid admin password." });
    }

    loginAttempts.delete(ip);
    setAdminCookie(res);
    res.json({ message: "Signed in successfully." });
});

router.post("/logout", (_req, res) => {
    clearAdminCookie(res);
    res.json({ message: "Signed out." });
});

router.get("/session", requireAdmin, (_req, res) => res.json({ authenticated: true }));
router.get("/gallery", requireAdmin, adminGallery);
router.post("/gallery", requireAdmin, uploadGalleryImage);
router.patch("/gallery/:id", requireAdmin, updateGalleryImage);
router.delete("/gallery/:id", requireAdmin, removeGalleryImage);

module.exports = router;
