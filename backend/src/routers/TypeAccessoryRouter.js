const express = require("express");
const router = express.Router();
const typeAccessory = require("../controller/TypeAccessoryController");


router.get("/get-types-accessory", typeAccessory.getTypesAccessory);
module.exports = router;
