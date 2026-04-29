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
          <FaStar key={i} className="text-yellow-500 text-lg" />
        ) : (
          <FaRegStar key={i} className="text-yellow-500 text-lg" />
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
    <div className="w-[250px] rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col">
      <div className="relative w-full h-[160px] flex justify-center items-center bg-gray-50 overflow-hidden">
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-sm z-10">
          {data.foodType === "Veg" ? (
            <FaLeaf className="text-green-600 text-sm" />
          ) : (
            <FaDrumstickBite className="text-red-500 text-sm" />
          )}
        </div>
        <img
          src={data.image}
          alt={data.name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
      </div>
      <div className="flex-1 flex flex-col p-4 pb-2">
        <h1 className="font-bold text-gray-800 text-lg truncate">
          {data.name}
        </h1>
        <div className="flex items-center gap-1 mt-1">
          {renderStars(data.rating?.average || 0)}
          <span className="text-xs text-gray-500 ml-1">
            ({data.rating?.count || 0})
          </span>
        </div>
      </div>
      <div className="flex justify-between items-center px-4 pb-4 pt-2 mt-auto">
        <span className="font-extrabold text-gray-800 text-lg">
          ₹{data.price}
        </span>

        {cartQty > 0 ? (
          <div className="flex items-center bg-orange-50 border border-orange-200 rounded-lg overflow-hidden shadow-sm h-[32px]">
            <button
              onClick={handleDecrese}
              className="px-3 h-full hover:bg-orange-100 flex items-center justify-center text-[#ff4d2d] transition active:bg-orange-200"
            >
              <FaMinus size={12} />
            </button>
            <span className="font-bold text-sm w-[24px] text-center text-gray-800 pointer-events-none">
              {cartQty}
            </span>
            <button
              onClick={handleIncrese}
              className="px-3 h-full hover:bg-orange-100 flex items-center justify-center text-[#ff4d2d] transition active:bg-orange-200"
            >
              <FaPlus size={12} />
            </button>
          </div>
        ) : (
          <button
            onClick={handleIncrese}
            className="text-sm font-bold text-[#ff4d2d] bg-orange-50 hover:bg-orange-100 border border-orange-200 px-5 py-1.5 rounded-lg transition active:scale-95 shadow-sm"
          >
            ADD
          </button>
        )}
      </div>
    </div>
  );
}
