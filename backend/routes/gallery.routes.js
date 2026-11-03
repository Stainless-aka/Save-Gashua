const router = require("express").Router();
const { publicGallery } = require("../controllers/gallery.controller");
router.get("/", publicGallery);
module.exports = router;
