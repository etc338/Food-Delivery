import mongoose from 'mongoose';
import Item from './models/item.model.js';

mongoose.connect('mongodb://localhost:27017/food-delivery')
  .then(async () => {
    const items = await Item.find({});
    console.log(items.map(i => ({ name: i.name, rating: i.rating })));
    process.exit(0);
  })
  .catch(console.error);
