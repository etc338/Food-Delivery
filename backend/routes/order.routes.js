import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import {
  acceptOrder,
  getCurrentOrder,
  getDevliveryBoyAssignments,
  getMyOrders,
  placeOrder,
  updateOrderStatus,
  createRazorpayOrder,
  verifyPayment,
} from "../controllers/order.controller.js";

const orderRoutes = express.Router();

orderRoutes.post("/place-order", isAuth, placeOrder);
orderRoutes.post("/create-razorpay-order", isAuth, createRazorpayOrder);
orderRoutes.post("/verify-payment", isAuth, verifyPayment);
orderRoutes.get("/my-orders", isAuth, getMyOrders);
orderRoutes.get("/get-assignments", isAuth, getDevliveryBoyAssignments);
orderRoutes.get("/get-current-order", isAuth, getCurrentOrder);
orderRoutes.post("/update-status/:orderId/:shopId", isAuth, updateOrderStatus);
orderRoutes.get("/accept-order/:assignmentId", isAuth, acceptOrder);

export default orderRoutes;
