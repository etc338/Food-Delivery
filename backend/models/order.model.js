import Mongoose from "mongoose";

const shopOrderItemsSchema = new Mongoose.Schema(
  {
    item: { type: Mongoose.Schema.Types.ObjectId, ref: "Item" },
    name: { type: String  },
    image: { type: String },
    price: { type: Number},
    quantity: { type: Number},
  },
  { timestamps: true }
);

const shopOrderSchema = new Mongoose.Schema(
  {
    shop: { type: Mongoose.Schema.Types.ObjectId, ref: "Shop" },
    shopOwner: {
      type: Mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    subtotal: { type: Number },
    shopOrderItems: [shopOrderItemsSchema],
    status: {
      type: String,
      enum: ["Pending", "Preparing", "Out Of Delivery", "Delivered"],
      default: "Pending",
    },
    assignment: { type: Mongoose.Schema.Types.ObjectId, ref: "DeliveryAssignment", default: null },
    assignedDeliveryBoy: { type: Mongoose.Schema.Types.ObjectId, ref: "User"},
  },
  { timestamps: true }
);

const orderSchema = new Mongoose.Schema(
  {
    user: { type: Mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    paymentMethod: { type: String, enum: ["cod", "online"], required: true },
    deliveryAddress: {
      text: { type: String, required: true },
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    totalAmount: { type: Number },
    shopOrders: [shopOrderSchema],
  },
  { timestamps: true }
);
const Order = Mongoose.model("Order", orderSchema);

export default Order;
