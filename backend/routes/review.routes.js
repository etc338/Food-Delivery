import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import { addReview, getShopReviews, canReview } from "../controllers/review.controller.js";

const reviewRoutes = express.Router();

reviewRoutes.post("/add", isAuth, addReview);
reviewRoutes.get("/shop/:shopId", getShopReviews);
reviewRoutes.get("/can-review/:orderId/:shopId", isAuth, canReview);

export default reviewRoutes;
