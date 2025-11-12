import express from "express"
import { isAuth } from "../middlewares/isAuth.js"
import { getMyOrders, placeOrder, updateOrderStatus } from "../controllers/order.controller.js"


const orderRoutes = express.Router()

orderRoutes.post("/place-order", isAuth, placeOrder)
orderRoutes.get("/my-orders", isAuth, getMyOrders) 
orderRoutes.post("/update-status/:orderId/:shopId", isAuth, updateOrderStatus) 

export default orderRoutes