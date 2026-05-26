import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDb from './config/db.js';
import Item from './models/item.model.js';

dotenv.config();

const run = async () => {
  try {
    await connectDb();
    
    const items = await Item.find({});
    console.log(`Found ${items.length} items`);
    
    for (const item of items) {
      if (!item.rating || item.rating.count === 0) {
        // Generate random rating between 3.5 and 5.0
        const avg = (Math.random() * 1.5 + 3.5).toFixed(1);
        // Generate random count between 5 and 45
        const count = Math.floor(Math.random() * 40) + 5;
        
        item.rating = {
          average: Number(avg),
          count: count
        };
        await item.save();
      }
    }
    console.log('Seeded item ratings successfully!');
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

run();
