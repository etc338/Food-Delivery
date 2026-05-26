import mongoose from "mongoose";
import Item from "./models/item.model.js";

mongoose.connect("mongodb://localhost:27017/FoodDelivery").then(async () => {
  const item = await Item.findOne({ name: "dossa" });
  console.log(item);
  process.exit(0);
});
