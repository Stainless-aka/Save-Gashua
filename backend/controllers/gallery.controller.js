const crypto = require("crypto");
const db = require("../config/database");

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function cloudinaryConfigReady() {
    return Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}

function cloudinarySignature(params) {
    const payload = Object.keys(params).sort().map(key => key + "=" + params[key]).join("&");
    return crypto.createHash("sha1").update(payload + process.env.CLOUDINARY_API_SECRET).digest("hex");
}

async function uploadToCloudinary(dataUrl) {
    const timestamp = Math.floor(Date.now() / 1000);
    const params = { timestamp };
    const form = new FormData();
    form.append("file", dataUrl);
    form.append("api_key", process.env.CLOUDINARY_API_KEY);
    form.append("timestamp", String(timestamp));
    form.append("signature", cloudinarySignature(params));

    const response = await fetch(`https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: form
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error?.message || "Cloudinary upload failed.");
    return result;
}

async function deleteFromCloudinary(publicId) {
    const timestamp = Math.floor(Date.now() / 1000);
    const params = { public_id: publicId, timestamp };
    const form = new FormData();
    form.append("public_id", publicId);
    form.append("api_key", process.env.CLOUDINARY_API_KEY);
    form.append("timestamp", String(timestamp));
    form.append("signature", cloudinarySignature(params));

    const response = await fetch(`https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/destroy`, {
        method: "POST",
        body: form
    });
    const result = await response.json();
    if (!response.ok || result.result === "error") throw new Error(result.error?.message || "Cloudinary deletion failed.");
    return result;
}

function publicGallery(_req, res) {
    const images = db.prepare(`
        SELECT id, title, description, image_url, created_at
        FROM gallery_images WHERE is_published = 1
        ORDER BY created_at DESC
    `).all();
    res.json({ images });
}

function adminGallery(_req, res) {
    const images = db.prepare(`
        SELECT id, title, description, image_url, is_published, created_at
        FROM gallery_images ORDER BY created_at DESC
    `).all();
    res.json({ images });
}

async function uploadGalleryImage(req, res) {
    const { title, description = "", image } = req.body || {};
    if (!title || typeof title !== "string" || !title.trim()) {
        return res.status(400).json({ error: "An image title is required." });
    }
    if (typeof image !== "string" || !/^data:image\/(jpeg|png|webp);base64,/.test(image)) {
        return res.status(400).json({ error: "Choose a valid JPG, PNG or WebP image." });
    }
    const match = image.match(/^data:(image\/(?:jpeg|png|webp));base64,([\s\S]+)$/);
    if (!match) return res.status(400).json({ error: "Invalid image data." });
    const bytes = Buffer.from(match[2], "base64");
    if (!bytes.length || bytes.length > MAX_IMAGE_BYTES || !ALLOWED_TYPES.has(match[1])) {
        return res.status(400).json({ error: "Images must be JPG, PNG or WebP and no larger than 8 MB." });
    }
    if (!cloudinaryConfigReady()) return res.status(503).json({ error: "Image storage is not configured yet. Add the Cloudinary environment variables." });

    try {
        const uploaded = await uploadToCloudinary(image);
        const result = db.prepare(`
            INSERT INTO gallery_images (title, description, image_url, cloudinary_public_id, is_published)
            VALUES (?, ?, ?, ?, 1)
        `).run(title.trim().slice(0, 120), String(description).trim().slice(0, 500), uploaded.secure_url, uploaded.public_id);
        res.status(201).json({ message: "Gallery image uploaded.", id: result.lastInsertRowid });
    } catch (error) {
        console.error("Gallery upload failed:", error);
        res.status(502).json({ error: error.message || "Could not upload image." });
    }
}

function updateGalleryImage(req, res) {
    const id = Number(req.params.id);
    const { title, description, isPublished } = req.body || {};
    if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: "Invalid image ID." });
    if (typeof title !== "string" || !title.trim()) return res.status(400).json({ error: "A title is required." });
    const result = db.prepare(`
        UPDATE gallery_images SET title = ?, description = ?, is_published = ?
        WHERE id = ?
    `).run(title.trim().slice(0, 120), String(description || "").trim().slice(0, 500), isPublished ? 1 : 0, id);
    if (!result.changes) return res.status(404).json({ error: "Gallery image not found." });
    res.json({ message: "Gallery image updated." });
}

async function removeGalleryImage(req, res) {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: "Invalid image ID." });
    const image = db.prepare("SELECT cloudinary_public_id FROM gallery_images WHERE id = ?").get(id);
    if (!image) return res.status(404).json({ error: "Gallery image not found." });
    try {
        if (image.cloudinary_public_id && cloudinaryConfigReady()) await deleteFromCloudinary(image.cloudinary_public_id);
        db.prepare("DELETE FROM gallery_images WHERE id = ?").run(id);
        res.json({ message: "Gallery image deleted." });
    } catch (error) {
        console.error("Gallery deletion failed:", error);
        res.status(502).json({ error: "Could not delete the image from storage. The gallery record was kept." });
    }
}

module.exports = { publicGallery, adminGallery, uploadGalleryImage, updateGalleryImage, removeGalleryImage };
