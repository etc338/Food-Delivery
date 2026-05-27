import React, { useState, useEffect } from "react";
import { MdPhone, MdLocationOn } from "react-icons/md";
import { serverUrl } from "../App";
import axios from "axios";
import { useDispatch } from "react-redux";
import { updateOrderStatus } from "../redux/userSlice";
import { useSocket } from "../context/SocketContext";
import { FaUserCircle } from "react-icons/fa";
import { IoClose } from "react-icons/io5";

export default function OwnerOrderCard({ data }) {
  const [availableBoys, setAvailableBoys] = useState([]);
  const [localStatus, setLocalStatus] = useState(data?.shopOrders?.status || "");
  const [assignedBoy, setAssignedBoy] = useState(data.shopOrders?.assignedDeliveryBoy || null);
  const [timeoutMessage, setTimeoutMessage] = useState("");
  const dispatch = useDispatch();

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleString("en-GB", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
  };

  const socketRef = useSocket();

  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return;

    const handleStatusUpdate = ({ orderId, status }) => {
      if (orderId?.toString() === data._id?.toString()) {
        setLocalStatus(status);
      }
    };

    const handleOrderAssigned = ({ orderId, assignedBoy }) => {
      if (orderId?.toString() === data._id?.toString()) {
        setAssignedBoy(assignedBoy);
      }
    };

    const handleDeliveryBoyBusy = ({ boyId }) => {
      setAvailableBoys((prev) => prev.filter((b) => b.id?.toString() !== boyId?.toString() && b._id?.toString() !== boyId?.toString()));
    };

    const handleDeliveryBoyFree = () => {
      if (localStatus === "Out Of Delivery" && !assignedBoy) {
        if (!data?.shopOrders?.shop?._id) return;
        axios
          .get(`${serverUrl}/api/order/get-assignment-boys/${data._id}/${data.shopOrders.shop._id}`, {
            withCredentials: true,
          })
          .then((res) => {
            if (res.data?.availableBoys) {
              setAvailableBoys(res.data.availableBoys);
            }
          })
          .catch(() => {});
      }
    };

    const handleDeliveryTimeout = ({ orderId }) => {
      if (orderId === data._id) {
        setTimeoutMessage(`Timeout! No delivery partners accepted this order. You may need to cancel or re-assign.`);
      }
    };

    socket.on("order:status_updated", handleStatusUpdate);
    socket.on("order:assigned", handleOrderAssigned);
    socket.on("delivery_boy_busy", handleDeliveryBoyBusy);
    socket.on("delivery_boy_free", handleDeliveryBoyFree);
    socket.on("delivery_timeout", handleDeliveryTimeout);
    return () => {
      socket.off("order:status_updated", handleStatusUpdate);
      socket.off("order:assigned", handleOrderAssigned);
      socket.off("delivery_boy_busy", handleDeliveryBoyBusy);
      socket.off("delivery_boy_free", handleDeliveryBoyFree);
      socket.off("delivery_timeout", handleDeliveryTimeout);
    };
  }, [socketRef?.current, data._id, localStatus, assignedBoy]);

  useEffect(() => {
    if (localStatus === "Out Of Delivery" && availableBoys.length === 0) {
      if (!data?.shopOrders?.shop?._id) return;
      axios
        .get(`${serverUrl}/api/order/get-assignment-boys/${data._id}/${data.shopOrders.shop._id}`, {
          withCredentials: true,
        })
        .then((res) => {
          if (res.data?.availableBoys?.length > 0) {
            setAvailableBoys(res.data.availableBoys);
          }
        })
        .catch(() => {});
    }
  }, [localStatus]);

  const handleUpdateStatus = async (orderId, shopId, status) => {
    if (!status) return;
    try {
      const result = await axios.put(
        `${serverUrl}/api/order/update-status/${orderId}/${shopId}`,
        { status },
        { withCredentials: true },
      );
      dispatch(updateOrderStatus({ orderId, shopId, status }));
      setLocalStatus(status);
      if (result.data?.availableBoys?.length > 0) {
        setAvailableBoys(result.data.availableBoys);
      }
    } catch (error) {
      console.log("Error updating status:", error);
    }
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
    <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-5 sm:p-6 space-y-6 hover:shadow-lg transition-all duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-gray-100 pb-5">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100 flex-shrink-0 mt-1">
            <FaUserCircle className="text-gray-300 text-3xl" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-800 tracking-tight">{data.user?.fullName || "Unknown Customer"}</h2>
            <div className="flex flex-col gap-1 mt-1.5">
              <span className="flex items-center gap-1.5 text-sm font-medium text-gray-500 bg-gray-50 px-2.5 py-0.5 rounded-md w-fit">
                <MdPhone className="text-[#ff4d2d]" /> {data.user?.mobile || "No mobile"}
              </span>
              <span className="text-sm font-medium text-gray-500">{data.user?.email || "No email"}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-start sm:items-end w-full sm:w-auto">
          <div className="flex items-start gap-1.5 bg-orange-50/50 p-2.5 rounded-xl border border-orange-100 max-w-xs w-full">
            <MdLocationOn className="text-[#ff4d2d] text-lg flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-gray-700 leading-tight">{data.deliveryAddress?.text || "No address provided"}</p>
          </div>
          <p className="text-xs font-bold text-gray-400 mt-2">{formatDate(data.createdAt)}</p>
        </div>
      </div>

      <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
        <p className="font-bold text-gray-500 text-sm mb-3 ml-1">Order Items</p>
        <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
          {data.shopOrders?.shopOrderItems?.map((item, index) => (
            <div key={index} className="flex-shrink-0 w-40 border border-white rounded-xl p-2 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="w-full h-24 rounded-lg overflow-hidden mb-2">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <p className="text-sm font-bold text-gray-800 line-clamp-1">{item.name}</p>
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs font-medium text-gray-500">Qty: {item.quantity}</p>
                <p className="text-sm font-black text-[#ff4d2d]">₹{item.price}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {timeoutMessage && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-sm animate-fadeIn gap-3">
          <div className="flex items-center gap-3 text-red-700">
             <span className="text-xl">⚠️</span>
             <p className="font-bold text-sm leading-tight">{timeoutMessage}</p>
          </div>
          <button 
            onClick={() => setTimeoutMessage("")}
            className="text-red-400 hover:text-red-600 transition-colors bg-white p-1 rounded-full shadow-sm flex-shrink-0"
          >
            <IoClose size={20} />
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-center bg-white border border-gray-100 p-4 rounded-2xl shadow-sm gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <span className="text-sm font-bold text-gray-500">Status:</span>
          <span className={`px-4 py-1.5 rounded-lg border text-sm font-bold capitalize ${getStatusColor(localStatus)}`}>
            {localStatus}
          </span>
        </div>

        {localStatus !== "delivered" && localStatus !== "Cancelled" && localStatus !== "cancelled" && (
          <div className="w-full sm:w-auto">
            <select
              onChange={(e) => handleUpdateStatus(data._id, data.shopOrders?.shop?._id, e.target.value)}
              className="w-full sm:w-auto bg-white border-2 border-gray-200 text-gray-700 text-sm font-bold rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#ff4d2d] focus:ring-4 focus:ring-[#ff4d2d]/10 transition-all cursor-pointer"
              value={localStatus}
            >
              <option value="pending">Pending</option>
              <option value="preparing">Preparing</option>
              <option value="Out Of Delivery">Out Of Delivery</option>
              <option value="Cancelled">Reject/Cancel</option>
            </select>
          </div>
        )}
      </div>

      {localStatus === "Out Of Delivery" && (
        <div className="mt-3 p-5 border border-orange-100 rounded-2xl text-sm bg-gradient-to-br from-orange-50 to-white shadow-sm animate-slideDown">
          <p className="font-black text-gray-800 mb-3 text-base">
            {assignedBoy ? "✅ Assigned Delivery Partner" : "🔍 Finding Delivery Partners"}
          </p>

          {assignedBoy ? (
            <div className="bg-white p-3 rounded-xl border border-green-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-800 text-base">{assignedBoy.fullName}</p>
                <p className="text-green-600 font-medium text-sm flex items-center gap-1 mt-0.5">
                  <MdPhone /> {assignedBoy.mobile}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-500 font-bold text-xs border border-green-100">
                Active
              </div>
            </div>
          ) : availableBoys?.length > 0 ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableBoys.map((b, i) => (
                  <div key={i} className="bg-white p-3 rounded-xl border border-blue-100 shadow-sm flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 font-bold text-xs flex-shrink-0">
                      {b.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{b.name}</p>
                      <p className="text-gray-500 text-xs font-medium">{b.mobile}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-orange-500 bg-orange-100/50 p-2 rounded-lg justify-center animate-pulse">
                ⏳ Waiting for a partner to accept...
              </div>
            </div>
          ) : (
            <div className="bg-white p-4 rounded-xl border border-yellow-200 shadow-sm text-center">
              <div className="w-10 h-10 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-2 text-yellow-500 text-lg">
                ⏳
              </div>
              <p className="font-bold text-gray-700">Searching for nearby partners...</p>
              <p className="text-xs font-medium text-gray-500 mt-1">
                Broadcasting to delivery partners within 5km radius.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between items-end mt-4 pt-5 border-t border-gray-100">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Customer Paid</span>
          <span className="font-black text-gray-800 text-lg">₹{data.totalAmount || "0"}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs font-bold text-green-600/70 uppercase tracking-wider mb-0.5">Your Earnings</span>
          <div className="font-black text-green-600 text-2xl bg-green-50 px-4 py-1.5 rounded-xl border border-green-200 shadow-sm">
            ₹{data.shopOrders.subtotal}
          </div>
        </div>
      </div>
    </div>
  );
}
