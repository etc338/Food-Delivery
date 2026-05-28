import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    image: { type: String },
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Snacks",
        "Main Course",
        "Dessert",
        "Pizza",
        "Burger",
        "Sandwich",
        "South Indian",
        "North Indian",
        "Chinese",
        "Fast Food",
        "Other",
      ],
    },
    price: { type: Number, min: 0, required: true },
    foodType: { type: String, enum: ["veg", "non veg", "Veg", "Non Veg"], required: true },
    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    isAvailable: { type: Boolean, default: true }, // Tracks if item is in stock
    embedding: { type: [Number], select: false }, // Vector embedding for AI search
  },
  { timestamps: true }
);

const Item = mongoose.model("Item", itemSchema);

export default Item;
