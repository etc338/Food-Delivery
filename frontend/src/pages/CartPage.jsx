import React from "react";
import { IoArrowBack } from "react-icons/io5";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import CartItemCard from "../components/CartItemCard";
import { FaShoppingCart } from "react-icons/fa";

export default function CartPage() {
  const navigate = useNavigate();
  const { cartItems, totalAmount } = useSelector((state) => state.user);
  
  return (
    <div className="min-h-screen bg-[#fcfaf8] flex flex-col items-center pt-8 pb-20 px-4">
      <div className="w-full max-w-[800px] animate-slideUp">
        <div className="flex items-center gap-4 mb-8 bg-white p-4 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
          <button
            onClick={() => navigate("/")}
            className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-[#ff4d2d] hover:bg-orange-100 transition-colors"
          >
            <IoArrowBack size={24} />
          </button>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-2">
            Your Cart
          </h1>
        </div>
        
        {cartItems?.length === 0 ? (
          <div className="bg-white rounded-[32px] p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center flex flex-col items-center border border-gray-100 animate-fadeIn mt-6">
            <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mb-6">
              <FaShoppingCart className="text-[#ff4d2d] text-4xl opacity-50" />
            </div>
            <p className="text-gray-800 text-2xl font-black mb-2">Your Cart is Empty</p>
            <p className="text-gray-500 font-medium mb-8">Looks like you haven't added anything to your cart yet.</p>
            <button 
              onClick={() => navigate("/")} 
              className="bg-gradient-to-r from-[#ff4d2d] to-[#ff7a55] text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-[#ff4d2d]/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
            >
              Browse Restaurants
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 animate-fadeIn">
            <div className="space-y-4">
              {cartItems?.map((item, index) => (
                <CartItemCard data={item} key={index} />
              ))}
            </div>
            
            <div className="mt-8 bg-gradient-to-br from-orange-50/50 to-white p-5 rounded-2xl border border-orange-100 flex justify-between items-center shadow-sm">
              <h1 className="text-lg font-bold text-gray-500 uppercase tracking-wider">Total Amount</h1>
              <span className="text-3xl font-black text-[#ff4d2d]">
                ₹{totalAmount}
              </span>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => navigate("/checkout")} 
                className="w-full sm:w-auto bg-gradient-to-r from-[#ff4d2d] to-[#ff7a55] text-white px-10 py-4 rounded-2xl text-lg font-black shadow-lg shadow-[#ff4d2d]/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
