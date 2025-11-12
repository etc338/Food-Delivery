import express from "express"
import { isAuth } from "../middlewares/isAuth.js"
import { createEditShop, getMyShop, getShopByCity } from "../controllers/shop.controller.js"
import { upload } from "../middlewares/multer.js"

const shopRoutes = express.Router()

shopRoutes.post("/create-edit", isAuth, upload.single("image"), createEditShop)
shopRoutes.get("/get-my", isAuth, getMyShop) 
shopRoutes.get("/get-by-city/:city", isAuth, getShopByCity)

export default shopRoutes