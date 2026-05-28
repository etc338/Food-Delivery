import Item from "../models/item.model.js";
import Shop from "../models/shop.model.js";
import uploadOnCloudinary from "../utilis/cloudinary.js";
import { getIo } from "../socket.js";
import { generateEmbedding } from "../utilis/embedding.js";

export const addItem = async (req, res) => {
  try {
    const { name, category, foodType, price } = req.body;
    let image;
    if (req.file) {
      image = await uploadOnCloudinary(req.file.path);
    }
    const shop = await Shop.findOne({ owner: req.userId });
    if (!shop) {
      return res.status(400).json({ message: "shop not found" });
    }
    console.log(shop, "shop");

    // Generate vector embedding for RAG
    const textToEmbed = `${name} - ${category} - ${foodType}`;
    const embedding = await generateEmbedding(textToEmbed);

    const item = await Item.create({
      name,
      image,
      shop: shop._id,
      category,
      foodType,
      price,
      embedding: embedding.length > 0 ? embedding : undefined, // Save embedding
    });
    shop.items.push(item._id);
    await shop.save();
    await shop.populate("owner");
    await shop.populate({
      path: "items",
      options: { sort: { createdAt: -1 } },
    });

    return res.status(201).json({ message: "Item added successfully", shop });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

export const toggleItemStatus = async (req, res) => {
  try {
    const itemId = req.params.itemId;
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }
    
    // Toggle the availability
    item.isAvailable = item.isAvailable === false ? true : false;
    await item.save();
    
    // Broadcast real-time update
    getIo().emit("itemStatusChanged", { itemId: item._id, isAvailable: item.isAvailable });
    
    return res.status(200).json({ message: `Item is now ${item.isAvailable ? 'In Stock' : 'Out of Stock'}`, isAvailable: item.isAvailable });
  } catch (error) {
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const editItem = async (req, res) => {
  try {
    const itemId = req.params.itemId;
    const { name, category, foodType, price } = req.body;
    let image;
    if (req.file) {
      image = await uploadOnCloudinary(req.file.path);
    }
    
    // Update vector embedding for RAG
    const textToEmbed = `${name} - ${category} - ${foodType}`;
    const embedding = await generateEmbedding(textToEmbed);
    
    const updateData = {
      name,
      image,
      category,
      foodType,
      price,
    };
    
    if (embedding.length > 0) {
      updateData.embedding = embedding;
    }

    const item = await Item.findByIdAndUpdate(
      itemId,
      updateData,
      { new: true }
    );
    if (!item) {
      return res.status(400).json({ message: "Item not found" });
    }
    const shop = await Shop.findOne({ owner: req.userId }).populate({
      path: "items",
      options: { sort: { createdAt: -1 } },
    });
    return res.status(200).json({ message: "Item updated successfully", shop });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

export const getItemById = async (req, res) => {
  try {
    const itemId = req.params.itemId;
    const item = await Item.findById(itemId).populate("shop");
    if (!item) {
      return res.status(400).json({ message: "Item not found" });
    }
    return res.status(200).json(item);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

export const deleteItem = async (req, res) => {
  try {
    const itemId = req.params.itemId;
    const item = await Item.findByIdAndDelete(itemId);
    if (!item) {
      return res.status(400).json({ message: "Item not found" });
    }
    const shop = await Shop.findOne({ owner: req.userId });
    shop.items = shop.items.filter((i) => i._id !== item._id);
    await shop.save();
    await shop.populate({
      path: "items",
      options: { sort: { createdAt: -1 } },
    });
    return res.status(200).json({ message: "Item deleted successfully" }, shop);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

export const getItemByCity = async (req, res) => {
  try {
    const { city } = req.params;
    if (!city) {
      return res.status(400).json({ message: "City is required" });
    }

    const shops = await Shop.find({
      city: { $regex: new RegExp(`^${city}$`, "i") },
    }).populate("items");
    if (!shops) {
      return res.status(400).json({ message: "No shop found" });
    }
    const shopIds = shops.map((shop) => shop._id);
    const items = await Item.find({ shop: { $in: shopIds } });
    return res.status(200).json(items);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

export const getTrendingItems = async (req, res) => {
  try {
    // Get random 20 items from all cities as "trending"
    // In production, you'd track actual order counts
    const items = await Item.aggregate([
      { $sample: { size: 20 } }
    ]);
    
    // Populate shop details
    await Item.populate(items, { path: 'shop', select: 'name city state' });
    
    return res.status(200).json(items);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};
