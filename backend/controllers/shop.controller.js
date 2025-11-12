import Shop from "../models/shop.model.js";
import uploadOnCloudinary from "../utilis/cloudinary.js";

export const createEditShop = async (req, res) => {
    try {
        const {name, city, address, state} = req.body
        let image;
        if(req.file){
            image = await uploadOnCloudinary(req.file.path)
        }
        let shop =  await Shop.findOne({owner: req.userId})
        if(!shop){
             shop = await Shop.create({
            name, image, owner: req.userId, city, address, state
        })
        }else{
            shop = await Shop.findByIdAndUpdate(shop._id,{
            name, image, owner: req.userId, city, address, state
        }, {new: true} )
        }
       
        await shop.populate("owner items")
        return res.status(201).json({ message: 'Shop created successfully', shop
        })
    } catch (error) {
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
}

export const getMyShop = async (req, res) => {
    try {
        const shop = await Shop.findOne({owner:req.userId}).populate("items").populate({path: "items", options: { sort: { createdAt: -1 } }});
        if(!shop){
            return res.status(200).json({ shop: null })
        }
        return res.status(200).json({ shop })
    } catch (error) {
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
}

export const getShopByCity = async (req, res) => {
    try {
        const {city} = req.params;

        const shops = await Shop.find({city: {$regex: new RegExp(`^${city}$`, "i")}}).populate('items')
        if (!shops){
            return res.status(400).json({ message: 'No shop found' });
        }
        return res.status(200).json(shops)
    } catch (error) {
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
}