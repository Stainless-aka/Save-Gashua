require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const path = require("path");
const donationRoutes = require("./routes/donation.routes");
const galleryRoutes = require("./routes/gallery.routes");
const adminRoutes = require("./routes/admin.routes");

const app = express();
app.set("trust proxy", 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "12mb" }));
app.use(express.static(path.join(__dirname, "../frontend")));

app.use("/api/donations", donationRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/admin", adminRoutes);
app.get("/health", (_req, res) => res.json({ status: "ok" }));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Save Gashua running on port ${port}`));
