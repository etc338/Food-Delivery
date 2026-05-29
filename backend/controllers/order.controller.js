import DeliveryAssignment from "../models/deliveryAssignment.model.js";
import Item from "../models/item.model.js";
import Order from "../models/order.model.js";
import Shop from "../models/shop.model.js";
import User from "../models/user.model.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import { getIo } from "../socket.js";

// ─────────────────────────────────────────────────────────────────
//  HELPER: Calculate Distance (Haversine Formula)
// ─────────────────────────────────────────────────────────────────
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c; 
}

export const createRazorpayOrder = async (req, res) => {
  try {
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: req.body.amount * 100, // amount in paise
      currency: "INR",
      receipt: "receipt_order_" + Math.random().toString(36).substring(7),
    };

    const order = await instance.orders.create(options);
    if (!order) return res.status(500).json({ message: "Some error occured" });

    res.json(order);
  } catch (error) {
    console.error("Razorpay Error:", error);
    res.status(500).json({
      message:
        error?.error?.description || error.message || "Failed to create order",
    });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      return res.status(200).json({ message: "Payment verified successfully" });
    } else {
      return res.status(400).json({ message: "Invalid signature sent!" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const placeOrder = async (req, res) => {
  try {
    const { cartItems, paymentMethod, paymentId, deliveryAddress, totalAmount } = req.body;
    if (cartItems.length === 0 || !cartItems) {
      return res.status(400).json({ message: "Cart is empty" });
    }
    if (
      !deliveryAddress.text ||
      !deliveryAddress.latitude ||
      !deliveryAddress.longitude
    ) {
      return res.status(400).json({ message: "Delivery address is required" });
    }
    const groupItemsByShop = {};
    for (const item of cartItems) {
      // Safely extract the shop ID, whether the frontend sent it as a string or a populated object.
      const shopId = typeof item.shop === "object" ? (item.shop._id || item.shop.id) : item.shop;
      
      if (!groupItemsByShop[shopId]) {
        groupItemsByShop[shopId] = [];
      }
      
      // CRITICAL SECURITY FIX: Fetch the REAL item from the database
      // Never trust the price sent by the frontend, a hacker could change it to ₹1!
      const DatabaseItem = await Item.findById(item.id || item._id);
      if (!DatabaseItem) {
         return res.status(404).json({ message: `Item not found in database: ${item.name}` });
      }

      // Override the frontend price with the authoritative database price
      item.realPrice = DatabaseItem.price;
      groupItemsByShop[shopId].push(item);
    }
    
    const shopOrders = [];
    let backendCalculatedTotal = 0; // The true total
    
    for (const shopId of Object.keys(groupItemsByShop)) {
      const shop = await Shop.findById(shopId).populate("owner");
      if (!shop) {
        return res.status(404).json({ message: `Shop not found: ${shopId}` });
      }
      if (!shop.owner) {
        return res
          .status(404)
          .json({ message: `Shop owner not found for shop: ${shopId}` });
      }
      const items = groupItemsByShop[shopId];
      const subtotal = items.reduce(
        (acc, item) => acc + item.realPrice * item.quantity,
        0,
      );
      backendCalculatedTotal += subtotal;
      
      shopOrders.push({
        shop: shop._id,
        shopOwner: shop.owner._id,
        subtotal,
        shopOrderItems: items.map((item) => ({
          item: item.id || item._id,
          price: item.realPrice, // Saved the real price!
          quantity: item.quantity,
          name: item.name,
          image: item.image,
        })),
      });
    }

    // Add delivery fee logic just like frontend
    const deliveryFee = backendCalculatedTotal > 500 ? 0 : 40;
    backendCalculatedTotal += deliveryFee;

    // Security check: Did the user pay the correct amount?
    if (paymentMethod === "online" && totalAmount !== backendCalculatedTotal) {
       return res.status(400).json({ message: "Security Alert: Payment amount mismatch detected." });
    }

    // Create the order
    const order = new Order({
      user: req.userId,
      paymentMethod,
      paymentId,
      deliveryAddress,
      totalAmount,
      shopOrders,
    });

    await order.populate("shopOrders.shopOrderItems.item", "name image price");
    await order.populate("shopOrders.shop", "name");

    await order.save();

    // Notify each shop owner that they have a new order.
    try {
      const io = getIo();
      shopOrders.forEach((so) => {
        if (so.shopOwner) {
          io.to(so.shopOwner.toString()).emit("new:order", { orderId: order._id });
        }
      });
    } catch (err) {
      console.error(err);
    }

    res.status(201).json({ message: "Order placed successfully", order });

  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.role == "user") {
      const orders = await Order.find({ user: req.userId })
        .sort({ createdAt: -1 })
        .limit(50)
        .populate("shopOrders.shop", "name")
        .populate("shopOrders.shopOwner", "name email mobile")
        .populate("shopOrders.shopOrderItems.item", "name image price");
      return res.status(200).json(orders);
    } else if (user.role == "owner") {
      const orders = await Order.find({ "shopOrders.shopOwner": req.userId })
        .sort({ createdAt: -1 })
        .limit(50)
        .populate("shopOrders.shop", "name")
        .populate("user")
        .populate("shopOrders.shopOrderItems.item", "name image price")
        .populate("shopOrders.assignedDeliveryBoy", "fullName mobile");

      const filteredOrders = orders.map((order) => ({
        _id: order._id,
        user: order.user,
        paymentMethod: order.paymentMethod,
        totalAmount: order.totalAmount,
        shopOrders: order.shopOrders.find(
          (o) => o.shopOwner.toString() === req.userId.toString(),
        ),
        createdAt: order.createdAt,
        deliveryAddress: order.deliveryAddress,
      }));

      return res.status(200).json(filteredOrders);
    } else if (user.role == "deliveryBoy") {
      const orders = await Order.find({ "shopOrders.assignedDeliveryBoy": req.userId })
        .sort({ createdAt: -1 })
        .limit(50)
        .populate("shopOrders.shop", "name")
        .populate("user", "fullName mobile email")
        .populate("shopOrders.shopOrderItems.item", "name image price");

      const filteredOrders = orders.map((order) => ({
        _id: order._id,
        user: order.user,
        paymentMethod: order.paymentMethod,
        shopOrders: order.shopOrders.find(
          (o) => o.assignedDeliveryBoy?.toString() === req.userId.toString(),
        ),
        createdAt: order.createdAt,
        deliveryAddress: order.deliveryAddress,
      }));

      return res.status(200).json(filteredOrders);
    }
    return res.status(200).json([]);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId, shopId } = req.params;
    const { status } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const shopOrder = order.shopOrders.find(
      (o) => o._id.toString() === shopId || o.shop.toString() === shopId,
    );
    if (!shopOrder) {
      return res.status(404).json({ message: "Shop order not found" });
    }

    shopOrder.status = status;

    let deliveryBoysPayload = [];

    // When order is delivered → mark the assignment as completed so the delivery
    // boy is freed up and won't appear "busy" for future orders.
    if (status === "delivered" && shopOrder.assignment) {
      await DeliveryAssignment.findByIdAndUpdate(shopOrder.assignment, {
        status: "completed",
      });
      
      // ── DYNAMIC ALGORITHMIC EARNINGS (Surge Pricing) ──
      if (shopOrder.assignedDeliveryBoy) {
        const dboy = await User.findById(shopOrder.assignedDeliveryBoy);
        
        let distanceKm = 5; // Default average distance
        // Calculate distance from the delivery boy's last recorded GPS to customer
        if (dboy && dboy.location?.coordinates && order.deliveryAddress) {
           distanceKm = calculateDistance(
             order.deliveryAddress.latitude, 
             order.deliveryAddress.longitude, 
             dboy.location.coordinates[1], 
             dboy.location.coordinates[0]
           );
           // If they are already standing at the customer door, distance might be 0. 
           // We ensure a minimum distance pay of 2km just in case.
           if (distanceKm < 2) distanceKm = 2; 
        }

        // 1. Base Pay (Standard pick-up fee)
        let payout = 20; 
        
        // 2. Distance Pay (₹7 for every kilometer driven)
        payout += (distanceKm * 7); 
        
        // 3. Time Zone & Traffic Surge Modifiers
        const currentHour = new Date().getHours();
        
        if (currentHour >= 23 || currentHour <= 4) {
          payout += 30; // Late Night Surge (Harder to find drivers)
        } else if (currentHour >= 19 && currentHour <= 22) {
          payout += 15; // Peak Dinner Traffic Surge
        } else if (currentHour >= 12 && currentHour <= 15) {
          payout += 10; // Peak Lunch Traffic Surge
        }

        const finalPayout = Math.ceil(payout);

        await User.findByIdAndUpdate(shopOrder.assignedDeliveryBoy, {
          $inc: { totalEarnings: finalPayout }
        });
        console.log(`Paid dynamic fee of ₹${finalPayout} (Dist: ${distanceKm.toFixed(1)}km, Hr: ${currentHour}) to Driver ${shopOrder.assignedDeliveryBoy}`);
      }

      try {
        const io = getIo();
        io.emit("delivery_boy_free");
      } catch (err) {
        console.error(err);
      }
    }

    if (status.toLowerCase() === "cancelled" && shopOrder.assignment) {
      try {
        const assignment = await DeliveryAssignment.findById(shopOrder.assignment);
        if (assignment && assignment.status === "brodcasted") {
          assignment.status = "cancelled";
          await assignment.save();
          
          const io = getIo();
          // Tell all broadcasted boys to remove this assignment from their screen
          assignment.brodcastedTo.forEach((boyId) => {
            io.to(boyId.toString()).emit("assignment:taken", {
              assignmentId: assignment._id,
            });
          });
        }
      } catch (err) {
        console.error("Error cancelling assignment:", err);
      }
    }

    if (status === "Out Of Delivery" && !shopOrder.assignment) {
      const { longitude, latitude } = order.deliveryAddress || {};
      console.log("Delivery address coordinates:", { longitude, latitude });

      if (longitude == null || latitude == null) {
        // no coordinates — can't search nearby
        await order.save();
        return res.status(200).json({
          message:
            "Order status updated but delivery address coordinates missing",
          availableBoys: [],
        });
      }

      // Use find() to get an array of nearby delivery boys
      const nearByDeliveryBoys = await User.find({
        role: "deliveryBoy",
        isOnline: true,
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [longitude, latitude],
            },
            $maxDistance: 5000, // 5 km
          },
        },
      });

      console.log("Found nearby delivery boys:", nearByDeliveryBoys.length);

      // Ensure we have an array
      if (
        !Array.isArray(nearByDeliveryBoys) ||
        nearByDeliveryBoys.length === 0
      ) {
        await order.save();
        return res.status(200).json({
          message: "Order status updated but no nearby delivery boys found",
          availableBoys: [],
        });
      }

      const nearByIds = nearByDeliveryBoys.map((b) => b._id);

      // busyIds will be array (distinct)
      const busyIds = await DeliveryAssignment.find({
        assignedTo: { $in: nearByIds },
        status: { $nin: ["brodcasted", "completed"] },
      }).distinct("assignedTo");

      console.log("Busy delivery boys:", busyIds.length);

      // convert busy ids to strings
      const busyIdset = new Set(busyIds.map((id) => id.toString()));

      // Compare string forms of _id
      const availableBoys = nearByDeliveryBoys.filter(
        (b) => !busyIdset.has(b._id.toString()),
      );

      console.log("Available delivery boys:", availableBoys.length);

      const candidates = availableBoys.map((b) => b._id);

      if (candidates.length === 0) {
        await order.save();
        return res.status(200).json({
          message:
            "Order status updated but there are no available delivery boys",
          availableBoys: [],
        });
      }

      const deliveryAssignment = await DeliveryAssignment.create({
        orderId: order._id,
        shop: shopOrder.shop,
        shopOrderId: shopOrder._id,
        brodcastedTo: candidates,
        status: "brodcasted",
      });

      console.log("Created delivery assignment:", deliveryAssignment._id);

      // Note: assignedTo is probably not set yet; keep assignment id
      shopOrder.assignedDeliveryBoy = deliveryAssignment.assignedTo || null;
      shopOrder.assignment = deliveryAssignment._id;

      deliveryBoysPayload = availableBoys.map((b) => {
        return {
          id: b._id,
          name: b.fullName,
          mobile: b.mobile,
          longitude: b.location?.coordinates?.[0],
          latitude: b.location?.coordinates?.[1],
        };
      });

      // Notify each available delivery boy in real-time via Socket.io.
      // Each delivery boy is in a room named after their userId (set on "join" event).
      const io = getIo();
      candidates.forEach((boyId) => {
        io.to(boyId.toString()).emit("new:assignment", {
          assignmentId: deliveryAssignment._id,
          shopName: shopOrder.shop?.name,
          deliveryAddress: order.deliveryAddress,
        });
      });

      // Add a 5-minute timeout. If no one accepts, notify the Shop Owner.
      setTimeout(async () => {
        try {
          const assignment = await DeliveryAssignment.findById(deliveryAssignment._id);
          if (assignment && assignment.status === "brodcasted" && !assignment.assignedTo) {
            assignment.status = "failed";
            await assignment.save();
            
            // Notify Shop Owner
            if (shopOrder.shopOwner) {
              io.to(shopOrder.shopOwner.toString()).emit("delivery_timeout", {
                orderId: order._id,
                shopId: shopOrder.shop.toString()
              });
            }
          }
        } catch (e) {
          console.error("Timeout handler error:", e);
        }
      }, 5 * 60 * 1000);
      

      // Also notify the customer that their order is out for delivery.
      io.to(order.user.toString()).emit("order:status_updated", {
        orderId: order._id,
        shopId: shopOrder.shop.toString(),
        status,
      });
    }

    // Save parent doc (this will persist subdoc changes)
    await order.save();
    const updatedShopOrder = order.shopOrders.find(
      (o) => o._id.toString() === shopId || o.shop.toString() === shopId,
    );

    // Repopulate for fresh data
    await order.populate("shopOrders.shop", "name");
    await order.populate(
      "shopOrders.assignedDeliveryBoy",
      "fullName mobile email",
    );

    if (status !== "Out Of Delivery") {
      try {
        const io = getIo();
        io.to(order.user.toString()).emit("order:status_updated", {
          orderId: order._id,
          shopId: shopOrder.shop.toString(),
          status,
        });
        
        if (shopOrder.shopOwner) {
          io.to(shopOrder.shopOwner.toString()).emit("order:status_updated", {
            orderId: order._id,
            shopId: shopOrder.shop.toString(),
            status,
          });
        }
      } catch (err) {
        console.error(err);
      }
    }

    return res.status(200).json({
      shopOrder: updatedShopOrder,
      assignedDeliveryBoys: updatedShopOrder?.assignedDeliveryBoy || null,
      availableBoys: deliveryBoysPayload,
      assignment: updatedShopOrder?.assignment ?? null,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

export const getDevliveryBoyAssignments = async (req, res) => {
  try {
    const deliveryBoyId = req.userId;
    const assignment = await DeliveryAssignment.find({
      brodcastedTo: deliveryBoyId,
      status: "brodcasted",
    })
      .populate("orderId")
      .populate("shop");

    // Extra layer of protection: Filter out any assignments where the shop order has been cancelled
    // (This handles old dirty database records from before the cancellation fix)
    const validAssignments = assignment.filter(a => {
      if (!a.orderId || !a.orderId.shopOrders) return false;
      const so = a.orderId.shopOrders.find(so => so.shop.toString() === a.shop._id.toString());
      if (!so || so.status.toLowerCase() === "cancelled" || so.status.toLowerCase() === "cancel") {
        // Optionally mark it as failed in DB to clean it up
        a.status = "failed";
        a.save().catch(e => console.error(e));
        return false;
      }
      return true;
    });

    const formated = validAssignments.map((a) => ({
      assignmentId: a._id,
      orderId: a.orderId._id,
      shopName: a.shop.name,
      deliveryAddress: a.orderId.deliveryAddress,
      items:
        a.orderId.shopOrders.find(
          (so) => so.shop.toString() === a.shop._id.toString(),
        )?.shopOrderItems || [],
      subtotal: a.orderId.shopOrders.find(
        (so) => so.shop.toString() === a.shop._id.toString(),
      )?.subtotal,
    }));

    return res.status(200).json(formated);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

export const acceptOrder = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const assignment = await DeliveryAssignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }
    if (assignment.status !== "brodcasted") {
      return res.status(400).json({ message: "Assignment is not available" });
    }

    const alreadyAssigned = await DeliveryAssignment.findOne({
      assignedTo: req.userId,
      status: { $nin: ["brodcasted", "completed"] },
    });

    if (alreadyAssigned) {
      return res
        .status(400)
        .json({ message: "You have already accepted another order" });
    }

    assignment.assignedTo = req.userId;
    assignment.status = "assigned";
    assignment.acceptedAt = new Date();
    await assignment.save();

    const order = await Order.findById(assignment.orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    const shopOrder = order.shopOrders.find(
      (so) => so._id.toString() === assignment.shopOrderId.toString(),
    );
    if (!shopOrder) {
      return res.status(404).json({ message: "Shop order not found" });
    }
    shopOrder.assignedDeliveryBoy = req.userId;
    await order.save();

    // Tell the customer their delivery boy is on the way.
    try {
      const io = getIo();
      io.to(order.user.toString()).emit("order:status_updated", {
        orderId: order._id,
        shopId: assignment.shop.toString(),
        status: "Out Of Delivery",
        deliveryBoyId: req.userId,
      });

      // Tell every OTHER delivery boy who was broadcast that someone already accepted.
      assignment.brodcastedTo.forEach((boyId) => {
        if (boyId.toString() !== req.userId.toString()) {
          io.to(boyId.toString()).emit("assignment:taken", {
            assignmentId: assignment._id,
          });
        }
      });

      // Tell the Shop Owner who accepted it
      if (shopOrder.shopOwner) {
        const deliveryBoy = await User.findById(req.userId).select("fullName mobile");
        io.to(shopOrder.shopOwner.toString()).emit("order:assigned", {
          orderId: order._id,
          assignedBoy: deliveryBoy
        });
      }

      // Tell everyone that this boy is now busy so they can remove him from available lists
      io.emit("delivery_boy_busy", { boyId: req.userId });
    } catch (err) {
      console.error(err);
    }

    return res
      .status(200)
      .json({ message: "Order accepted successfully", order });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

export const getCurrentOrder = async (req, res) => {
  try {
    const assignment = await DeliveryAssignment.findOne({
      assignedTo: req.userId,
      status: "assigned",
    })
      .populate("assignedTo", "fullName mobile email location")
      .populate("shop", "name")
      .populate({
        path: "orderId",
        populate: [
          { path: "user", select: "fullName mobile email, location" },
          { path: "shopOrders.shop", select: "name" },
          {
            path: "shopOrders.shopOrderItems.item",
            select: "name image price",
          },
        ],
      });
    if (!assignment) {
      return res.status(200).json(null);
    }
    if (!assignment.orderId) {
      return res.status(200).json(null);
    }
    const shopOrder = assignment.orderId.shopOrders.find(
      (so) => so.shop._id.toString() === assignment.shop._id.toString(),
    );
    if (!shopOrder) {
      return res.status(404).json({ message: "Shop order not found" });
    }
    let deliveryBoyLocation = { lat: null, lon: null };
    if (assignment.assignedTo.location.coordinates.length == 2) {
      deliveryBoyLocation.lat = assignment.assignedTo.location.coordinates[1];
      deliveryBoyLocation.lon = assignment.assignedTo.location.coordinates[0];
    }
    let customerLocation = { lat: null, lon: null };
    if (assignment.orderId.deliveryAddress) {
      customerLocation.lat = assignment.orderId.deliveryAddress.latitude;
      customerLocation.lon = assignment.orderId.deliveryAddress.longitude;
    }

    return res.status(200).json({
      _id: assignment.orderId._id,
      user: assignment.orderId.user,
      shopOrder,
      deliveryBoyLocation,
      customerLocation,
      deliveryAddress: assignment.orderId.deliveryAddress,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

export const trackOrder = async (req, res) => {
  try {
    const { orderId, shopId } = req.params;

    const order = await Order.findById(orderId)
      .populate("user", "fullName mobile")
      .populate("shopOrders.shop", "name")
      .populate("shopOrders.assignedDeliveryBoy", "fullName mobile location");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const shopOrder = order.shopOrders.find(
      (so) => so.shop._id.toString() === shopId || so._id.toString() === shopId,
    );

    if (!shopOrder) {
      return res.status(404).json({ message: "Shop order not found" });
    }
    
    // ── LIVE ETA CALCULATION ──
    let estimatedTime = "Calculating...";
    const currentStatus = shopOrder.status?.toLowerCase() || "pending";
    
    if (currentStatus === "out of delivery" || currentStatus === "picked") {
      const dboy = shopOrder.assignedDeliveryBoy;
      if (dboy && dboy.location?.coordinates && order.deliveryAddress) {
        const dboyLon = dboy.location.coordinates[0];
        const dboyLat = dboy.location.coordinates[1];
        const userLat = order.deliveryAddress.latitude;
        const userLon = order.deliveryAddress.longitude;
        
        const distanceKm = calculateDistance(userLat, userLon, dboyLat, dboyLon);
        const etaMins = Math.ceil((distanceKm / 20) * 60) + 5;
        
        estimatedTime = `~${etaMins} mins`;
      } else {
        estimatedTime = "10-15 mins";
      }
    } else if (currentStatus === "preparing") {
      estimatedTime = "25-30 mins";
    } else if (currentStatus === "pending") {
      estimatedTime = "35-40 mins";
    }

    return res.status(200).json({
      status: shopOrder.status,
      deliveryBoy: shopOrder.assignedDeliveryBoy,
      deliveryAddress: order.deliveryAddress,
      estimatedTime: estimatedTime,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

export const getAssignmentBoys = async (req, res) => {
  try {
    const { orderId, shopId } = req.params;
    const assignment = await DeliveryAssignment.findOne({
      orderId,
      shop: shopId,
      status: "brodcasted",
    });

    if (!assignment) {
      return res.status(200).json({ availableBoys: [] });
    }

    const order = await Order.findById(orderId);
    if (!order || !order.deliveryAddress) {
      return res.status(200).json({ availableBoys: [] });
    }
    const { longitude, latitude } = order.deliveryAddress;

    // Run the live query again to get ALL currently online boys nearby
    const nearByDeliveryBoys = await User.find({
      role: "deliveryBoy",
      isOnline: true,
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          $maxDistance: 5000,
        },
      },
    });

    const nearByIds = nearByDeliveryBoys.map((b) => b._id);

    // Find busy ones
    const busyIds = await DeliveryAssignment.find({
      assignedTo: { $in: nearByIds },
      status: { $nin: ["brodcasted", "completed", "failed"] },
    }).distinct("assignedTo");

    const busyIdset = new Set(busyIds.map((id) => id.toString()));

    const availableBoys = nearByDeliveryBoys
      .filter((b) => !busyIdset.has(b._id.toString()))
      .map((b) => ({
        id: b._id,
        name: b.fullName,
        mobile: b.mobile,
        longitude: b.location?.coordinates?.[0],
        latitude: b.location?.coordinates?.[1],
      }));

    // Update the assignment's broadcastedTo so new boys can accept it
    assignment.brodcastedTo = availableBoys.map(b => b.id);
    await assignment.save();
    
    try {
      const io = getIo();
      availableBoys.forEach((boy) => {
        io.to(boy.id.toString()).emit("new:assignment", {
          assignmentId: assignment._id,
          deliveryAddress: order.deliveryAddress,
        });
      });
    } catch(err) {
      console.error(err);
    }

    return res.status(200).json({ availableBoys });
  } catch (error) {
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    // Only allow cancellation if ALL shop orders are still Pending
    const canCancel = order.shopOrders.every(so => so.status.toLowerCase() === 'pending');
    
    if (!canCancel) {
      return res.status(400).json({ message: "Cannot cancel order. It is already being processed." });
    }
    
    // Update all shop orders to Cancelled
    order.shopOrders.forEach(so => {
      so.status = "Cancelled";
    });
    
    // Automatic Razorpay Refund
    if (order.paymentMethod === "online" && order.paymentId) {
      try {
        const instance = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID,
          key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
        // We refund the full amount. In a real app you might want partial refunds if only one shop cancelled.
        await instance.payments.refund(order.paymentId, {
          amount: order.totalAmount * 100, // paise
          speed: "optimum"
        });
        console.log(`Successfully refunded ${order.totalAmount} for order ${order._id}`);
      } catch (refundError) {
        console.error("Razorpay refund failed:", refundError);
      }
    }
    
    await order.save();
    
    const io = getIo();
    // Notify shop owners
    order.shopOrders.forEach(so => {
      if (so.shopOwner) {
        io.to(so.shopOwner.toString()).emit("order:status_updated", {
          orderId: order._id,
          shopId: so.shop.toString(),
          status: "Cancelled"
        });
      }
    });
    
    return res.status(200).json({ message: "Order cancelled successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};
