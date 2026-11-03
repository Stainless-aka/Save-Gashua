const crypto = require("crypto");

const COOKIE_NAME = "save_gashua_admin";
const SESSION_DURATION = 8 * 60 * 60 * 1000;

function sign(value) {
    return crypto.createHmac("sha256", process.env.SESSION_SECRET).update(value).digest("hex");
}

function createToken() {
    const issuedAt = Date.now().toString();
    return issuedAt + "." + sign(issuedAt);
}

function isValidToken(token) {
    if (!process.env.SESSION_SECRET || typeof token !== "string") return false;
    const [issuedAt, signature, extra] = token.split(".");
    if (!issuedAt || !signature || extra) return false;
    const timestamp = Number(issuedAt);
    if (!Number.isSafeInteger(timestamp) || Date.now() - timestamp > SESSION_DURATION || timestamp > Date.now()) return false;
    const expected = sign(issuedAt);
    const actualBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    return actualBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}

function parseCookies(header = "") {
    return Object.fromEntries(header.split(";").map(part => {
        const index = part.indexOf("=");
        return index < 0 ? ["", ""] : [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim())];
    }).filter(([key]) => key));
}

function requireAdmin(req, res, next) {
    const token = parseCookies(req.headers.cookie)[COOKIE_NAME];
    if (!isValidToken(token)) return res.status(401).json({ error: "Admin authentication required." });
    next();
}

function setAdminCookie(res) {
    res.cookie(COOKIE_NAME, createToken(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: SESSION_DURATION,
        path: "/"
    });
}

function clearAdminCookie(res) {
    res.clearCookie(COOKIE_NAME, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/" });
}

module.exports = { requireAdmin, setAdminCookie, clearAdminCookie };
