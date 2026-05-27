import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./models/user.model.js";
import Shop from "./models/shop.model.js";
import Item from "./models/item.model.js";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URL = process.env.MONGODB_URL || "mongodb+srv://etce202_db_user:etc123@cluster0.catdt2l.mongodb.net/food-delivary";

const seed = async () => {
  try {
    await mongoose.connect(MONGODB_URL);
    console.log("Connected to MongoDB");

    // Clear old fake data
    const fakeShopNames = ["Domino's Pizza", "KFC", "Biryani By Kilo", "South Indian Delight", "Sweet Tooth"];
    const shopsToDelete = await Shop.find({ name: { $in: fakeShopNames } });
    for (let s of shopsToDelete) {
        await Item.deleteMany({ shop: s._id });
        await User.deleteOne({ _id: s.owner });
    }
    await Shop.deleteMany({ name: { $in: fakeShopNames } });

    const password = await bcrypt.hash("123456", 10);
    const createOwner = async (name, email) => {
        return await User.create({ fullName: name, email, password, mobile: "999999999" + Math.floor(Math.random()*10), role: "owner" });
    };

    const owner1 = await createOwner("Domino's Admin", `dominos${Date.now()}@test.com`);
    const owner2 = await createOwner("KFC Admin", `kfc${Date.now()}@test.com`);
    const owner3 = await createOwner("BBK Admin", `bbk${Date.now()}@test.com`);
    const owner4 = await createOwner("South Admin", `south${Date.now()}@test.com`);
    const owner5 = await createOwner("Sweet Admin", `sweet${Date.now()}@test.com`);

    // Shops
    const shop1 = await Shop.create({
      name: "Domino's Pizza",
      image: "https://loremflickr.com/800/400/pizzeria?lock=1",
      owner: owner1._id,
      city: "Ahmedabad",
      state: "Gujarat",
      address: "SG Highway, Gota",
      rating: 4.5
    });

    const shop2 = await Shop.create({
      name: "KFC",
      image: "https://loremflickr.com/800/400/kfc,chicken?lock=1",
      owner: owner2._id,
      city: "Ahmedabad",
      state: "Gujarat",
      address: "Sindhu Bhavan Road",
      rating: 4.2
    });

    const shop3 = await Shop.create({
      name: "Biryani By Kilo",
      image: "https://loremflickr.com/800/400/biryani?lock=1",
      owner: owner3._id,
      city: "Ahmedabad",
      state: "Gujarat",
      address: "Navrangpura",
      rating: 4.7
    });

    const shop4 = await Shop.create({
      name: "South Indian Delight",
      image: "https://loremflickr.com/800/400/dosa,idli?lock=1",
      owner: owner4._id,
      city: "Ahmedabad",
      state: "Gujarat",
      address: "Vastrapur",
      rating: 4.6
    });

    const shop5 = await Shop.create({
      name: "Sweet Tooth",
      image: "https://loremflickr.com/800/400/dessert,sweets?lock=1",
      owner: owner5._id,
      city: "Ahmedabad",
      state: "Gujarat",
      address: "Prahlad Nagar",
      rating: 4.8
    });

    // Items
    const createItems = async (shop, itemsData, keyword) => {
        for (let i = 0; i < itemsData.length; i++) {
            const item = itemsData[i];
            const created = await Item.create({ 
                ...item, 
                shop: shop._id,
                image: `https://loremflickr.com/600/400/${keyword}?lock=${i + 1}`
            });
            shop.items.push(created._id);
        }
        await shop.save();
    };

    const pizzas = [
      { name: "Margherita Pizza", category: "Pizza", price: 199, foodType: "veg" },
      { name: "Farmhouse Pizza", category: "Pizza", price: 399, foodType: "veg" },
      { name: "Peppy Paneer Pizza", category: "Pizza", price: 459, foodType: "veg" },
      { name: "Mexican Green Wave", category: "Pizza", price: 399, foodType: "veg" },
      { name: "Deluxe Veggie", category: "Pizza", price: 450, foodType: "veg" },
      { name: "Chicken Sausage Pizza", category: "Pizza", price: 349, foodType: "non veg" },
      { name: "Chicken Golden Delight", category: "Pizza", price: 499, foodType: "non veg" },
      { name: "Non Veg Supreme", category: "Pizza", price: 599, foodType: "non veg" },
      { name: "Garlic Breadsticks", category: "Snacks", price: 129, foodType: "veg" },
      { name: "Stuffed Garlic Bread", category: "Snacks", price: 169, foodType: "veg" }
    ];
    await createItems(shop1, pizzas, "pizza");

    const kfcItems = [
      { name: "Zinger Burger", category: "Burger", price: 199, foodType: "non veg" },
      { name: "Veg Zinger Burger", category: "Burger", price: 179, foodType: "veg" },
      { name: "Hot & Crispy Chicken (4pc)", category: "Fast Food", price: 349, foodType: "non veg" },
      { name: "Chicken Popcorn", category: "Snacks", price: 149, foodType: "non veg" },
      { name: "Chicken Strips (3pc)", category: "Snacks", price: 169, foodType: "non veg" },
      { name: "Mingles Bucket", category: "Fast Food", price: 399, foodType: "non veg" },
      { name: "Smoky Red Chicken", category: "Fast Food", price: 249, foodType: "non veg" },
      { name: "Fries (Large)", category: "Snacks", price: 119, foodType: "veg" },
      { name: "Choco Lava Cake", category: "Dessert", price: 99, foodType: "veg" },
      { name: "Chicken Roll", category: "Fast Food", price: 149, foodType: "non veg" }
    ];
    await createItems(shop2, kfcItems, "burger");

    const bbkItems = [
      { name: "Hyderabadi Chicken Biryani", category: "Main Course", price: 499, foodType: "non veg" },
      { name: "Lucknowi Chicken Biryani", category: "Main Course", price: 549, foodType: "non veg" },
      { name: "Kolkata Chicken Biryani", category: "Main Course", price: 529, foodType: "non veg" },
      { name: "Hyderabadi Mutton Biryani", category: "Main Course", price: 699, foodType: "non veg" },
      { name: "Veg Hyderabadi Biryani", category: "Main Course", price: 349, foodType: "veg" },
      { name: "Paneer Biryani", category: "Main Course", price: 399, foodType: "veg" },
      { name: "Chicken Tikka", category: "Snacks", price: 299, foodType: "non veg" },
      { name: "Mutton Galouti Kebab", category: "Snacks", price: 449, foodType: "non veg" },
      { name: "Paneer 65", category: "Snacks", price: 249, foodType: "veg" },
      { name: "Phirni", category: "Dessert", price: 149, foodType: "veg" }
    ];
    await createItems(shop3, bbkItems, "biryani");

    const southItems = [
      { name: "Masala Dosa", category: "South Indian", price: 120, foodType: "veg" },
      { name: "Mysore Masala Dosa", category: "South Indian", price: 150, foodType: "veg" },
      { name: "Paneer Dosa", category: "South Indian", price: 180, foodType: "veg" },
      { name: "Idli Sambar (3pc)", category: "South Indian", price: 80, foodType: "veg" },
      { name: "Medu Vada (2pc)", category: "South Indian", price: 90, foodType: "veg" },
      { name: "Uttapam", category: "South Indian", price: 130, foodType: "veg" },
      { name: "Rava Dosa", category: "South Indian", price: 140, foodType: "veg" },
      { name: "Upma", category: "South Indian", price: 70, foodType: "veg" },
      { name: "Filter Coffee", category: "Other", price: 50, foodType: "veg" },
      { name: "Kesari Bath", category: "Dessert", price: 90, foodType: "veg" }
    ];
    await createItems(shop4, southItems, "dosa");

    const sweets = [
      { name: "Gulab Jamun (2pc)", category: "Dessert", price: 80, foodType: "veg" },
      { name: "Rasgulla (2pc)", category: "Dessert", price: 80, foodType: "veg" },
      { name: "Rasmalai (2pc)", category: "Dessert", price: 120, foodType: "veg" },
      { name: "Chocolate Brownie", category: "Dessert", price: 150, foodType: "veg" },
      { name: "Vanilla Ice Cream", category: "Dessert", price: 90, foodType: "veg" },
      { name: "Chocolate Truffle Pastry", category: "Dessert", price: 110, foodType: "veg" },
      { name: "Kaju Katli (250g)", category: "Dessert", price: 250, foodType: "veg" },
      { name: "Motichoor Laddoo (250g)", category: "Dessert", price: 180, foodType: "veg" },
      { name: "Red Velvet Cake (500g)", category: "Dessert", price: 550, foodType: "veg" },
      { name: "Black Forest Cake (500g)", category: "Dessert", price: 450, foodType: "veg" }
    ];
    await createItems(shop5, sweets, "dessert");

    console.log("Seeding complete! 50 items added.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seed();
