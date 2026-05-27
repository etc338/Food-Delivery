import Review from "../models/review.model.js";
import Shop from "../models/shop.model.js";
import Order from "../models/order.model.js";
import Item from "../models/item.model.js";

export const addReview = async (req, res) => {
  try {
    const { shopId, orderId, rating, comment, deliveryRating, foodQuality } = req.body;
    
    // Check if order exists and belongs to user
    const order = await Order.findById(orderId);
    if (!order || order.user.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    // Check if order is delivered
    const shopOrder = order.shopOrders.find(so => so.shop.toString() === shopId);
    if (!shopOrder || shopOrder.status !== "delivered") {
      return res.status(400).json({ message: "Can only review delivered orders" });
    }
    
    // Check if already reviewed
    const existingReview = await Review.findOne({ user: req.userId, order: orderId });
    if (existingReview) {
      return res.status(400).json({ message: "Already reviewed this order" });
    }
    
    const review = await Review.create({
      user: req.userId,
      shop: shopId,
      order: orderId,
      rating,
      comment,
      deliveryRating,
      foodQuality,
    });
    
    // Update shop average rating
    const reviews = await Review.find({ shop: shopId });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await Shop.findByIdAndUpdate(shopId, { rating: avgRating.toFixed(1) });
    
    // Distribute the foodQuality rating to all individual items in this order
    const itemRatingToApply = foodQuality > 0 ? foodQuality : rating;
    if (itemRatingToApply > 0) {
      for (const orderItem of shopOrder.shopOrderItems) {
        let itemDoc = null;
        if (orderItem.item) {
          itemDoc = await Item.findById(orderItem.item);
        }
        if (!itemDoc && orderItem.name) {
          itemDoc = await Item.findOne({ name: orderItem.name });
        }
        
        if (itemDoc) {
          const currentCount = itemDoc.rating?.count || 0;
          const currentAverage = itemDoc.rating?.average || 0;
          
          const newCount = currentCount + 1;
          const newTotal = (currentAverage * currentCount) + itemRatingToApply;
          
          itemDoc.rating.average = Number((newTotal / newCount).toFixed(1));
          itemDoc.rating.count = newCount;
          
          itemDoc.markModified('rating');
          await itemDoc.save();
        }
      }
    }
    
    return res.status(201).json({ message: "Review added successfully", review });
  } catch (error) {
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const getShopReviews = async (req, res) => {
  try {
    const { shopId } = req.params;
    const reviews = await Review.find({ shop: shopId })
      .populate("user", "fullName")
      .sort({ createdAt: -1 })
      .limit(50);
    
    return res.status(200).json(reviews);
  } catch (error) {
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const canReview = async (req, res) => {
  try {
    const { orderId, shopId } = req.params;
    
    const existingReview = await Review.findOne({ user: req.userId, order: orderId, shop: shopId });
    
    return res.status(200).json({ canReview: !existingReview });
  } catch (error) {
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};
