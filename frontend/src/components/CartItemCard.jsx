import React from "react";
import { FaMinus, FaPlus } from "react-icons/fa";
import { CiTrash } from "react-icons/ci";
import { useDispatch } from "react-redux";
import { removeCartItem, updateQuantity } from "../redux/userSlice";

export default function CartItemCard({ data }) {
  const dispatch = useDispatch();
  const handleIncrease = (id, currentQty) => {
    dispatch(updateQuantity({ id, quantity: currentQty + 1 }));
  };
  const handleDecrease = (id, currentQty) => {
    if (currentQty === 1) return;
    dispatch(updateQuantity({ id, quantity: currentQty - 1 }));
  };
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100 gap-4 hover:shadow-md transition-shadow group">
      <div className="flex items-center gap-4 w-full sm:w-auto">
        <div className="relative flex-shrink-0">
          <img
            src={data.image}
            alt={data.name}
            className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl border border-gray-50 shadow-sm group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="flex flex-col flex-1">
          <h1 className="font-black text-gray-800 text-lg sm:text-xl line-clamp-1">{data.name}</h1>
          <p className="text-sm font-medium text-gray-500 mb-1">
            ₹{data.price} <span className="text-gray-400 mx-1">×</span> {data.quantity}
          </p>
          <p className="font-black text-[#ff4d2d] text-lg sm:text-xl mt-auto">
            ₹{data.price * data.quantity}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-3 w-full sm:w-auto justify-end mt-2 sm:mt-0">
        <div className="flex items-center bg-gray-50 border border-gray-100 rounded-xl overflow-hidden shadow-sm h-10">
          <button
            onClick={() => handleDecrease(data.id, data.quantity)}
            className="w-10 h-full hover:bg-orange-50 flex items-center justify-center text-gray-600 hover:text-[#ff4d2d] transition-colors"
          >
            <FaMinus size={12} />
          </button>
          <span className="font-black text-gray-800 text-sm w-6 text-center">
            {data.quantity}
          </span>
          <button
            onClick={() => handleIncrease(data.id, data.quantity)}
            className="w-10 h-full hover:bg-orange-50 flex items-center justify-center text-gray-600 hover:text-[#ff4d2d] transition-colors"
          >
            <FaPlus size={12} />
          </button>
        </div>
        
        <button
          onClick={() => dispatch(removeCartItem(data.id))}
          className="w-10 h-10 bg-red-50/50 hover:bg-red-100 border border-red-100 text-red-500 rounded-xl flex items-center justify-center transition-colors shadow-sm ml-1"
          title="Remove Item"
        >
          <CiTrash size={22} className="stroke-1" />
        </button>
      </div>
    </div>
  );
}
