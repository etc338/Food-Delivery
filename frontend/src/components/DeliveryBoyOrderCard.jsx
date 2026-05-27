import React, { useState, useEffect } from "react";
import { MdPhone, MdLocationOn } from "react-icons/md";
import { FaUserCircle, FaStore, FaMapMarkerAlt } from "react-icons/fa";
import { useSocket } from "../context/SocketContext";

export default function DeliveryBoyOrderCard({ data }) {
  const [localStatus, setLocalStatus] = useState(data.shopOrders?.status || "Unknown");
  const socketRef = useSocket();

  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return;

    const handleStatusUpdate = ({ orderId, status }) => {
      if (orderId?.toString() === data._id?.toString()) {
        setLocalStatus(status);
      }
    };

    socket.on("order:status_updated", handleStatusUpdate);
    return () => socket.off("order:status_updated", handleStatusUpdate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socketRef?.current, data._id]);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleString("en-GB", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
  };

  const getStatusColor = (status) => {
    if (!status) return "text-gray-500 bg-gray-100";
    const s = status.toLowerCase();
    if (s === "delivered") return "text-green-600 bg-green-50 border-green-200";
    if (s === "cancelled") return "text-red-500 bg-red-50 border-red-200";
    if (s === "out of delivery") return "text-blue-600 bg-blue-50 border-blue-200";
    return "text-orange-500 bg-orange-50 border-orange-200";
  };
  
  return (
    <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-5 sm:p-6 space-y-6 hover:shadow-lg transition-all duration-300 w-full group">
      
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-gray-100 pb-5">
        <div className="flex items-start gap-3 w-full sm:w-auto">
          <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100 flex-shrink-0 mt-1">
            <FaUserCircle className="text-gray-300 text-3xl" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-black text-gray-800 tracking-tight">{data.user?.fullName || "Unknown Customer"}</h2>
            <div className="flex flex-col gap-1.5 mt-1.5">
              <span className="flex items-center gap-1.5 text-sm font-medium text-gray-500 bg-gray-50 px-2.5 py-1 rounded-md w-fit border border-gray-100">
                <MdPhone className="text-[#ff4d2d]" /> {data.user?.mobile || "No mobile"}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-start sm:items-end w-full sm:w-auto mt-2 sm:mt-0">
          <div className="flex items-center gap-1.5 mb-1.5">
             <FaStore className="text-gray-400" />
             <p className="text-sm font-black text-gray-700">Shop: {data.shopOrders?.shop?.name}</p>
          </div>
          <p className="text-xs font-bold text-gray-400">{formatDate(data.createdAt)}</p>
        </div>
      </div>

      <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100/50 flex items-start gap-3 shadow-sm">
        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm flex-shrink-0 border border-orange-100 mt-1">
          <MdLocationOn className="text-[#ff4d2d] text-lg" />
        </div>
        <div>
          <p className="text-xs font-bold text-orange-500/80 uppercase tracking-wider mb-1">Delivery Address</p>
          <p className="text-sm font-bold text-gray-700 leading-relaxed">
            {data.deliveryAddress?.text || "No address provided"}
          </p>
        </div>
      </div>

      <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
        <p className="font-bold text-gray-500 text-sm mb-3 ml-1">Order Items</p>
        <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
          {data.shopOrders?.shopOrderItems?.map((item, index) => (
            <div key={index} className="flex-shrink-0 w-40 border border-white rounded-xl p-2.5 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="w-full h-24 rounded-lg overflow-hidden mb-2 border border-gray-50">
                <img src={item.image || item.item?.image} alt={item.name || item.item?.name} className="w-full h-full object-cover" />
              </div>
              <p className="text-sm font-bold text-gray-800 line-clamp-1">{item.name || item.item?.name}</p>
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs font-medium text-gray-500">Qty: {item.quantity}</p>
                <p className="text-sm font-black text-[#ff4d2d]">₹{item.price}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center pt-5 border-t border-gray-100 gap-4">
        <div className="flex flex-col">
          <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-1">Payment Method</span>
          <span className="font-black text-gray-800 text-sm">{data.paymentMethod?.toUpperCase()}</span>
        </div>
        
        <div className="flex flex-col sm:items-end">
          <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-1">Status</span>
          <span className={`px-4 py-1.5 rounded-xl border text-sm font-bold capitalize shadow-sm ${getStatusColor(localStatus)}`}>
            {localStatus}
          </span>
        </div>
      </div>
    </div>
  );
}
