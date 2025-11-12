import express from "express"
import { getCurrentUser, updateUserLocation } from "../controllers/user.controller.js"
import { isAuth } from "../middlewares/isAuth.js"

const userRoutes = express.Router()

userRoutes.get("/current", isAuth, getCurrentUser)
userRoutes.post("/update-location", isAuth, updateUserLocation)

export default userRoutes