import mongoose from 'mongoose';

const shopSchema = new mongoose.Schema({
    name: {type: String, required: true},
    image: {type: String, required: true},
    owner:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    city: {type: String, required: true},
    state: {type: String, required: true},
    address: {type: String, required: true},
    rating: {type: Number, default: 0},
    isOpen: {type: Boolean, default: true}, // Tracks if shop is accepting orders
    items: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item"
    }],

}, {timestamps: true});

const Shop = mongoose.model("Shop", shopSchema);

export default Shop;