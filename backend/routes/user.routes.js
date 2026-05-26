import express from "express"
import { getCurrentUser, updateUserLocation, toggleOnlineStatus } from "../controllers/user.controller.js"
import { isAuth } from "../middlewares/isAuth.js"

const userRoutes = express.Router()

userRoutes.get("/current", isAuth, getCurrentUser)
userRoutes.post("/update-location", isAuth, updateUserLocation)
userRoutes.put("/toggle-status", isAuth, toggleOnlineStatus)

export default userRoutes