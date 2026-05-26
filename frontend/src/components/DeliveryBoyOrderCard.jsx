import React from "react";
import { MdPhone } from "react-icons/md";

export default function DeliveryBoyOrderCard({ data }) {
  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleString();
  };

  const status = data.shopOrders?.status || "Unknown";
  
  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            {data.user?.fullName || "Unknown Customer"}
          </h2>
          <p className="flex items-center gap-2 text-sm text-gray-600 mt-1">
            <MdPhone />
            <span>{data.user?.mobile || "No mobile"}</span>
          </p>
          <p className="text-sm text-gray-600 mt-2">
            <strong>Delivery Address:</strong> {data.deliveryAddress?.text || "No address"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-800">Shop: {data.shopOrders?.shop?.name}</p>
          <p className="text-xs text-gray-500">{formatDate(data.createdAt)}</p>
        </div>
      </div>

      <div className="flex space-x-4 overflow-x-auto pb-2">
        {data.shopOrders?.shopOrderItems?.map((item, index) => (
          <div key={index} className="flex-shrink-0 w-40 border rounded-lg p-2 bg-[#fffaf7]">
            <img src={item.image || item.item?.image} alt="" className="w-full h-24 object-cover rounded" />
            <p className="text-sm font-semibold mt-1 truncate">{item.name || item.item?.name}</p>
            <p className="text-xs text-gray-500">
              Qty: {item.quantity} x ₹{item.price}
            </p>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-100">
        <span className="text-sm text-gray-500">Payment: {data.paymentMethod?.toUpperCase()}</span>
        <span className="text-sm font-semibold">
          Status:{" "}
          <span className="capitalize text-[#ff4d2d]">{status}</span>
        </span>
      </div>
    </div>
  );
}
