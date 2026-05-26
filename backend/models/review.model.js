import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
    },
    deliveryRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    foodQuality: {
      type: Number,
      min: 1,
      max: 5,
    },
  },
  { timestamps: true }
);

// Prevent duplicate reviews for same order
reviewSchema.index({ user: 1, order: 1 }, { unique: true });

const Review = mongoose.model("Review", reviewSchema);
export default Review;
