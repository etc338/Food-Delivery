import DeliveryAssignment from "../models/deliveryAssignment.model.js";
import Order from "../models/order.model.js";
import Shop from "../models/shop.model.js";
import User from "../models/user.model.js";

export const placeOrder = async (req, res) => {
  try {
    const { cartItems, paymentMethod, deliveryAddress, totalAmount } = req.body;
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
    cartItems.forEach((item) => {
      const shopId = item.shop;
      if (!groupItemsByShop[shopId]) {
        groupItemsByShop[shopId] = [];
      }
      groupItemsByShop[shopId].push(item);
    });
    const shopOrders = [];
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
        (acc, item) => acc + item.price * item.quantity,
        0
      );
      shopOrders.push({
        shop: shop._id,
        shopOwner: shop.owner._id,
        subtotal,
        shopOrderItems: items.map((item) => ({
          item: item._id,
          price: item.price,
          quantity: item.quantity,
          name: item.name,
          image: item.image,
        })),
      });
    }

    // Create the order
    const order = new Order({
      user: req.userId,
      paymentMethod,
      deliveryAddress,
      totalAmount,
      shopOrders,
    });

    await order.populate("shopOrders.shopOrderItems.item", "name image price");
    await order.populate("shopOrders.shop", "name");

    await order.save();
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
        .populate("shopOrders.shop", "name")
        .populate("shopOrders.shopOwner", "name email mobile")
        .populate("shopOrders.shopOrderItems.item", "name image price");
      return res.status(200).json(orders);
    } else if (user.role == "owner") {
      const orders = await Order.find({ "shopOrders.shopOwner": req.userId })
        .sort({ createdAt: -1 })
        .populate("shopOrders.shop", "name")
        .populate("user")
        .populate("shopOrders.shopOrderItems.item", "name image price");

      const filteredOrders = orders.map((order) => ({
        _id: order._id,
        user: order.user,
        paymentMethod: order.paymentMethod,
        shopOrders: order.shopOrders.find((o) => o.shopOwner._id == req.userId),
        createdAt: order.createdAt,
        deliveryAddress: order.deliveryAddress,
      }));

      return res.status(200).json(filteredOrders);
    }
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
      (o) => o._id.toString() === shopId || o.shop.toString() === shopId
    );
    if (!shopOrder) {
      return res.status(404).json({ message: "Shop order not found" });
    }

    shopOrder.status = status;

    let deliveryBoysPayload = [];

    if (status === "Out Of Delivery" || !shopOrder.assignment) {
      const { longitude, latitude } = order.deliveryAddress || {};
      if (longitude == null || latitude == null) {
        // no coordinates — can't search nearby
        await order.save();
        return res.status(200).json({
          message: "Order status updated but delivery address coordinates missing",
        });
      }

      // Use find() to get an array of nearby delivery boys
      const nearByDeliveryBoys = await User.find({
        role: "deliveryBoy",
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

      // Ensure we have an array
      if (!Array.isArray(nearByDeliveryBoys) || nearByDeliveryBoys.length === 0) {
        await order.save();
        return res.status(200).json({
          message: "Order status updated but no nearby delivery boys found",
        });
      }

      const nearByIds = nearByDeliveryBoys.map((b) => b._id);

      // busyIds will be array (distinct)
      const busyIds = await DeliveryAssignment.find({
        assignedTo: { $in: nearByIds },
        status: { $nin: ["brodcasted", "completed"] },
      }).distinct("assignedTo");

      // convert busy ids to strings
      const busyIdset = new Set(busyIds.map((id) => id.toString()));

      // Compare string forms of _id
      const availableBoys = nearByDeliveryBoys.filter(
        (b) => !busyIdset.has(b._id.toString())
      );

      const candidates = availableBoys.map((b) => b._id);

      if (candidates.length === 0) {
        await order.save();
        return res.status(200).json({
          message: "Order status updated but there are no available delivery boys",
        });
      }

      const deliveryAssignment = await DeliveryAssignment.create({
        orderId: order._id,
        shop: shopOrder.shop,
        shopOrderId: shopOrder._id,
        brodcastedTo: candidates,
        status: "brodcasted",
      });

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
    }

    // Save parent doc (this will persist subdoc changes)
    await order.save();
    const updatedShopOrder = order.shopOrders.find(
      (o) => o._id.toString() === shopId || o.shop.toString() === shopId
    );

    // Repopulate for fresh data
    await order.populate("shopOrders.shop", "name");
    await order.populate(
      "shopOrders.assignedDeliveryBoy",
      "fullName mobile email"
    );


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

