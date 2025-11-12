import React from "react";
import { useSelector } from "react-redux";
import { IoArrowBack } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import UserOrderCard from "../components/UserOrderCard";
import OwnerOrderCard from "../components/OwnerOrderCard";

export default function MyOrders() {
  const { userData, myOrders } = useSelector((state) => state.user);
  const navigate = useNavigate();
  return (
    <div className="w-full min-h-screen bg-[#fff9f6] flex justify-center px-4">
      <div className="w-full max-w-[880px] p-4">
        <div className="flex items-center gap-[20px] mb-6 relative">
          <div
            onClick={() => navigate("/")}
            className=" z-[10] text-[#ff4d2d] cursor-pointer"
          >
            <IoArrowBack size={35} />
          </div>
          <h1 className="text-2xl font-bold text-start">My Orders</h1>
        </div>
        <div className="space-y-6">
          {myOrders?.map((order, index) =>
            userData.role === "user" ? (
              <UserOrderCard key={index} data={order} />
            ) : userData.role === "owner" ? (
              <OwnerOrderCard key={index} data={order} />
            ) : null
          )}
        </div>
      </div>
    </div>
  );
}
