const router=require("express").Router();
const {createDonation}=require("../controllers/donation.controller");
router.post("/",createDonation);
module.exports=router;
