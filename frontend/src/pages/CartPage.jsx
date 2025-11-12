import React from "react";
import { IoArrowBack } from "react-icons/io5";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import CartItemCard from "../components/CartItemCard";

export default function CartPage() {
  const navigate = useNavigate();
  const { cartItems, totalAmount } = useSelector((state) => state.user);
  return (
    <div className="min-h-screen bg-[#fff9f6] flex justify-center p-6">
      <div className="w-full max-w-[800px]">
        <div className="flex items-center gap-[20px] mb-6 relative">
          <div
            onClick={() => navigate("/")}
            className=" z-[10] text-[#ff4d2d] cursor-pointer"
          >
            <IoArrowBack size={35} />
          </div>
          <h1 className="text-2xl font-bold text-start">Your Cart</h1>
        </div>
        {cartItems?.length === 0 ? (
          <p className="text-gray-500 text-lg text-center">
            Your Cart is Empty
          </p>
        ) : (
          <>
            <div className="space-y-4">
              {cartItems?.map((item, index) => (
                <CartItemCard data={item} key={index} />
              ))}
            </div>
            <div className="mt-6 bg-white p-4 rounded-xl shadow flex justify-between items-center border">
              <h1 className="text-xl font-bold text-[#ff4d2d]">Total Amount</h1>
              <span className="text-xl font-bold text-[#ff4d2d]">
                ₹{totalAmount}
              </span>
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={() => navigate("/checkout")} className="bg-[#ff4d2d] cursor-pointer text-white px-6 py-3 rounded-lg text-lg font-medium hover:bg-[#e64526] transition">
                Proceed to CheckOut
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
