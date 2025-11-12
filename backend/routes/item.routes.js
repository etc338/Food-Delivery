import express from "express"
import { isAuth } from "../middlewares/isAuth.js"
import { addItem, deleteItem, editItem, getItemByCity, getItemById } from "../controllers/item.controller.js"
import { upload } from "../middlewares/multer.js"

const itemRoutes = express.Router()

itemRoutes.post("/add-item", isAuth, upload.single("image"), addItem)
itemRoutes.get("/get-by-id/:itemId", isAuth, getItemById)
itemRoutes.post("/edit-item/:itemId", isAuth,upload.single("image"), editItem)
itemRoutes.delete("/delete/:itemId", isAuth, deleteItem)
itemRoutes.get("/get-by-city/:city", isAuth, getItemByCity)

export default itemRoutes