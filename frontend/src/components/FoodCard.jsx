import React from "react";
import { FaLeaf } from "react-icons/fa";
import { FaDrumstickBite } from "react-icons/fa";
import { FaStar } from "react-icons/fa";
import { FaRegStar } from "react-icons/fa";
import { FaMinus } from "react-icons/fa";
import { FaPlus } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, updateQuantity, removeCartItem } from "../redux/userSlice";

export default function FoodCard({ data }) {
  const dispatch = useDispatch();
  const { cartItems } = useSelector((state) => state.user);

  const cartItem = cartItems.find((i) => i.id === data._id);
  const cartQty = cartItem ? cartItem.quantity : 0;

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        i <= rating ? (
          <FaStar key={i} className="text-amber-400 text-[15px]" />
        ) : (
          <FaRegStar key={i} className="text-gray-200 text-[15px]" />
        ),
      );
    }
    return stars;
  };

  const handleIncrese = () => {
    if (cartQty === 0) {
      dispatch(
        addToCart({
          id: data._id,
          name: data.name,
          price: data.price,
          image: data.image,
          shop: data.shop,
          quantity: 1,
          foodType: data.foodType,
        }),
      );
    } else {
      dispatch(updateQuantity({ id: data._id, quantity: cartQty + 1 }));
    }
  };

  const handleDecrese = () => {
    if (cartQty === 1) {
      dispatch(removeCartItem(data._id));
    } else if (cartQty > 1) {
      dispatch(updateQuantity({ id: data._id, quantity: cartQty - 1 }));
    }
  };

  return (
    <div className={`w-[260px] rounded-[24px] border border-gray-100 bg-white shadow-[0_4px_20px_rgb(0,0,0,0.03)] overflow-hidden transition-all duration-400 flex flex-col group relative ${data.isAvailable === false ? 'opacity-70 grayscale' : 'hover:shadow-[0_20px_40px_rgb(255,77,45,0.12)] hover:-translate-y-1.5'}`}>
      <div className="relative w-full h-[180px] flex justify-center items-center bg-gray-50 overflow-hidden">
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md rounded-md p-1.5 shadow-sm z-10 border border-white/50">
          {data.foodType === "Veg" ? (
            <div className="w-4 h-4 border-[2px] border-green-600 flex items-center justify-center rounded-sm">
              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
            </div>
          ) : (
            <div className="w-4 h-4 border-[2px] border-red-600 flex items-center justify-center rounded-sm">
              <div className="w-2 h-2 bg-red-600 rounded-full"></div>
            </div>
          )}
        </div>
        <img
          src={data.image}
          alt={data.name}
          className={`w-full h-full object-cover transition-transform duration-700 ${data.isAvailable === false ? '' : 'group-hover:scale-110'}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        {data.isAvailable === false && (
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex justify-center items-center z-20">
            <span className="bg-red-600 text-white font-black text-[13px] px-4 py-1.5 rounded-lg shadow-lg uppercase tracking-wider -rotate-12 scale-110 border-2 border-white">
              Out of Stock
            </span>
          </div>
        )}
      </div>
      <div className="flex-1 flex flex-col p-5 pb-3 bg-white z-10">
        <h1 className="font-extrabold text-gray-800 text-[19px] leading-tight line-clamp-1 group-hover:text-[#ff4d2d] transition-colors duration-300">
          {data.name}
        </h1>
        <div className="flex items-center gap-1 mt-2">
          <div className="flex gap-0.5">
             {renderStars(data.rating?.average || 0)}
          </div>
          <span className="text-[13px] font-bold text-gray-400 ml-1">
            ({data.rating?.count || 0})
          </span>
        </div>
      </div>
      <div className="flex justify-between items-center px-5 pb-5 pt-1 mt-auto bg-white z-10">
        <div className="flex flex-col">
          <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-0.5">Price</span>
          <span className="font-black text-gray-800 text-[22px] leading-none">
            ₹{data.price}
          </span>
        </div>

        {data.isAvailable === false ? (
          <button
            disabled
            className="text-[13px] font-bold text-gray-400 bg-gray-100 px-5 py-2.5 rounded-xl cursor-not-allowed"
          >
            N/A
          </button>
        ) : cartQty > 0 ? (
          <div className="flex items-center bg-white border-[2px] border-[#ff4d2d] rounded-xl overflow-hidden shadow-sm h-[38px] animate-fadeIn">
            <button
              onClick={handleDecrese}
              className="w-[34px] h-full hover:bg-orange-50 flex items-center justify-center text-[#ff4d2d] transition-colors active:bg-orange-100"
            >
              <FaMinus size={12} />
            </button>
            <span className="font-black text-[15px] w-[26px] text-center text-[#ff4d2d] pointer-events-none">
              {cartQty}
            </span>
            <button
              onClick={handleIncrese}
              className="w-[34px] h-full hover:bg-orange-50 flex items-center justify-center text-[#ff4d2d] transition-colors active:bg-orange-100"
            >
              <FaPlus size={12} />
            </button>
          </div>
        ) : (
          <button
            onClick={handleIncrese}
            className="text-[14px] font-bold text-white bg-gradient-to-r from-[#ff4d2d] to-[#ff7a55] hover:shadow-lg hover:shadow-[#ff4d2d]/30 px-6 py-2.5 rounded-xl transition-all duration-300 active:scale-95 animate-fadeIn"
          >
            ADD
          </button>
        )}
      </div>
    </div>
  );
}
